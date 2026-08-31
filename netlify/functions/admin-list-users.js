// netlify/functions/admin-list-users.js
// Returns all users from Supabase for the admin dashboard.
// Protected by ADMIN_SECRET — never expose this endpoint publicly.
//
// Required env vars:
//   ADMIN_SECRET         - your private passphrase
//   SUPABASE_URL         - https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY - service_role key

const { clientIp, rateLimit, secretsMatch } = require("./_shared/auth");

exports.handler = async (event) => {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  // admin-verify limits password attempts to 10 per 15 minutes, but this
  // endpoint accepts the SAME ADMIN_SECRET with no limit — so the secret could be
  // ground here, never touching the limiter, and this one dumps every user.
  {
    const _rl = await rateLimit(`adminlist:${clientIp(event)}`, { max: 10, windowMs: 900000 });
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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // CORS for admin.html on same origin
  const headers = {
    "Access-Control-Allow-Origin": "https://soulgainz.app",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || !secretsMatch(payload.secret, adminSecret)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing Supabase env vars" }) };
  }

  try {
    // Fetch all users — select the columns needed for the dashboard
    const res = await fetch(
      `${supabaseUrl}/rest/v1/users?select=email,first_name,last_name,created_at,subscription_status,plan_type,marketing_opt_in&order=created_at.desc`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Accept": "application/json",
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase error:", err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Supabase fetch failed", detail: err }) };
    }

    const users = await res.json();
    console.log(`admin-list-users: returned ${users.length} users`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, count: users.length, users }),
    };
  } catch (err) {
    console.error("admin-list-users error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
