// netlify/functions/push-subscribe.js
// Stores or removes a browser push subscription for a registered user.
// Called from the app when the user enables/disables prep day reminders.
//
// POST body:
//   { email, subscription: <PushSubscription JSON>, action: "subscribe"|"unsubscribe" }
//
// Required env vars:
//   SUPABASE_URL         - https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY - service_role key
//
// Supabase table: users
//   Add column: push_subscription text (nullable)

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const headers = { "Content-Type": "application/json" };

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

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing env vars" }) };
  }

  try {
    const pushValue = action === "subscribe"
      ? JSON.stringify(subscription)
      : null;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ push_subscription: pushValue }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase patch error:", err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "DB update failed", detail: err }) };
    }

    console.log(`push-subscribe: ${action} for ${email}`);
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
