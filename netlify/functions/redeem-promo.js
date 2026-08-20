// netlify/functions/redeem-promo.js
// Server-side promo code redemption.
// POST { code, userId }
// Uses the Supabase service_role key — never exposed to the browser.
// Returns { ok, tier, label, tierExpires } or { error }.

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
  if (origin && !ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
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

  const { code, userId, userEmail } = payload;
  if (!code || typeof code !== "string" || code.length > 32) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid code" }) };
  }
  if (!userId) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Must be signed in to redeem a code" }) };
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
    `${apiBase}/profiles?id=eq.${userId}`,
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
