// netlify/functions/restore-account.js
// Restores a user's unlock state by email — called when a returning user
// re-installs the app and wants to recover their purchases.
//
// POST body: { email: "user@example.com" }
// Returns:   { found, name, email, unlocks }

// Exact matching (correctly) replaced startsWith, but browsers send
// "http://localhost:8888" WITH the port, which no exact list can contain.
// Allow loopback separately, and only outside production.
const { clientIp, requireUser } = require("./_shared/auth");
const { report } = require("./_shared/report");
const _isLocalOrigin = o => process.env.CONTEXT !== "production" &&
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || "");

const { createClient } = require("@supabase/supabase-js");
const { getStore }     = require("@netlify/blobs");

// ── Allowed origins ───────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
  "https://soulgainz.netlify.app",
  "http://localhost",
  "http://127.0.0.1",
];

// ── IP-based rate limiting via Netlify Blobs ───────────────────────────────────
// Max 5 attempts per IP per 2 minutes — shared across all container instances.
// Prevents email enumeration / brute-force scraping.
const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 2 * 60 * 1000; // 2 minutes in ms

async function _checkIpRateLimit(ip) {
  if (!ip) return true; // can't rate-limit without IP — allow but log
  try {
    const store = getStore({ name: "restore-rate-limit", consistency: "strong" });
    const stored = await store.get(`ip:${ip}`, { type: "json" }).catch(() => null);
    const now = Date.now();
    let attempts = { count: 0, windowStart: now };
    if (stored && (now - stored.windowStart < RATE_LIMIT_WINDOW)) {
      attempts = stored;
    }
    if (attempts.count >= RATE_LIMIT_MAX) return false;
    await store.setJSON(`ip:${ip}`, { count: attempts.count + 1, windowStart: attempts.windowStart });
    return true;
  } catch (_) {
    return true; // Blobs unavailable (local dev) — degrade gracefully
  }
}

exports.handler = async (event) => {
  // Declared before anything can reference it. The auth gate below returns
  // 401/403 with these headers, and one of those returns sits outside the try —
  // so an undeclared identifier here was a ReferenceError and a 502, not a 401.
  // It also runs before the OPTIONS branch, which meant CORS preflight 502'd and
  // the browser could never reach this function at all.
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // ── Require the caller to prove who they are ────────────────────────────────
  // This returned first_name, last_name, email and subscription tier for ANY
  // address, to anyone, with no authentication. The origin check below is
  // `if (origin && ...)`, so any non-browser client simply omits the header and
  // passes; the 5-per-2-minutes IP limit slows enumeration without stopping it.
  // Net effect: name and paid-subscription status of any user, disclosed to
  // anyone who knows or guesses their email.
  //
  // Restore is inherently a signed-in action — you are recovering entitlements
  // onto a device where you have just authenticated — so a JWT costs the real
  // user nothing and closes the oracle entirely.
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://soulgainz.app",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  // The token check used to call /auth/v1/user with `apikey:
  // SUPABASE_ANON_KEY` — an env var the deploy has never had. The gateway
  // rejects a request with no apikey before it looks at the JWT, so every
  // caller got "Session expired" and the ME tab's "Check my subscription"
  // button could never succeed. requireUser() verifies with the service key,
  // the same way every other authenticated function does.
  {
    const _auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
    if (!_auth.startsWith("Bearer ")) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Sign in to restore your account." }) };
    }
    const _r = await requireUser(event);
    if (_r.error) {
      return { statusCode: _r.status === 401 ? 401 : _r.status, headers: corsHeaders, body: JSON.stringify({ error: _r.status === 401 ? "Session expired. Sign in again." : _r.error }) };
    }
    let _claimed = "";
    try { _claimed = ((JSON.parse(event.body || "{}").email) || "").trim().toLowerCase(); }
    catch (_) { return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid JSON" }) }; }
    const _actual = String(_r.user.email || "").trim().toLowerCase();
    // Bind the lookup to the token. Even a valid user must not be able to ask
    // about somebody else's address.
    if (!_actual || (_claimed && _claimed !== _actual)) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "You can only restore your own account." }) };
    }
  }

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
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !_isLocalOrigin(origin)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Forbidden" }) };
  }

  // ── IP rate limit ─────────────────────────────────────────────────────────
  // Was `const clientIp = ... || clientIp(event) || ...`. That local shadowed the
  // imported helper AND appeared inside its own initialiser — a temporal-dead-zone
  // ReferenceError the moment the Netlify header is absent (local dev, or any path
  // that omits it), thrown outside every try block, so a 502 rather than a 429.
  // The helper already prefers x-nf-client-connection-ip and falls back to the
  // LAST forwarded hop, which is the non-spoofable one.
  const _ip = clientIp(event) || "unknown";
  const allowed = await _checkIpRateLimit(_ip);
  if (!allowed) {
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

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error" }) };
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

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
    await report("restore-account", err instanceof Error ? err : new Error(String(err)), { where: "restore-account " });
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
