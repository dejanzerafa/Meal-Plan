// netlify/functions/redeem-promo.js
// Server-side promo code redemption.
// POST { code, userId }
// Uses the Supabase service_role key — never exposed to the browser.
// Returns { ok, tier, label, tierExpires } or { error }.

// Exact matching (correctly) replaced startsWith, but browsers send
// "http://localhost:8888" WITH the port, which no exact list can contain.
// Allow loopback separately, and only outside production.
const _isLocalOrigin = o => process.env.CONTEXT !== "production" &&
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || "");

const { requireUser, rateLimit, clientIp } = require("./_shared/auth");

const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
  "https://soulgainz.netlify.app",
  "http://localhost",
  "http://127.0.0.1",
];

exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://soulgainz.app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method not allowed" };
  }

  const origin = (event.headers?.origin || event.headers?.Origin) || "";
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !_isLocalOrigin(origin)) {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "Forbidden" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Server config error" }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { code } = payload;
  if (!code || typeof code !== "string" || code.length > 32) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid code" }) };
  }

  // ── Identify the caller from their JWT, never from the request body ───────
  // Previously `userId` came straight off the payload with no verification, so
  // anyone could redeem a code onto ANY profile UUID — and there was no rate
  // limit, making the promo_codes table brute-forceable into free paid tiers.
  const { user, error: authError, status: authStatus } = await requireUser(event);
  if (authError) {
    return { statusCode: authStatus, headers: corsHeaders, body: JSON.stringify({ error: authError }) };
  }
  const userId = user.id;
  const userEmail = user.email;

  // ── Brute-force protection ───────────────────────────────────────────────
  // Limited per user AND per IP: a single account cannot grind the code table,
  // and one attacker cannot spread the attempts across throwaway accounts.
  for (const [key, label] of [[`promo_u_${userId}`, "user"], [`promo_ip_${clientIp(event)}`, "ip"]]) {
    const rl = await rateLimit(key, { max: 5, windowMs: 900000 });
    if (!rl.ok) {
      console.warn(`redeem-promo: rate limited (${label}) for ${userId}`);
      return {
        statusCode: 429,
        headers: { ...corsHeaders, "Retry-After": String(rl.retryAfter || 900) },
        body: JSON.stringify({ error: "Too many attempts. Please wait a few minutes and try again." }),
      };
    }
  }

  const apiBase = `${supabaseUrl}/rest/v1`;
  const headers = {
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };

  // ── 1. Look up the code ───────────────────────────────────────────────────
  const codeRes = await fetch(
    `${apiBase}/promo_codes?code=eq.${encodeURIComponent(code.toUpperCase())}&active=eq.true&select=*`,
    { headers }
  );
  if (!codeRes.ok) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Failed to look up code" }) };
  }
  const codeRows = await codeRes.json();
  if (!codeRows.length) {
    return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: "Code not found or already used" }) };
  }
  const dbCode = codeRows[0];

  // ── 2. Check expiry ───────────────────────────────────────────────────────
  if (dbCode.expires && new Date(dbCode.expires + "T23:59:59") < new Date()) {
    return { statusCode: 410, headers: corsHeaders, body: JSON.stringify({ error: "This code has expired" }) };
  }

  // ── 3. Calculate tier expiry date ─────────────────────────────────────────
  const tierExpires = dbCode.duration_days
    ? new Date(Date.now() + dbCode.duration_days * 86400000).toISOString().split("T")[0]
    : null;

  // ── 4. Update profiles.tier (atomically via service key) ─────────────────
  const profileRes = await fetch(
    `${apiBase}/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        tier: dbCode.tier,
        tier_via: "promo",
        tier_label: dbCode.label || "Promo",
        tier_expires: tierExpires,
      }),
    }
  );
  if (!profileRes.ok) {
    const err = await profileRes.text();
    console.error("redeem-promo: profile update failed", err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Failed to apply code" }) };
  }

  // ── 5. Mark code as used ──────────────────────────────────────────────────
  await fetch(
    `${apiBase}/promo_codes?id=eq.${dbCode.id}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        active: false,
        redeemed_by: userId,
        redeemed_at: new Date().toISOString(),
      }),
    }
  );

  console.log(`redeem-promo: code ${code} redeemed by ${userId} (${userEmail || "?"}) → tier ${dbCode.tier}`);

  return {
    statusCode: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      tier: dbCode.tier,
      label: dbCode.label || "Promo",
      tierExpires,
    }),
  };
};
