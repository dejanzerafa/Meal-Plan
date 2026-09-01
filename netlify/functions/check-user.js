// netlify/functions/check-user.js
// Lightweight GET endpoint — returns { exists: bool, calc_used: bool } for a given email.
// Used by the client to enforce server-side calc gate.

// Exact matching (correctly) replaced startsWith, but browsers send
// "http://localhost:8888" WITH the port, which no exact list can contain.
// Allow loopback separately, and only outside production.
const { rateLimit, clientIp } = require("./_shared/auth");
const _isLocalOrigin = o => process.env.CONTEXT !== "production" &&
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || "");

exports.handler = async (event) => {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  // This is an account-existence oracle: it returns {exists} for any
  // address, and the origin check above is `if (origin && ...)` so any non-browser
  // client simply omits the header and passes. Rate limiting was the only missing
  // control, so enumeration was unbounded.
  {
    const _rl = await rateLimit(`checkuser:${clientIp(event)}`, { max: 20, windowMs: 60000 });
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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  // POST is the primary path. The client was moved to POST so the email stays out
  // of Netlify access logs, browser history and Sentry breadcrumbs (Sentry captures
  // fetch URLs; beforeSend only strips event.user.email). The POST-parsing block
  // below was added at the same time — but this gate was left rejecting everything
  // that is not GET, so every call 405'd, the read-back of calc_used never
  // happened, and canUseCalculator silently fell through to the localStorage-only
  // check. The "one free calculation per email" rule held only until a user
  // cleared a key or opened the app on another device.
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST" && event.httpMethod !== "OPTIONS") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Origin check — only allow requests from known app origins
  const origin = event.headers && (event.headers.origin || event.headers.Origin || "");
  const allowed = ["https://soulgainz.app", "https://www.soulgainz.app", "https://soulgainz.netlify.app", "http://localhost", "http://127.0.0.1"];
  if (origin && !allowed.includes(origin) && !_isLocalOrigin(origin)) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }

  // Accept the email from a POST body (preferred — keeps it out of access logs,
  // browser history and Sentry breadcrumbs) and still from the query string for
  // any client that has not updated yet.
  let email = null;
  if (event.httpMethod === "POST" && event.body) {
    try { email = JSON.parse(event.body).email; } catch (_) {}
  }
  if (!email) email = event.queryStringParameters && event.queryStringParameters.email;
  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 200, body: JSON.stringify({ exists: false, calc_used: false }) };
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=calc_used`,
      {
        method: "GET",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("check-user Supabase error:", err);
      return { statusCode: 200, body: JSON.stringify({ exists: false, calc_used: false }) };
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ exists: false, calc_used: false }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ exists: true, calc_used: rows[0].calc_used === true }),
    };
  } catch (err) {
    console.error("check-user error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
