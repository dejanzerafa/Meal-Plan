// netlify/functions/verify-session.js
// Called by /success.html after Stripe redirects user back.
// Verifies session is paid, returns the unlock state for the app to apply.

const { rateLimit, clientIp } = require("./_shared/auth");
const Stripe = require("stripe");

exports.handler = async (event) => {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  // Returns the buyer's email and Stripe customer id for a session id.
  // Session ids appear in success_url, so they leak via referrer, history and
  // analytics. This had no origin check on the GET path and no limit at all.
  {
    const _rl = await rateLimit(`verifysession:${clientIp(event)}`, { max: 10, windowMs: 60000 });
    if (!_rl.ok) {
      return { statusCode: 429, headers: (typeof corsHeaders !== "undefined" ? corsHeaders : {}),
               body: JSON.stringify({ error: "Too many requests. Please try again shortly." }) };
    }
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://soulgainz.app",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Stripe not configured" }) };
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const sessionId = event.queryStringParameters?.session_id;
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ error: "session_id required" }) };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: false, status: session.payment_status }),
      };
    }

    const tier = session.metadata?.tier || "unknown";
    const recipeId = session.metadata?.recipeId || null;
    const paidPriceId = session.metadata?.priceId || null;
    const email = session.customer_details?.email || null;
    const customerId = session.customer || null;

    // Determine unlock state based on tier
    let unlocks = { calculator: false, allRecipes: false, recipes: [], tier: null, seasonalPriceId: null };

    if (tier === "calculator") {
      unlocks.calculator = true;
      unlocks.tier = "calculator";
    } else if (tier === "single" && recipeId) {
      unlocks.recipes = [recipeId];
      unlocks.tier = "single";
    } else if (["lifetime", "annual", "quarterly", "monthly"].includes(tier)) {
      unlocks.calculator = true;
      unlocks.allRecipes = true;
      unlocks.tier = tier;
    } else if (tier === "seasonal") {
      // SoulFood seasonal bundle — one-time per drop.
      // seasonalPriceId is stored so the app can check whether the user's purchase
      // matches the CURRENTLY active seasonal price. When a new season launches and
      // STRIPE_PRICES.seasonal is updated, old buyers' seasonalPriceId won't match
      // and access is automatically revoked — they must purchase the new drop.
      unlocks.tier = "seasonal";
      unlocks.seasonalPriceId = paidPriceId;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paid: true,
        tier,
        email,
        customerId,
        unlocks,
      }),
    };
  } catch (err) {
    console.error("Session verify error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
