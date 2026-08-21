// netlify/functions/push-subscribe.js
// Stores or removes a browser push subscription for a registered user.
// Called from the app when the user enables/disables prep day reminders.
//
// POST body:
//   { email, subscription: <PushSubscription JSON>, action: "subscribe"|"unsubscribe" }
// Headers:
//   Authorization: Bearer <supabase_access_token>   (required — proves ownership of email)
//
// Required env vars:
//   SUPABASE_URL         - https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY - service_role key
//
// Supabase table: users
//   Add column: push_subscription text (nullable)

const { createClient } = require("@supabase/supabase-js");

const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
  "https://soulgainz.netlify.app",
  "http://localhost",
  "http://127.0.0.1",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "https://soulgainz.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age":       "86400",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const headers = { "Content-Type": "application/json", ...CORS_HEADERS };

  // ── Payload size guard (push subscription objects are ~500 bytes max) ─────
  if (event.body && event.body.length > 8192) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Payload too large" }) };
  }

  // ── Origin check ─────────────────────────────────────────────────────────
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  if (origin && !ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Forbidden" }) };
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email, subscription, action } = payload;
  if (!email || !action) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "email and action required" }) };
  }

  // ── Input validation ──────────────────────────────────────────────────────
  if (!email.includes("@") || email.length > 254) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid email" }) };
  }
  if (!["subscribe", "unsubscribe"].includes(action)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid action" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing env vars" }) };
  }

  // ── JWT verification — caller must prove they own the email ───────────────
  const authHeader = event.headers["authorization"] || event.headers["Authorization"] || "";
  const userToken  = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!userToken) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Authentication required. Include Authorization: Bearer <session_token>." }),
    };
  }

  // Use the user's own JWT (not service role) to resolve their identity
  const sbUser = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseKey);
  const { data: { user }, error: authErr } = await sbUser.auth.getUser(userToken);

  if (authErr || !user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid or expired session" }) };
  }

  if (user.email?.toLowerCase() !== email.toLowerCase()) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: "Token email does not match request email" }),
    };
  }

  // ── Update push_subscription in the users (waitlist) table ───────────────
  try {
    const pushValue = action === "subscribe"
      ? JSON.stringify(subscription)
      : null;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        headers: {
          "apikey":         supabaseKey,
          "Authorization":  `Bearer ${supabaseKey}`,
          "Content-Type":   "application/json",
          "Prefer":         "return=minimal",
        },
        body: JSON.stringify({ push_subscription: pushValue }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase patch error:", err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "DB update failed", detail: err }) };
    }

    console.log(`push-subscribe: ${action} for ${email} (verified uid: ${user.id})`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, action, email }),
    };
  } catch (err) {
    console.error("push-subscribe error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
