// netlify/functions/create-checkout.js
// Creates a Stripe Checkout Session and returns the redirect URL.
//
// Required environment variables (set in Netlify dashboard → Site → Environment):
//   STRIPE_SECRET_KEY    — sk_test_... or sk_live_...
//   APP_URL              — e.g. https://soulgainz.netlify.app
//   ALLOWED_PRICE_IDS    — comma-separated list of valid Stripe price IDs (optional but recommended)

const Stripe = require("stripe");

// ── Allowed origins ───────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
  "https://soulgainz.netlify.app",
  "http://localhost",
  "http://127.0.0.1",
];

// ── Known tier names — reject anything outside this list ─────────────────────
// Only monthly and annual subscriptions are sold. All other tiers removed.
const KNOWN_TIERS = ["monthly", "annual"];
const SUBSCRIPTION_TIERS = ["monthly", "annual"];

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // ── Payload size guard (reject > 2 KB) ───────────────────────────────────
  if (event.body && event.body.length > 2048) {
    return { statusCode: 400, body: JSON.stringify({ error: "Payload too large" }) };
  }

  // ── Origin check ─────────────────────────────────────────────────────────
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  if (origin && !ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }),
    };
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const appUrl = process.env.APP_URL || "https://soulgainz.netlify.app";

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

  // ── Validate tier ─────────────────────────────────────────────────────────
  if (!KNOWN_TIERS.includes(tier)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid tier" }) };
  }

  // ── Validate priceId format (must be price_<alphanumeric>) ────────────────
  if (!/^price_[A-Za-z0-9]{10,40}$/.test(priceId)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid priceId format" }) };
  }

  // ── Validate against known price ID whitelist (if env var is set) ─────────
  const allowedPriceIds = process.env.ALLOWED_PRICE_IDS
    ? process.env.ALLOWED_PRICE_IDS.split(",").map(p => p.trim()).filter(Boolean)
    : null;
  if (allowedPriceIds && allowedPriceIds.length > 0 && !allowedPriceIds.includes(priceId)) {
    console.warn(`Blocked checkout attempt with unlisted priceId: ${priceId}`);
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid priceId" }) };
  }

  // ── Validate recipeId if present (alphanumeric, max 64 chars) ─────────────
  if (recipeId && !/^[A-Za-z0-9_-]{1,64}$/.test(recipeId)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid recipeId" }) };
  }

  // Subscription vs one-time mapping
  const mode = SUBSCRIPTION_TIERS.includes(tier) ? "subscription" : "payment";

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
        priceId: priceId || "",   // stored so seasonal drop can be identified on success
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
