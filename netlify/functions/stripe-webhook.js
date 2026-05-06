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
              tier === "lifetime"
                ? null
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
            html: `<p>Hi,</p><p>Your latest payment couldn't be processed. Update your payment method to keep your access:</p><p><a href="${process.env.APP_URL || "https://dejan-mealplan.netlify.app"}/.netlify/functions/customer-portal">Update payment method →</a></p>`,
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
    quarterly: "Welcome to Meal Prep — your quarterly plan is active 🍳",
    monthly: "Welcome to Meal Prep — your subscription is live 🥩",
    calculator: "Your macro calculator is unlocked 📊",
    single: "Your recipe is unlocked 🍽️",
  };
  return subjects[tier] || "Thanks for your purchase";
}

function getEmailBody(tier, recipeId, amount) {
  const appUrl = process.env.APP_URL || "https://dejan-mealplan.netlify.app";
  const tierLabels = {
    lifetime: "Lifetime Access — every recipe + every future drop, forever",
    quarterly: "Quarterly Plan — all recipes + new monthly drops",
    monthly: "Monthly Plan — all recipes + 2 new every month",
    calculator: "Macro Calculator — your personalised daily targets",
    single: `Single Recipe (${recipeId})`,
  };

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1612;background:#f3ece0;">
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 16px;color:#b84a1f;">Welcome to Meal Prep.</h1>
      <p style="font-size:15px;line-height:1.6;">Thanks for joining. Here's what you've unlocked:</p>
      <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:12px;padding:16px;margin:18px 0;">
        <div style="font-size:12px;font-weight:700;color:#7a6d5e;letter-spacing:0.08em;margin-bottom:6px;">YOUR ACCESS</div>
        <div style="font-size:15px;font-weight:600;color:#1a1612;">${tierLabels[tier] || "Access activated"}</div>
        ${amount ? `<div style="font-size:12px;color:#4a3f33;margin-top:6px;">Paid: $${amount.toFixed(2)}</div>` : ""}
      </div>
      <p style="font-size:14px;line-height:1.6;">Open the app to start cooking:</p>
      <p><a href="${appUrl}" style="display:inline-block;background:#b84a1f;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;">Open the App →</a></p>
      <p style="font-size:12px;color:#7a6d5e;margin-top:32px;line-height:1.5;">
        Real food. Verified macros. Cook once, eat all week.<br>
        Reply to this email if you need help.
      </p>
    </div>
  `;
}
