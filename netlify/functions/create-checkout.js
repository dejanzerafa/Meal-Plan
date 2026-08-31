// netlify/functions/create-checkout.js
// Creates a Stripe Checkout Session and returns the redirect URL.
//
// Required environment variables (set in Netlify dashboard → Site → Environment):
//   STRIPE_SECRET_KEY    — sk_test_... or sk_live_...
//   APP_URL              — e.g. https://soulgainz.app
//   ALLOWED_PRICE_IDS    — comma-separated list of valid Stripe price IDs (optional but recommended)

// Exact matching (correctly) replaced startsWith, but browsers send
// "http://localhost:8888" WITH the port, which no exact list can contain.
// Allow loopback separately, and only outside production.
const _isLocalOrigin = o => process.env.CONTEXT !== "production" &&
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || "");

const Stripe = require("stripe");

// ── Allowed origins ───────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
  "https://marketing.soulgainz.app",
  "https://soulgainz.netlify.app",
  "http://localhost",
  "http://127.0.0.1",
];

// ── Known tier names — reject anything outside this list ─────────────────────
// Only monthly and annual subscriptions are sold. All other tiers removed.
const KNOWN_TIERS = ["monthly", "annual"];
const SUBSCRIPTION_TIERS = ["monthly", "annual"];

exports.handler = async (event) => {
  const requestOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  const corsOrigin = (ALLOWED_ORIGINS.includes(requestOrigin) || _isLocalOrigin(requestOrigin)) ? requestOrigin : "https://soulgainz.app";

  // MUST be on EVERY response, not just OPTIONS. marketing.soulgainz.app calls
  // this cross-origin; the preflight passed but the browser then blocked the
  // POST response for missing Access-Control-Allow-Origin, so the pricing page
  // could not start a checkout at all. The site-wide "*" header used to mask
  // this — removing that wildcard (correctly) exposed it.
  const corsHeaders = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method not allowed" };
  }

  // ── Payload size guard (reject > 2 KB) ───────────────────────────────────
  if (event.body && event.body.length > 2048) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Payload too large" }) };
  }

  // ── Origin check ─────────────────────────────────────────────────────────
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !_isLocalOrigin(origin)) {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "Forbidden" }) };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }),
    };
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const appUrl = process.env.APP_URL || "https://soulgainz.app";

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { priceId, tier, recipeId, userId } = payload;
  let { email } = payload;
  if (!priceId || !tier) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "priceId and tier are required" }),
    };
  }

  // Validate email if provided (simple format check)
  // Normalise before anything uses it. Raw email was used on grant, renewal AND
  // cancellation, so "Dejan@Icloud.com" missed "dejan@icloud.com" at all three.
  if (typeof email === "string") email = email.trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid email" }) };
  }

  // ── Validate tier ─────────────────────────────────────────────────────────
  if (!KNOWN_TIERS.includes(tier)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid tier" }) };
  }

  // ── Bind tier TO the price being paid ─────────────────────────────────────
  // `priceId` and `tier` arrive as two independent fields and used to be validated
  // in isolation: priceId against a regex and an allowlist, tier against
  // KNOWN_TIERS. Neither was checked against the other. Both then went into
  // session.metadata, and stripe-webhook.js reads `tier` straight back out and
  // writes it to profiles.tier.
  //
  // So posting the MONTHLY price id with tier:"annual" charged the monthly price
  // and provisioned annual access — through a legitimate Stripe payment that
  // reconciles cleanly in the dashboard, which is what made it hard to spot.
  //
  // The price is what the customer actually pays, so the price decides the tier.
  // The client's `tier` is now only accepted when it agrees.
  const PRICE_TIER = {};
  if (process.env.STRIPE_PRICE_MONTHLY) PRICE_TIER[process.env.STRIPE_PRICE_MONTHLY.trim()] = "monthly";
  if (process.env.STRIPE_PRICE_ANNUAL)  PRICE_TIER[process.env.STRIPE_PRICE_ANNUAL.trim()]  = "annual";
  const derivedTier = PRICE_TIER[priceId] || null;
  if (Object.keys(PRICE_TIER).length === 0) {
    // Fail closed. Without the mapping we cannot prove the tier matches the price,
    // and granting an unverified tier is worse than refusing the sale.
    console.error("STRIPE_PRICE_MONTHLY / STRIPE_PRICE_ANNUAL not configured — refusing checkout");
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Checkout is not configured. Please contact support." }) };
  }
  if (!derivedTier) {
    console.warn(`Blocked checkout: priceId ${priceId} maps to no known tier`);
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid priceId" }) };
  }
  if (derivedTier !== tier) {
    console.warn(`Blocked checkout: client asked for tier "${tier}" with the ${derivedTier} price`);
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Price and plan do not match" }) };
  }

  // ── Validate priceId format (must be price_<alphanumeric>) ────────────────
  if (!/^price_[A-Za-z0-9]{10,40}$/.test(priceId)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid priceId format" }) };
  }

  // ── Validate against known price ID whitelist (if env var is set) ─────────
  const allowedPriceIds = process.env.ALLOWED_PRICE_IDS
    ? process.env.ALLOWED_PRICE_IDS.split(",").map(p => p.trim()).filter(Boolean)
    : null;
  if (allowedPriceIds && allowedPriceIds.length > 0 && !allowedPriceIds.includes(priceId)) {
    console.warn(`Blocked checkout attempt with unlisted priceId: ${priceId}`);
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid priceId" }) };
  }

  // ── Validate recipeId if present (alphanumeric, max 64 chars) ─────────────
  if (recipeId && !/^[A-Za-z0-9_-]{1,64}$/.test(recipeId)) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid recipeId" }) };
  }

  // Subscription vs one-time mapping
  const mode = SUBSCRIPTION_TIERS.includes(tier) ? "subscription" : "payment";

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/success?tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      // Pre-fill checkout with the user's email if they're signed in
      ...(email ? { customer_email: email } : {}),
      // Metadata flows through to webhook for unlock provisioning
      metadata: {
        tier: derivedTier,
        recipeId: recipeId || "",
        priceId: priceId || "",
        userId: userId || "",   // Supabase user ID — lets webhook do direct profile lookup
      },
      // Stripe does NOT copy session metadata onto the subscription object, so
      // extendEntitlement's `sub.metadata.userId` lookup was always undefined and
      // every renewal fell back to a case-sensitive email match. Set it here too.
      ...(mode === "subscription" ? {
        subscription_data: { metadata: { tier: derivedTier, userId: userId || "" } }
      } : {}),
      // Capture customer email (Stripe will prompt for it on checkout)
      customer_creation: mode === "payment" ? "always" : undefined,
      // Do NOT specify payment_method_types — Stripe auto-includes Apple Pay, Google Pay, card
      // Allow promo codes (run launch sales easily)
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
