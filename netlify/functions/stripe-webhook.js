// netlify/functions/stripe-webhook.js
// Receives Stripe events, updates Supabase, sends emails via Resend.
//
// Required environment variables:
//   STRIPE_SECRET_KEY        — sk_test_... or sk_live_...
//   STRIPE_WEBHOOK_SECRET    — whsec_... (from Stripe dashboard → Webhooks → endpoint)
//   SUPABASE_URL             — https://xxx.supabase.co
//   SUPABASE_SERVICE_KEY     — service_role key (NEVER expose client-side)
//   RESEND_API_KEY           — re_... (optional; emails skipped if missing)
//   FROM_EMAIL               — e.g. hello@yourdomain.com

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

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

  // Verify webhook signature (Stripe uses the raw body)
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
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const tier = session.metadata?.tier || "unknown";
        const recipeId = session.metadata?.recipeId || null;
        const email = session.customer_details?.email || session.customer_email;
        const stripeCustomerId = session.customer;
        const amount = (session.amount_total || 0) / 100;

        // 1. Upsert user
        const { data: user, error: userErr } = await supabase
          .from("users")
          .upsert(
            { email, stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() },
            { onConflict: "email" }
          )
          .select()
          .single();

        if (userErr) {
          console.error("User upsert error:", userErr);
          break;
        }

        // 2. Record the purchase
        if (tier === "single" && recipeId) {
          await supabase.from("recipe_unlocks").insert({
            user_id: user.id,
            recipe_id: recipeId,
            stripe_session_id: session.id,
            amount_paid: amount,
          });
        } else {
          await supabase.from("subscriptions").insert({
            user_id: user.id,
            stripe_subscription_id: session.subscription || null,
            stripe_session_id: session.id,
            tier,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end:
              tier === "lifetime" || tier === "seasonal"
                ? null
                : tier === "annual"
                ? new Date(Date.now() + 365 * 86400 * 1000).toISOString()
                : tier === "quarterly"
                ? new Date(Date.now() + 90 * 86400 * 1000).toISOString()
                : tier === "monthly"
                ? new Date(Date.now() + 30 * 86400 * 1000).toISOString()
                : null,
            amount_paid: amount,
          });
        }

        // 3. Log event
        await supabase.from("events").insert({
          user_id: user.id,
          event_type: "payment_succeeded",
          metadata: { tier, recipeId, amount },
        });

        // 4. Send welcome / receipt email via Resend
        await sendEmail({
          to: email,
          subject: getEmailSubject(tier),
          html: getEmailBody(tier, recipeId, amount),
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;
        await supabase
          .from("subscriptions")
          .update({
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object;
        const customerEmail = invoice.customer_email;
        if (customerEmail) {
          await sendEmail({
            to: customerEmail,
            subject: "Payment failed — please update your card",
            html: `<p>Hi,</p><p>Your latest payment couldn't be processed. Update your payment method to keep your access:</p><p><a href="${process.env.APP_URL || "https://soulgainz.netlify.app"}/.netlify/functions/customer-portal">Update payment method →</a></p>`,
          });
        }
        break;
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error("Webhook handler error:", err);
    return { statusCode: 500, body: err.message };
  }
};

// ── Email helpers ────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY not set, skipping email");
    return;
  }
  const fromEmail = process.env.FROM_EMAIL || "Meal Prep <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  });
  if (!res.ok) console.error("Email send failed:", await res.text());
}

function getEmailSubject(tier) {
  const subjects = {
    lifetime: "Welcome to Meal Prep — lifetime access unlocked 🎉",
    annual: "Welcome to Meal Prep — your annual plan is active 🎉",
    quarterly: "Welcome to Meal Prep — your quarterly plan is active 🍳",
    monthly: "Welcome to Meal Prep — your subscription is live 🥩",
    calculator: "Your macro calculator is unlocked 📊",
    single: "Your recipe is unlocked 🍽️",
    seasonal: "Your SoulFood bundle is unlocked 🌿",
  };
  return subjects[tier] || "Thanks for your purchase";
}

function getEmailBody(tier, recipeId, amount) {
  const appUrl = process.env.APP_URL || "https://soulgainz.netlify.app";

  const tierDetails = {
    lifetime: {
      label: "Lifetime Access",
      description: "Every recipe + every future drop, forever. No renewals, no limits.",
      badge: "LIFETIME",
    },
    annual: {
      label: "Annual Plan",
      description: "Full access to all recipes + every future drop for a full year. Best value.",
      badge: "ANNUAL",
    },
    quarterly: {
      label: "Quarterly Plan",
      description: "Full access to all recipes + new monthly drops for 3 months.",
      badge: "QUARTERLY",
    },
    monthly: {
      label: "Monthly Plan",
      description: "Full access to all recipes + 2 new recipes every month.",
      badge: "MONTHLY",
    },
    calculator: {
      label: "Macro Calculator",
      description: "Your personalised daily macro targets, built around your goal.",
      badge: "CALCULATOR",
    },
    single: {
      label: "Single Recipe",
      description: `Recipe unlocked and ready to cook.`,
      badge: "RECIPE",
    },
    seasonal: {
      label: "SoulFood Seasonal Bundle",
      description: "Your seasonal recipe bundle is unlocked — open the app and they're ready to cook.",
      badge: "SOULFOOD",
    },
  };

  const details = tierDetails[tier] || {
    label: "Access Activated",
    description: "Your purchase has been confirmed.",
    badge: "ACCESS",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0e9de;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0e9de;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#faf6f0;border-radius:16px;overflow:hidden;border:1px solid #ddd3c3;">

        <!-- Header -->
        <tr>
          <td style="background:#1a1612;padding:32px 32px 24px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;color:#f3ece0;letter-spacing:0.04em;">MEAL PREP</div>
            <div style="font-size:11px;color:#7a6d5e;letter-spacing:0.12em;margin-top:4px;">REAL FOOD. VERIFIED MACROS.</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="font-family:Georgia,serif;font-size:26px;color:#1a1612;margin:0 0 8px;">You're in.</h1>
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              Payment confirmed. Here's exactly what you've unlocked:
            </p>

            <!-- Access card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <div style="font-size:10px;font-weight:700;color:#b84a1f;letter-spacing:0.14em;margin-bottom:6px;">${details.badge}</div>
                  <div style="font-size:17px;font-weight:700;color:#1a1612;margin-bottom:6px;">${details.label}</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">${details.description}</div>
                  ${amount ? `<div style="margin-top:12px;font-size:12px;color:#7a6d5e;">Amount charged: <strong style="color:#1a1612;">$${amount.toFixed(2)}</strong></div>` : ""}
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <a href="${appUrl}" style="display:inline-block;background:#b84a1f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;letter-spacing:0.02em;">
                    Open the App →
                  </a>
                </td>
              </tr>
            </table>

            <!-- What to expect -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ddd3c3;padding-top:24px;margin-top:4px;">
              <tr>
                <td style="padding-top:24px;">
                  <div style="font-size:11px;font-weight:700;color:#7a6d5e;letter-spacing:0.1em;margin-bottom:12px;">WHAT TO EXPECT</div>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:20px;padding-right:12px;padding-bottom:10px;">🔓</td>
                      <td style="font-size:13px;color:#4a3f33;line-height:1.6;padding-bottom:10px;">Your access is live immediately — open the app and it's already unlocked.</td>
                    </tr>
                    <tr>
                      <td style="font-size:20px;padding-right:12px;padding-bottom:10px;">📲</td>
                      <td style="font-size:13px;color:#4a3f33;line-height:1.6;padding-bottom:10px;">Bookmark the app or add it to your home screen so it's always one tap away.</td>
                    </tr>
                    <tr>
                      <td style="font-size:20px;padding-right:12px;">✉️</td>
                      <td style="font-size:13px;color:#4a3f33;line-height:1.6;">New recipes and updates come straight to this inbox. Keep an eye out.</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1a1612;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#7a6d5e;margin:0;line-height:1.7;">
              Cook once, eat all week.<br>
              Questions? Reply to this email — I read every one.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
