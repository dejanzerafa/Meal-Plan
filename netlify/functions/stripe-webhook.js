// netlify/functions/stripe-webhook.js
// Receives Stripe events, updates Supabase, sends emails via Resend.
//
// ── Events handled ────────────────────────────────────────────────────────────
//   checkout.session.completed       → upsert user, record subscription, welcome email
//   invoice.payment_failed           → escalating dunning emails (attempt 1 / 2 / final)
//   customer.subscription.updated    → sync status/period to subscriptions table
//   customer.subscription.deleted    → downgrade profiles.tier to free in Supabase + win-back email
//
// ── Required environment variables ───────────────────────────────────────────
//   STRIPE_SECRET_KEY        — sk_live_... (or sk_test_... in dev)
//   STRIPE_WEBHOOK_SECRET    — whsec_... (Stripe dashboard → Webhooks → endpoint → signing secret)
//   SUPABASE_URL             — https://xxx.supabase.co
//   SUPABASE_SERVICE_KEY     — service_role key (NEVER expose client-side)
//   RESEND_API_KEY           — re_... (optional; emails silently skipped if missing)
//   FROM_EMAIL               — e.g. SoulGainz <admin@soulgainz.app>
//   APP_URL                  — e.g. https://soulgainz.app

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const APP_URL = process.env.APP_URL || "https://soulgainz.app";
const FROM_EMAIL = process.env.FROM_EMAIL || "SoulGainz <admin@soulgainz.app>";
const PORTAL_URL = `${APP_URL}/.netlify/functions/customer-portal`;

exports.handler = async (event) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return { statusCode: 500, body: "Stripe env vars not configured" };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // ── Verify webhook signature ──────────────────────────────────────────────
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers["stripe-signature"],
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    switch (stripeEvent.type) {

      // ── Successful checkout ─────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const tier = session.metadata?.tier || "unknown";
        const recipeId = session.metadata?.recipeId || null;
        const email = session.customer_details?.email || session.customer_email;
        const stripeCustomerId = session.customer;
        const amount = (session.amount_total || 0) / 100;

        // 1. Upsert user row
        const { data: user, error: userErr } = await supabase
          .from("users")
          .upsert(
            { email, stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() },
            { onConflict: "email" }
          )
          .select()
          .single();

        if (userErr) { console.error("User upsert error:", userErr); break; }

        // 2. Record the purchase — subscriptions only (monthly / annual)
        if (!["monthly", "annual"].includes(tier)) {
          console.warn(`Unexpected tier "${tier}" in checkout.session.completed — skipping`);
          break;
        }
        {
          // Fetch real period end from Stripe subscription object
          let realPeriodEnd = null;
          if (session.subscription && tier !== "lifetime" && tier !== "seasonal") {
            try {
              const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
              realPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
            } catch (subErr) {
              console.error("Could not retrieve subscription from Stripe:", subErr.message);
              realPeriodEnd = tier === "annual"
                ? new Date(Date.now() + 365 * 86400 * 1000).toISOString()
                : tier === "monthly"
                ? new Date(Date.now() + 30 * 86400 * 1000).toISOString()
                : null;
            }
          }

          const { error: subInsertErr } = await supabase.from("subscriptions").insert({
            user_id: user.id,
            stripe_subscription_id: session.subscription || null,
            stripe_session_id: session.id,
            tier,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: realPeriodEnd,
            amount_paid: amount,
          });
          if (subInsertErr?.code === "23505") {
            console.log("Duplicate checkout.session.completed skipped:", session.id);
            break;
          }
          if (subInsertErr) {
            console.error("Subscription insert error:", subInsertErr);
            break; // Don't provision or email on unexpected insert failure
          }

          // 2b. Write tier into profiles so re-login on any device gets correct access
          const { error: profileErr } = await supabase
            .from("profiles")
            .update({
              tier,
              tier_via: "stripe",
              tier_expires: realPeriodEnd,
            })
            .eq("email", email);
          if (profileErr) {
            // Profile row may not exist yet — upsert by auth user id isn't available here,
            // log and continue so payment isn't lost
            console.error("Profile tier update error:", profileErr);
          } else {
            console.log(`Profile tier set to "${tier}" for ${email}`);
          }
        }

        // 3. Log event
        await supabase.from("events").insert({
          user_id: user.id,
          event_type: "payment_succeeded",
          metadata: { tier, recipeId, amount },
        }).catch(e => console.error("Event log error:", e));

        // 4. Welcome / receipt email
        await sendEmail({
          to: email,
          subject: getEmailSubject(tier),
          html: getEmailBody(tier, recipeId, amount),
        });

        break;
      }

      // ── Payment failed — escalating dunning ─────────────────────────────
      // Stripe fires this on EACH retry attempt. attempt_count tells us which one.
      // Smart Retries (configured in Stripe dashboard) typically retries 3-4 times
      // over ~4 weeks before finally cancelling the subscription.
      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object;
        const email = invoice.customer_email;
        const attemptCount = invoice.attempt_count || 1;
        const nextAttempt = invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
          : null;

        if (!email) break;

        // Log the failure in Supabase
        try {
          const { data: user } = await supabase
            .from("users")
            .select("id")
            .eq("stripe_customer_id", invoice.customer)
            .single();
          if (user) {
            await supabase.from("events").insert({
              user_id: user.id,
              event_type: "payment_failed",
              metadata: { attempt_count: attemptCount, invoice_id: invoice.id },
            });
          }
        } catch(e) { console.error("Event log error (payment_failed):", e); }

        // Escalating email based on attempt number
        if (attemptCount === 1) {
          await sendEmail({
            to: email,
            subject: "Payment failed — please update your card",
            html: buildDunningEmail({ attempt: 1, nextAttempt, portalUrl: PORTAL_URL }),
          });
        } else if (attemptCount === 2) {
          await sendEmail({
            to: email,
            subject: "Second payment attempt failed — action required",
            html: buildDunningEmail({ attempt: 2, nextAttempt, portalUrl: PORTAL_URL }),
          });
        } else {
          // 3rd attempt or beyond — final warning
          await sendEmail({
            to: email,
            subject: "Final notice — your SoulGainz access is at risk",
            html: buildDunningEmail({ attempt: 3, nextAttempt: null, portalUrl: PORTAL_URL }),
          });
        }

        break;
      }

      // ── Subscription updated (status changes, renewal, cancellation scheduled) ─
      case "customer.subscription.updated": {
        const sub = stripeEvent.data.object;
        const prevStatus = stripeEvent.data.previous_attributes?.status;

        // Sync status + period to subscriptions table
        const { error: syncErr } = await supabase
          .from("subscriptions")
          .update({
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        if (syncErr) console.error("subscription.updated sync error:", syncErr);

        // If subscription just became past_due, also update profiles to flag it
        // (access stays on during grace period / retries — Stripe handles the retry schedule)
        if (sub.status === "past_due" && prevStatus !== "past_due") {
          console.log(`Subscription ${sub.id} moved to past_due`);
          try {
            const customer = await stripe.customers.retrieve(sub.customer);
            if (customer.email) {
              // Mark subscription as at-risk in subscriptions table
              await supabase
                .from("subscriptions")
                .update({ at_risk: true })
                .eq("stripe_subscription_id", sub.id);
              // Note: we do NOT downgrade yet — Stripe will retry.
              // The invoice.payment_failed handler sends dunning emails.
            }
          } catch(e) { console.error("past_due handler error:", e); }
        }

        // Reactivated — clear at_risk flag
        if (sub.status === "active" && prevStatus === "past_due") {
          await supabase
            .from("subscriptions")
            .update({ at_risk: false })
            .eq("stripe_subscription_id", sub.id);
          // Send a confirmation email that access is restored
          try {
            const customer = await stripe.customers.retrieve(sub.customer);
            if (customer.email) {
              await sendEmail({
                to: customer.email,
                subject: "Payment sorted — your SoulGainz access is back ✓",
                html: buildPaymentRestoredEmail(APP_URL),
              });
            }
          } catch(e) { console.error("Reactivation email error:", e); }
        }

        break;
      }

      // ── Subscription cancelled / all retries exhausted ──────────────────
      // This fires when Stripe gives up retrying OR user manually cancels.
      // This is where we actually downgrade the user to free.
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;

        // 1. Update subscriptions table
        await supabase
          .from("subscriptions")
          .update({
            status: sub.status,   // "canceled"
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);

        // 2. Downgrade the user's profile to free tier in Supabase
        try {
          const customer = await stripe.customers.retrieve(sub.customer);
          const custEmail = customer.email;
          if (custEmail) {
            await downgradeUserToFree(supabase, custEmail, sub.customer);

            // 3. Send win-back email
            await sendEmail({
              to: custEmail,
              subject: "Your access has ended — come back anytime",
              html: buildCancellationEmail(APP_URL),
            });
          }
        } catch(e) { console.error("Subscription deleted handler error:", e); }

        break;
      }

    } // end switch

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("Webhook handler error:", err);
    return { statusCode: 500, body: err.message };
  }
};

// ── Downgrade user to free tier in Supabase profiles ─────────────────────────
// Called when subscription.deleted fires. Finds the user's profile by email
// and clears tier, all_recipes, calculator so the app reverts to free on next sign-in.
async function downgradeUserToFree(supabase, email, stripeCustomerId) {
  console.log(`Downgrading ${email} to free tier`);

  // Update subscriptions table (belt-and-suspenders in case status update above missed it)
  try {
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    if (userRow?.id) {
      const { error: subErr } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", at_risk: false })
        .eq("user_id", userRow.id);
      if (subErr) console.error("Subscriptions cancel update error:", subErr);
    }
  } catch(e) { console.error("Subscriptions cancel lookup error:", e); }

  // Update profiles table — this is what the app reads on sign-in for tier verification
  // Only update columns that actually exist in the profiles schema (tier, tier_via, tier_label, tier_expires)
  const { error } = await supabase
    .from("profiles")
    .update({ tier: null, tier_via: null, tier_label: null, tier_expires: null })
    .eq("email", email);

  if (error) {
    console.error("Profile downgrade error for", email, error);
    // Fallback: look up profile by stripe_customer_id via users table
    try {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", stripeCustomerId)
        .single();
      if (user) {
        const { error: fallbackErr } = await supabase
          .from("profiles")
          .update({ tier: null, tier_via: null, tier_label: null, tier_expires: null })
          .eq("id", user.id);
        if (fallbackErr) console.error("Profile downgrade fallback error:", fallbackErr);
        else console.log(`Profile downgraded to free (by ID fallback): ${stripeCustomerId}`);
      }
    } catch(e2) { console.error("Profile downgrade fallback lookup error:", e2); }
  } else {
    console.log(`Profile downgraded to free: ${email}`);
  }
}

// ── Email helpers ─────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.log("RESEND_API_KEY not set, skipping email to:", to); return; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) console.error("Email send failed:", await res.text());
}

// ── Email templates ───────────────────────────────────────────────────────────

function sgHeader() {
  return `
    <tr>
      <td style="background:#0C0B0A;padding:32px 32px 24px;text-align:center;">
        <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.06em;">
          <span style="color:#E07B2A;">SOUL</span><span style="color:#F2EDE6;">GAINZ</span>
        </div>
        <div style="font-size:11px;color:#8C8279;letter-spacing:0.16em;margin-top:6px;">FEED YOUR SOUL &middot; FUEL YOUR GAINZ</div>
      </td>
    </tr>`;
}

function sgFooter() {
  return `
    <tr>
      <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
        <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.7;">
          Cook once. Eat all week.<br>
          <a href="mailto:admin@soulgainz.app" style="color:#E07B2A;text-decoration:none;">admin@soulgainz.app</a>
        </p>
      </td>
    </tr>`;
}

function wrapEmail(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0e9de;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0e9de;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#faf6f0;border-radius:16px;overflow:hidden;border:1px solid #ddd3c3;">
        ${sgHeader()}
        ${bodyHtml}
        ${sgFooter()}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Dunning email — escalates based on attempt number ─────────────────────────
function buildDunningEmail({ attempt, nextAttempt, portalUrl }) {
  const configs = {
    1: {
      headline: "Payment couldn't go through",
      colour: "#f59e0b",
      body: `Your latest payment didn't process. This can happen when a card expires or a bank blocks the charge — it's usually a quick fix.`,
      urgency: nextAttempt
        ? `We'll try again automatically on <strong>${nextAttempt}</strong>. Update your card before then to stay uninterrupted.`
        : `Please update your payment method to keep your access uninterrupted.`,
      cta: "Update payment method →",
    },
    2: {
      headline: "Second payment attempt failed",
      colour: "#ef4444",
      body: `We tried your payment again and it didn't go through. Your access is still active for now, but we'll need a working payment method to keep it that way.`,
      urgency: nextAttempt
        ? `One more attempt on <strong>${nextAttempt}</strong>. If that fails, your access will be paused.`
        : `This is your second failed attempt. Please update your card to avoid losing access.`,
      cta: "Fix my payment method →",
    },
    3: {
      headline: "Final notice — action required",
      colour: "#b91c1c",
      body: `Multiple payment attempts have failed. If we can't collect payment, your subscription will be cancelled and your access will revert to the free plan.`,
      urgency: `Update your payment method now to keep everything — your recipes, grocery lists, macro calculator, and all future drops.`,
      cta: "Save my access now →",
    },
  };

  const c = configs[Math.min(attempt, 3)];

  return wrapEmail(`
    <tr>
      <td style="padding:32px;">
        <div style="display:inline-block;background:${c.colour}22;border:1px solid ${c.colour}55;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;color:${c.colour};letter-spacing:0.08em;margin-bottom:16px;">
          ${attempt === 1 ? "PAYMENT FAILED" : attempt === 2 ? "SECOND ATTEMPT FAILED" : "FINAL NOTICE"}
        </div>
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 12px;">${c.headline}</h1>
        <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 16px;">${c.body}</p>
        <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
          <p style="font-size:13px;color:#78350f;line-height:1.6;margin:0;">${c.urgency}</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <a href="${portalUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;letter-spacing:0.02em;">
                ${c.cta}
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size:12px;color:#7a6d5e;line-height:1.6;margin:0;">
          Having trouble? Reply to this email and I'll sort it out manually.
        </p>
      </td>
    </tr>`);
}

// ── Payment restored email ─────────────────────────────────────────────────────
function buildPaymentRestoredEmail(appUrl) {
  return wrapEmail(`
    <tr>
      <td style="padding:32px;">
        <div style="display:inline-block;background:#dcfce722;border:1px solid #22c55e55;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;color:#16a34a;letter-spacing:0.08em;margin-bottom:16px;">
          PAYMENT CONFIRMED
        </div>
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 12px;">You're all sorted ✓</h1>
        <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
          Payment went through — your full access is restored. Everything is back to normal.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                Back to SoulGainz →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`);
}

// ── Cancellation / win-back email ─────────────────────────────────────────────
function buildCancellationEmail(appUrl) {
  return wrapEmail(`
    <tr>
      <td style="padding:32px;">
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 12px;">Your access has ended</h1>
        <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 16px;">
          Your subscription has been cancelled and your account has reverted to the free plan. Your meal logs, prep history, and saved recipes are all still here.
        </p>
        <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 28px;">
          When you're ready to come back, everything picks up right where you left it.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                Reactivate access →
              </a>
            </td>
          </tr>
        </table>
        <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:14px 18px;">
          <div style="font-size:12px;color:#4a3f33;line-height:1.7;">
            Have feedback? Hit reply — I'd genuinely love to hear what wasn't working.
          </div>
        </div>
      </td>
    </tr>`);
}

// ── Welcome / receipt email ───────────────────────────────────────────────────
function getEmailSubject(tier) {
  const subjects = {
    annual:     "Welcome to SoulGainz — your annual plan is active 🎉",
    monthly:    "Welcome to SoulGainz — your subscription is live 🥩",
    calculator: "Your macro calculator is unlocked 📊",
    single:     "Your recipe is unlocked 🍽️",
    seasonal:   "Your SoulFood bundle is unlocked 🌿",
  };
  return subjects[tier] || "Thanks for your purchase — SoulGainz";
}

function getEmailBody(tier, recipeId, amount) {
  const tierDetails = {
    annual:     { label: "Annual Plan",       badge: "ANNUAL",     desc: "Full access to all recipes + every future drop for a full year. Best value." },
    monthly:    { label: "Monthly Plan",      badge: "MONTHLY",    desc: "Full access to all recipes + new drops every month." },
    calculator: { label: "Macro Calculator",  badge: "CALCULATOR", desc: "Your personalised daily macro targets, built around your goal." },
    single:     { label: "Single Recipe",     badge: "RECIPE",     desc: "Recipe unlocked and ready to cook." },
    seasonal:   { label: "Seasonal Bundle",   badge: "SOULFOOD",   desc: "Your seasonal recipe bundle is unlocked — open the app and they're ready to cook." },
  };
  const d = tierDetails[tier] || { label: "Access Activated", badge: "ACCESS", desc: "Your purchase has been confirmed." };

  return wrapEmail(`
    <tr>
      <td style="padding:32px;">
        <h1 style="font-family:Georgia,serif;font-size:26px;color:#1a1612;margin:0 0 8px;">You're in.</h1>
        <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">Payment confirmed. Here's what you've unlocked:</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:12px;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;">
              <div style="font-size:10px;font-weight:700;color:#b84a1f;letter-spacing:0.14em;margin-bottom:6px;">${d.badge}</div>
              <div style="font-size:17px;font-weight:700;color:#1a1612;margin-bottom:6px;">${d.label}</div>
              <div style="font-size:13px;color:#4a3f33;line-height:1.6;">${d.desc}</div>
              ${amount ? `<div style="margin-top:12px;font-size:12px;color:#7a6d5e;">Amount charged: <strong style="color:#1a1612;">$${amount.toFixed(2)}</strong></div>` : ""}
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td align="center">
              <a href="${APP_URL}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;letter-spacing:0.02em;">
                Open the App →
              </a>
            </td>
          </tr>
        </table>
        <div style="border-top:1px solid #ddd3c3;padding-top:24px;">
          <div style="font-size:11px;font-weight:700;color:#7a6d5e;letter-spacing:0.1em;margin-bottom:12px;">WHAT TO EXPECT</div>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="font-size:20px;padding-right:12px;padding-bottom:10px;">🔓</td><td style="font-size:13px;color:#4a3f33;line-height:1.6;padding-bottom:10px;">Access is live immediately — open the app and it's already unlocked.</td></tr>
            <tr><td style="font-size:20px;padding-right:12px;padding-bottom:10px;">📲</td><td style="font-size:13px;color:#4a3f33;line-height:1.6;padding-bottom:10px;">Add the app to your home screen so it's always one tap away.</td></tr>
            <tr><td style="font-size:20px;padding-right:12px;">✉️</td><td style="font-size:13px;color:#4a3f33;line-height:1.6;">New recipes and updates come straight to this inbox.</td></tr>
          </table>
        </div>
      </td>
    </tr>`);
}
