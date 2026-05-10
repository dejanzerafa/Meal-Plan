// netlify/functions/verify-session.js
// Called by /success.html after Stripe redirects user back.
// Verifies session is paid, returns the unlock state for the app to apply.

const Stripe = require("stripe");

exports.handler = async (event) => {
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
    const email = session.customer_details?.email || null;
    const customerId = session.customer || null;

    // Determine unlock state based on tier
    let unlocks = { calculator: false, allRecipes: false, recipes: [], tier: null };

    if (tier === "calculator") {
      unlocks.calculator = true;
      unlocks.tier = "calculator";
    } else if (tier === "single" && recipeId) {
      unlocks.recipes = [recipeId];
      unlocks.tier = "single";
    } else if (["lifetime", "quarterly", "monthly"].includes(tier)) {
      unlocks.calculator = true;
      unlocks.allRecipes = true;
      unlocks.tier = tier;
    } else if (tier === "seasonal") {
      // SoulFood seasonal bundle — unlocks specific recipes defined in SOULFOOD_RECIPE_IDS.
      // allRecipes stays false; the app checks tier === "seasonal" against its own ID list.
      unlocks.tier = "seasonal";
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
