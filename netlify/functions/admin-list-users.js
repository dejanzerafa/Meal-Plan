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
  // Preflights must not consume the quota, and this block used to run before
  // the OPTIONS branch (and reference an undeclared corsHeaders).
  if (event.httpMethod !== "OPTIONS") {
    const _rl = await rateLimit(`adminlist:${clientIp(event)}`, { max: 10, windowMs: 900000 });
    if (!_rl.ok) {
      return { statusCode: 429, headers: { "Content-Type": "application/json" },
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
      // subscription_status and plan_type were selected here and exist in no
      // schema — the live DB confirmed it (diagnostic 2026-09-05, section 9), so
      // this endpoint has 400'd on every call. Plan and status live on the
      // subscriptions table; embed the latest row via the users→subscriptions FK.
      `${supabaseUrl}/rest/v1/users?select=email,first_name,last_name,created_at,marketing_opt_in,subscriptions(tier,status,current_period_end,created_at)&order=created_at.desc&subscriptions.order=created_at.desc`,
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

    const rows = await res.json();
    // Flatten the embed to the shape the old (never-working) select promised,
    // so anything reading subscription_status / plan_type keeps working.
    const users = rows.map(r => {
      const subs = Array.isArray(r.subscriptions) ? r.subscriptions : [];
      const live = subs.find(s => s.status === "active" || s.status === "trialing") || subs[0] || null;
      const { subscriptions, ...rest } = r;
      return { ...rest,
        subscription_status: live ? live.status : null,
        plan_type:           live ? live.tier   : null,
        period_end:          live ? live.current_period_end : null };
    });
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
