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
//   FROM_EMAIL               — e.g. SoulGainz <support@soulgainz.app>
//   APP_URL                  — e.g. https://soulgainz.app

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const { report } = require("./_shared/report");

const APP_URL = process.env.APP_URL || "https://soulgainz.app";
const FROM_EMAIL = process.env.FROM_EMAIL || "SoulGainz <support@soulgainz.app>";
const PORTAL_URL = `${APP_URL}/.netlify/functions/customer-portal`;

exports.handler = async (event) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return { statusCode: 500, body: "Stripe env vars not configured" };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: "Supabase env vars not configured" };
  }
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
        // Normalise. This email is the join key for the grant here, for renewals in
        // extendEntitlement, and for the downgrade on cancellation — a casing
        // difference silently missed at all three.
        const email = (session.customer_details?.email || session.customer_email || "").trim().toLowerCase() || null;
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

        // Do NOT `break` here. `break` exits the switch and falls through to the
        // 200 at the end of the handler, so Stripe records success and never
        // retries — a transient Supabase failure would permanently lose the
        // entitlement while the customer has already been charged. A 500 makes
        // Stripe retry on its own schedule, which is exactly what this needs.
        if (userErr) {
          console.error("User upsert error:", userErr);
          await report("stripe-webhook", "users upsert failed on checkout — Stripe will retry", { email, sessionId: session.id, error: userErr && userErr.message });
          return { statusCode: 500, body: "user upsert failed" };
        }

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
          // 23505 = the subscriptions row already exists, i.e. Stripe is retrying.
          // This used to `break` here, which skipped the profile write below. Any
          // first delivery that inserted the subscription and then failed before
          // granting the tier (network blip, Supabase timeout, the events-table
          // TypeError that used to live further down) left the customer paid in
          // Stripe and free in the app — and every retry exited here, so it could
          // never repair itself. Fall through instead: the profile upsert is
          // idempotent, so re-running it is safe and is exactly what a retry is for.
          if (subInsertErr?.code === "23505") {
            console.log("Duplicate checkout.session.completed — re-asserting entitlement for:", session.id);
          } else if (subInsertErr) {
            // Log but do NOT stop — the entitlement matters more than the log row.
            console.error("Subscription insert error (continuing to profile update):", subInsertErr);
          }

          // 2b. Write tier into profiles.
          // Use the Supabase auth UUID from checkout metadata (most reliable — avoids the
          // users-table ID ≠ auth UUID mismatch). Fall back to users.id only when userId
          // was not in metadata (e.g. user paid without being signed in).
          const authUserId = session.metadata?.userId || null;
          const profileId  = authUserId || user.id;

          const { error: profileErr } = await supabase
            .from("profiles")
            .upsert({
              id: profileId,
              email,
              tier,
              tier_via: "stripe",
              tier_expires: realPeriodEnd,
            }, { onConflict: "id" });
          if (profileErr) {
            console.error("Profile tier upsert error:", profileErr);
            await report("stripe-webhook", "profile tier upsert failed on checkout", { tier, email, sessionId: session.id, error: profileErr && profileErr.message });
            // Last-resort fallback: update by email (catches rows without a matching id)
            // `.select()` matters: PostgREST returns 200 with zero rows when nothing
            // matched, so without it a buyer whose Stripe email differs from their
            // app email was logged as "updated" while nothing was written. Treat a
            // zero-row result as a hard failure so Stripe retries and it is visible.
            const { data: emailRows, error: emailProfileErr } = await supabase
              .from("profiles")
              .update({ tier, tier_via: "stripe", tier_expires: realPeriodEnd })
              .eq("email", email)
              .select("id");
            if (emailProfileErr) {
              console.error("Profile tier update-by-email fallback error:", emailProfileErr);
              return { statusCode: 500, body: "entitlement write failed" };
            }
            if (!emailRows || emailRows.length === 0) {
              console.error(`UNMATCHED PURCHASE: paid ${tier} for ${email} but no profiles row matched. Manual grant required.`);
              await report("stripe-webhook", "UNMATCHED PURCHASE — paid, no profile matched, manual grant required", { tier, email, sessionId: session.id, customerId: session.customer }, "fatal");
              return { statusCode: 500, body: "no matching account for this purchase" };
            }
            console.log(`Profile tier updated (email fallback) to "${tier}" for ${email}`);
          } else {
            console.log(`Profile tier upserted to "${tier}" for ${email} (id: ${profileId})`);
          }
        }

        // 3. Log event
        // NOT .catch(). PostgrestBuilder is PromiseLike with `then` only, so
        // `.catch(...)` was calling undefined — a synchronous TypeError that the
        // outer try swallowed into a 500. The tier had already been written, but
        // the welcome email below never sent and Stripe saw every single
        // checkout.session.completed fail and retried it forever.
        const { error: eventErr } = await supabase.from("events").insert({
          user_id: user.id,
          event_type: "payment_succeeded",
          metadata: { tier, recipeId, amount },
        });
        if (eventErr) console.error("Event log error:", eventErr);

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
      // ── Renewal paid ────────────────────────────────────────────────────
      // The canonical renewal signal. subscription.updated also extends (above),
      // but this fires reliably on every successful recurring charge, including
      // cases where the subscription object itself does not change shape.
      case "invoice.payment_succeeded": {
        const inv = stripeEvent.data.object;
        if (!inv.subscription || inv.billing_reason === "subscription_create") break;
        try {
          const sub = await stripe.subscriptions.retrieve(inv.subscription);
          const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
          // PostgREST resolves on a failed write rather than throwing, so a bare
          // `await` here discarded the error. This is the write that was failing
          // with 42703 on every renewal for as long as `at_risk` did not exist
          // (schema-fix part 11 adds it) — and nothing said so. The ledger row
          // is bookkeeping, not entitlement, so a failure here is logged loudly
          // but does not 500: extendEntitlement below is what the customer
          // actually needs, and it must still run.
          const { error: ledgerErr } = await supabase.from("subscriptions")
            .update({ status: sub.status, current_period_end: periodEnd, at_risk: false })
            .eq("stripe_subscription_id", sub.id);
          if (ledgerErr) console.error("subscriptions ledger update failed (renewal):", sub.id, ledgerErr);
          const ok = await extendEntitlement(supabase, stripe, sub, periodEnd);
          if (!ok) return { statusCode: 500, body: "renewal entitlement write failed" };
        } catch (e) {
          console.error("invoice.payment_succeeded error:", e);
          await report("stripe-webhook", e, { stage: "invoice.payment_succeeded", invoice: inv.id, subscription: inv.subscription });
          return { statusCode: 500, body: "renewal handling failed" };
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = stripeEvent.data.object;
        const prevStatus = stripeEvent.data.previous_attributes?.status;

        const newPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();

        // Sync status + period to subscriptions table
        const { error: syncErr } = await supabase
          .from("subscriptions")
          .update({
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: newPeriodEnd,
          })
          .eq("stripe_subscription_id", sub.id);
        if (syncErr) console.error("subscription.updated sync error:", syncErr);

        // ── Extend the ENTITLEMENT, not just the bookkeeping row ──────────────
        // profiles.tier_expires is what the app actually enforces (it treats an
        // elapsed date as "expired -> free"). Before this, tier_expires was set
        // once at checkout and never moved, so a paying monthly member was
        // downgraded to free on day 31 while Stripe kept billing them.
        //
        // Renewals surface here as an active subscription whose current_period_end
        // has moved forward, so extend whenever the sub is in a paying state.
        if (sub.status === "active" || sub.status === "trialing") {
          const extended = await extendEntitlement(supabase, stripe, sub, newPeriodEnd);
          if (!extended) {
            // Do not swallow it. A 500 makes Stripe retry, and a retry is far
            // better than a customer silently losing access at the period end.
            return { statusCode: 500, body: "entitlement extension failed" };
          }
        }

        // If subscription just became past_due, also update profiles to flag it
        // (access stays on during grace period / retries — Stripe handles the retry schedule)
        if (sub.status === "past_due" && prevStatus !== "past_due") {
          console.log(`Subscription ${sub.id} moved to past_due`);
          try {
            const customer = await stripe.customers.retrieve(sub.customer);
            if (customer.email) {
              // Mark subscription as at-risk in subscriptions table
              const { error: riskErr } = await supabase
                .from("subscriptions")
                .update({ at_risk: true })
                .eq("stripe_subscription_id", sub.id);
              if (riskErr) console.error("at_risk=true write failed:", sub.id, riskErr);
              // Note: we do NOT downgrade yet — Stripe will retry.
              // The invoice.payment_failed handler sends dunning emails.
            }
          } catch(e) { console.error("past_due handler error:", e); }
        }

        // Reactivated — clear at_risk flag
        if (sub.status === "active" && prevStatus === "past_due") {
          const { error: clearErr } = await supabase
            .from("subscriptions")
            .update({ at_risk: false })
            .eq("stripe_subscription_id", sub.id);
          if (clearErr) console.error("at_risk=false write failed:", sub.id, clearErr);
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
        // This is the write the old 'cancelled' CHECK rejected on every single
        // cancellation, and being a bare await it never said so. Captured now;
        // still non-fatal, because step 2 (the profile downgrade) is what
        // actually revokes access and must run regardless.
        const { error: delErr } = await supabase
          .from("subscriptions")
          .update({
            status: sub.status,   // "canceled"
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        if (delErr) console.error("subscriptions ledger update failed (deleted):", sub.id, delErr);

        // 2. Downgrade the user's profile to free tier in Supabase
        //
        // Normalised, like the grant path and extendEntitlement. This one was
        // missed: a Stripe email of "Dejan@Icloud.com" never matched a profile row
        // stored lowercase, so the revocation quietly matched zero rows.
        let custEmail = null;
        try {
          const customer = await stripe.customers.retrieve(sub.customer);
          custEmail = customer && customer.email ? customer.email.trim().toLowerCase() : null;
        } catch (e) {
          console.error("subscription.deleted: customer lookup failed", e);
          return { statusCode: 500, body: "customer lookup failed" };
        }
        if (custEmail) {
          // This whole block used to sit inside a try/catch that swallowed every
          // failure and fell through to the 200 below — so a revocation touching
          // zero rows was recorded by Stripe as success and never retried, and a
          // cancelled subscriber kept their tier indefinitely.
          const revoked = await downgradeUserToFree(supabase, custEmail, sub.customer);
          if (!revoked) {
            console.error(`REVOCATION FAILED for ${custEmail} — returning 500 so Stripe retries`);
            await report("stripe-webhook", "REVOCATION FAILED — access not removed after cancellation, Stripe retrying", { email: custEmail, subscription: sub.id }, "fatal");
            return { statusCode: 500, body: "downgrade failed" };
          }
          // The win-back email is a courtesy. It must never fail the revocation.
          try {
            await sendEmail({
              to: custEmail,
              subject: "Your access has ended — come back anytime",
              html: buildCancellationEmail(APP_URL),
            });
          } catch (e) { console.error("Win-back email failed (revocation already succeeded):", e); }
        }

        break;
      }

    } // end switch

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("Webhook handler error:", err);
    await report("stripe-webhook", err, { eventType: stripeEvent && stripeEvent.type, eventId: stripeEvent && stripeEvent.id });
    return { statusCode: 500, body: err.message };
  }
};

// ── Extend a live subscriber's entitlement ───────────────────────────────────
// profiles.tier_expires is the ONLY thing the app enforces — index.html treats an
// elapsed date as "expired, treat as free". Before this existed, tier_expires was
// written once at checkout and never moved, so a paying monthly member was
// downgraded to free on day 31 while Stripe carried on billing them. Annual
// members hit the same wall at month 12.
//
// Returns true ONLY when a row was actually written. PostgREST returns 200 with
// zero rows when nothing matched, so without .select() a no-op reads as success —
// the same trap that used to hide unmatched purchases in the checkout path.
//
// Deliberately does NOT write `tier`. The tier was set from checkout metadata and
// is already correct on the row; re-deriving it from the price id on every renewal
// would risk downgrading an annual member to monthly on a single mapping mistake.
// A renewal only needs to move the expiry forward.
async function extendEntitlement(supabase, stripe, sub, periodEnd) {
  let email = null;
  const authUserId = (sub.metadata && sub.metadata.userId) || null;
  try {
    const customer = await stripe.customers.retrieve(sub.customer);
    email = customer && customer.email ? customer.email.trim().toLowerCase() : null;
  } catch (e) {
    console.error("extendEntitlement: customer lookup failed", e);
  }

  const patch = { tier_expires: periodEnd, tier_via: "stripe" };

  if (authUserId) {
    const { data, error } = await supabase
      .from("profiles").update(patch).eq("id", authUserId).select("id");
    if (error) { console.error("extendEntitlement by id failed:", error); return false; }
    if (data && data.length) {
      console.log(`Entitlement extended to ${periodEnd} for ${authUserId}`);
      return true;
    }
  }
  if (email) {
    const { data, error } = await supabase
      .from("profiles").update(patch).eq("email", email).select("id");
    if (error) { console.error("extendEntitlement by email failed:", error); return false; }
    if (data && data.length) {
      console.log(`Entitlement extended to ${periodEnd} for ${email}`);
      return true;
    }
  }
  console.error(
    `RENEWAL UNMATCHED: sub ${sub.id} renewed to ${periodEnd} but no profiles row ` +
    `matched (email=${email}, userId=${authUserId}). Manual grant required.`
  );
  return false;
}

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
  // `.select()` is load-bearing. PostgREST returns 200 with zero rows when nothing
  // matched, so without it a downgrade that touched NOTHING was logged as
  // "Profile downgraded to free" and the fallback below never ran — a cancelled
  // subscriber kept paid access indefinitely. Treat zero rows as a miss.
  const { data: rows, error } = await supabase
    .from("profiles")
    .update({ tier: null, tier_via: null, tier_label: null, tier_expires: null })
    // Only revoke what Stripe granted. Without this, cancelling a subscription
    // also wiped a promo or friend-code tier held by the same person.
    .eq("tier_via", "stripe")
    .eq("email", email)
    .select("id");

  if (error || !rows || rows.length === 0) {
    if (!error) console.warn(`Downgrade by email matched 0 rows for ${email} — trying customer id`);
    console.error("Profile downgrade error for", email, error);
    // Fallback: look up profile by stripe_customer_id via users table
    try {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", stripeCustomerId)
        .single();
      if (user) {
        const { data: fbRows, error: fallbackErr } = await supabase
          .from("profiles")
          .update({ tier: null, tier_via: null, tier_label: null, tier_expires: null })
          .eq("id", user.id)
          .select("id");
        if (fallbackErr) { console.error("Profile downgrade fallback error:", fallbackErr); return false; }
        // Without .select() a zero-row update reads as success — the exact trap
        // .select() was added upstream to close, left open one level down. And
        // users.id is NOT the auth UUID that profiles.id holds (see the checkout
        // handler's comment), so this match legitimately often finds nothing.
        // That has to be reported, not logged as a successful downgrade.
        if (!fbRows || fbRows.length === 0) {
          console.error(`REVOCATION UNMATCHED: no profiles row for customer ${stripeCustomerId} (email ${email}). Manual downgrade required.`);
      await report("stripe-webhook", "REVOCATION UNMATCHED — cancelled customer still has access, manual downgrade required", { email, customerId: stripeCustomerId }, "fatal");
          return false;
        }
        console.log(`Profile downgraded to free (by ID fallback): ${stripeCustomerId}`);
        return true;
      }
      console.error(`REVOCATION UNMATCHED: no users row for customer ${stripeCustomerId}. Manual downgrade required.`);
      await report("stripe-webhook", "REVOCATION UNMATCHED — no users row for cancelled customer", { customerId: stripeCustomerId }, "fatal");
      return false;
    } catch(e2) { console.error("Profile downgrade fallback lookup error:", e2); return false; }
  } else {
    console.log(`Profile downgraded to free: ${email}`);
    return true;
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
          <a href="mailto:support@soulgainz.app" style="color:#E07B2A;text-decoration:none;">support@soulgainz.app</a>
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
              ${amount ? `<div style="margin-top:12px;font-size:12px;color:#7a6d5e;">Amount charged: <strong style="color:#1a1612;">€${amount.toFixed(2)}</strong></div>` : ""}
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
