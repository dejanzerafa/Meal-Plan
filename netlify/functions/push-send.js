// netlify/functions/push-send.js
// Sends a web push notification to one or all subscribed users.
// Can be triggered manually (admin) or via Netlify scheduled function.
//
// Usage:
//   curl -X POST https://soulgainz.app/.netlify/functions/push-send \
//     -H "Content-Type: application/json" \
//     -d '{ "secret": "YOUR_ADMIN_SECRET", "title": "Prep day tomorrow!", "body": "Your batch cook is scheduled for tomorrow. Check your list." }'
//
// Optional body params:
//   "email"  - send to one user only
//   "url"    - deep link URL opened when notification tapped (default "/")
//   "tag"    - notification tag to replace duplicate (default "prep-reminder")
//
// Required env vars:
//   ADMIN_SECRET          - your private passphrase
//   SUPABASE_URL          - https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY  - service_role key
//   VAPID_PUBLIC_KEY      - generate with: npx web-push generate-vapid-keys
//   VAPID_PRIVATE_KEY     - generate with: npx web-push generate-vapid-keys
//   VAPID_EMAIL           - mailto:support@soulgainz.app
//
// ── One-time VAPID setup ──────────────────────────────────────────────────────
// Run in your terminal:  npx web-push generate-vapid-keys
// Copy both keys into Netlify → Site → Environment variables.
// Paste the PUBLIC key into the app's VAPID_PUBLIC_KEY constant (index.html).

const { secretsMatch } = require("./_shared/auth");

const webpush = require("web-push");

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

  // ── Auth ──────────────────────────────────────────────────────────────────
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || !secretsMatch(payload.secret, adminSecret)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const supabaseUrl  = process.env.SUPABASE_URL;
  const supabaseKey  = process.env.SUPABASE_SERVICE_KEY;
  const vapidPublic  = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail   = process.env.VAPID_EMAIL || "mailto:support@soulgainz.app";

  if (!supabaseUrl || !supabaseKey || !vapidPublic || !vapidPrivate) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing env vars (SUPABASE or VAPID keys)" }) };
  }

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

  const title       = payload.title || "SoulGainz Reminder";
  const body        = payload.body  || "Time to prep! Your batch cook is coming up.";
  const url         = payload.url   || "/";
  const tag         = payload.tag   || "prep-reminder";
  const targetEmail = payload.email || null;

  // ── Fetch subscribers from Supabase ───────────────────────────────────────
  try {
    let endpoint = `${supabaseUrl}/rest/v1/users?push_subscription=not.is.null&select=email,push_subscription`;
    if (targetEmail) {
      endpoint = `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}&select=email,push_subscription`;
    }

    const usersRes = await fetch(endpoint, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    if (!usersRes.ok) {
      const err = await usersRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Supabase fetch failed", detail: err }) };
    }

    const users = await usersRes.json();
    const notification = JSON.stringify({ title, body, url, tag });

    const results = { sent: 0, failed: 0, errors: [] };

    await Promise.all(users.map(async (user) => {
      if (!user.push_subscription) return;
      let sub;
      try {
        sub = typeof user.push_subscription === "string"
          ? JSON.parse(user.push_subscription)
          : user.push_subscription;
      } catch (e) {
        results.failed++;
        return;
      }

      try {
        await webpush.sendNotification(sub, notification);
        results.sent++;
        console.log("Push sent to", user.email);
      } catch (err) {
        results.failed++;
        results.errors.push({ email: user.email, error: err.message });
        console.error("Push failed for", user.email, err.message);

        // If subscription is expired/invalid, clear it from DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await fetch(
            `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(user.email)}`,
            {
              method: "PATCH",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
              },
              body: JSON.stringify({ push_subscription: null }),
            }
          );
          console.log("Cleared expired subscription for", user.email);
        }
      }
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, sent: results.sent, failed: results.failed, errors: results.errors }),
    };

  } catch (err) {
    console.error("push-send error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
