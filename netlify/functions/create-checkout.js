// netlify/functions/create-checkout.js
// Creates a Stripe Checkout Session and returns the redirect URL.
//
// Required environment variables (set in Netlify dashboard → Site → Environment):
//   STRIPE_SECRET_KEY    — sk_test_... or sk_live_...
//   APP_URL              — e.g. https://dejan-mealplan.netlify.app

const Stripe = require("stripe");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }),
    };
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const appUrl = process.env.APP_URL || "https://dejan-mealplan.netlify.app";

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { priceId, tier, recipeId } = payload;
  if (!priceId || !tier) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "priceId and tier are required" }),
    };
  }

  // Subscription vs one-time mapping
  const subscriptionTiers = ["monthly", "quarterly"];
  const mode = subscriptionTiers.includes(tier) ? "subscription" : "payment";

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?checkout=cancelled`,
      // Metadata flows through to webhook for unlock provisioning
      metadata: {
        tier,
        recipeId: recipeId || "",
      },
      // Capture customer email (Stripe will prompt for it on checkout)
      customer_creation: mode === "payment" ? "always" : undefined,
      // Apple Pay / Google Pay are auto-included by Stripe
      payment_method_types: ["card"],
      // Allow promo codes (run launch sales easily)
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
