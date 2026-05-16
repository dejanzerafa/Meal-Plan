// netlify/functions/restore-account.js
// Restores a user's unlock state by email — called when a returning user
// re-installs the app and wants to recover their purchases.
//
// POST body: { email: "user@example.com" }
// Returns:   { found, name, email, unlocks }

const { createClient } = require("@supabase/supabase-js");

// ── Allowed origins ───────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
  "https://soulgainz.netlify.app",
  "http://localhost",
  "http://127.0.0.1",
];

// ── IP-based rate limiting: max 5 attempts per IP per 2 minutes ───────────────
// (prevents email enumeration / brute-force scraping)
const _ipRateMap = new Map();
function _checkIpRateLimit(ip) {
  if (!ip) return true; // can't rate-limit without IP — allow but log
  const now = Date.now();
  const entry = _ipRateMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 120000) {
    _ipRateMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  _ipRateMap.set(ip, entry);
  return true;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const headers = { "Content-Type": "application/json" };

  // ── Payload size guard ───────────────────────────────────────────────────
  if (event.body && event.body.length > 1024) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Payload too large" }) };
  }

  // ── Origin check ─────────────────────────────────────────────────────────
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  if (origin && !ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Forbidden" }) };
  }

  // ── IP rate limit ─────────────────────────────────────────────────────────
  const clientIp = (event.headers && (
    event.headers["x-forwarded-for"] ||
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["client-ip"]
  ) || "").split(",")[0].trim();
  if (!_checkIpRateLimit(clientIp)) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: "Too many attempts. Please wait a moment." }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const email = (payload.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    // 1. Look up user
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, calc_used")
      .eq("email", email)
      .single();

    if (userErr || !user) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ found: false }),
      };
    }

    // 2. Get active subscriptions
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("tier, status, current_period_end, stripe_subscription_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 3. Get single recipe unlocks
    const { data: recipeUnlocks } = await supabase
      .from("recipe_unlocks")
      .select("recipe_id")
      .eq("user_id", user.id);

    // 4. Build unlock state — priority: lifetime > annual > quarterly > monthly > seasonal > single
    let unlocks = {
      calculator: false,
      allRecipes: false,
      recipes: [],
      tier: null,
      seasonalPriceId: null,
    };

    const activeSub = (subs || []).find(s =>
      s.status === "active" || s.status === "trialing" ||
      // Lifetime/seasonal have no period_end — always active
      (["lifetime", "seasonal"].includes(s.tier) && s.status !== "canceled")
    );

    if (activeSub) {
      const tier = activeSub.tier;

      if (["lifetime", "annual", "quarterly", "monthly"].includes(tier)) {
        unlocks.calculator = true;
        unlocks.allRecipes = true;
        unlocks.tier = tier;
      } else if (tier === "calculator") {
        unlocks.calculator = true;
        unlocks.tier = "calculator";
      } else if (tier === "seasonal") {
        unlocks.tier = "seasonal";
      }
    }

    // Single recipe unlocks (merge on top)
    if (recipeUnlocks && recipeUnlocks.length > 0) {
      unlocks.recipes = recipeUnlocks.map(r => r.recipe_id);
      if (!unlocks.tier) unlocks.tier = "single";
    }

    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        found: true,
        email: user.email,
        name,
        calcUsed: user.calc_used || false,
        unlocks,
      }),
    };
  } catch (err) {
    console.error("restore-account error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
