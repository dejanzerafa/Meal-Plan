// netlify/functions/save-user.js
// 1. Upserts user in Supabase (PATCH existing -> INSERT if new)
// 2. Adds contact to Resend Audience
// 3a. New user  -> sends "Welcome to SoulGainz" email + sets welcome_sent = true
// 3b. Returning -> sends "Welcome Back!" email (always on re-save)
// Pass skip_email: true in payload to upsert data without sending any email
//   (used by Me tab profile updates — welcome was already sent at onboarding)
//
// Required env vars:
//   SUPABASE_URL         - https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY - service_role key (not anon)
//   RESEND_API_KEY       - re_xxxx...
//   RESEND_AUDIENCE_ID   - (from Resend -> Audiences)
//   FROM_EMAIL           - e.g. SoulGainz <support@soulgainz.app>
//   APP_URL              - e.g. https://soulgainz.app

// Simple in-memory rate limiter: max 5 requests per email per 60 seconds
// Exact matching (correctly) replaced startsWith, but browsers send
// "http://localhost:8888" WITH the port, which no exact list can contain.
// Allow loopback separately, and only outside production.
const { escHtml } = require("./_shared/auth");

const _isLocalOrigin = o => process.env.CONTEXT !== "production" &&
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || "");

const _rateLimitMap = new Map();
function _checkRateLimit(email) {
  const now = Date.now();
  const key = email.toLowerCase().trim();
  const entry = _rateLimitMap.get(key) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 60000) {
    _rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  _rateLimitMap.set(key, entry);
  return true;
}

exports.handler = async (event) => {
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

  // Origin check — only allow requests from known app origins
  const origin = event.headers && (event.headers.origin || event.headers.Origin || "");
  const allowed = ["https://soulgainz.app", "https://www.soulgainz.app", "https://soulgainz.netlify.app", "http://localhost", "http://127.0.0.1"];
  if (origin && !allowed.includes(origin) && !_isLocalOrigin(origin)) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email, first_name, last_name, marketing_opt_in = true, skip_email = false, calc_used } = payload;

  if (email && !_checkRateLimit(email)) {
    return { statusCode: 429, body: JSON.stringify({ error: "Too many requests. Please wait a moment." }) };
  }

  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey   = process.env.RESEND_API_KEY;
  const audienceId  = process.env.RESEND_AUDIENCE_ID;
  const fromEmail   = process.env.FROM_EMAIL || "SoulGainz <support@soulgainz.app>";
  const appUrl      = process.env.APP_URL || "https://soulgainz.app";

  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase not configured - skipping");
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  try {
    // -- 1. Save user in Supabase - PATCH existing, INSERT if new ----------------
    let userData = null;
    let isNewUser = false;

    // Try to update an existing row first
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          first_name: first_name || null,
          last_name:  last_name  || null,
          marketing_opt_in,
          updated_at: new Date().toISOString(),
          ...(calc_used === true ? { calc_used: true } : {}),
        }),
      }
    );

    if (patchRes.ok) {
      const rows = await patchRes.json();
      userData = Array.isArray(rows) ? rows[0] : (rows || null);
      if (userData) console.log("Supabase: updated existing user", email);
    }

    // No existing row found - insert new user
    if (!userData) {
      isNewUser = true;
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          email,
          first_name: first_name || null,
          last_name:  last_name  || null,
          marketing_opt_in,
          updated_at: new Date().toISOString(),
          ...(calc_used === true ? { calc_used: true } : {}),
        }),
      });

      if (insertRes.ok) {
        const rows = await insertRes.json();
        userData = Array.isArray(rows) ? rows[0] : rows;
        console.log("Supabase: inserted new user", email);
      } else {
        const err = await insertRes.text();
        console.error("Supabase insert error:", err);
      }
    }

    // -- 2. Add / update contact in Resend Audience ------------------------------
    if (resendKey && audienceId && marketing_opt_in) {
      fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: first_name || "",
          last_name:  last_name  || "",
          unsubscribed: false,
        }),
      }).catch((e) => console.error("Resend audience error:", e));
    }

    // -- 3. Send email -----------------------------------------------------------
    // skip_email: true means this is a profile update (Me tab) — data saved, no email
    if (resendKey && !skip_email) {
      // ⚠️ MUST be escaped: this endpoint is unauthenticated and `to:` is the
      // caller-supplied address, so an unescaped first_name lets anyone send
      // arbitrary HTML from support@soulgainz.app — SPF/DKIM-aligned phishing
      // riding our sending reputation. Shared helper — see _shared/auth.js escHtml.
      const firstName = escHtml(String(first_name || email.split("@")[0] || "there").slice(0, 50));
      const alreadySent = userData?.welcome_sent;

      // 3a. Brand-new user - send Welcome email
      if (isNewUser || !alreadySent) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
              from:    fromEmail,
              to:      email,
              subject: "Welcome to SoulGainz - your meal plan is ready",
              html:    buildWelcomeEmail(firstName, appUrl),
            }),
          });

          if (emailRes.ok) {
            console.log("Welcome email sent to", email);
            // Mark so we don't send the new-user welcome again
            await fetch(
              `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": supabaseKey,
                  "Authorization": `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({ welcome_sent: true }),
              }
            ).catch((e) => console.error("Mark welcome_sent error:", e));
          } else {
            const err = await emailRes.text();
            console.error("Resend send error:", err);
          }
        } catch (emailErr) {
          console.error("Welcome email error:", emailErr.message);
        }

      // 3b. Returning user - send Welcome Back email
      } else {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify({
              from:    fromEmail,
              to:      email,
              subject: "Welcome back to SoulGainz",
              html:    buildWelcomeBackEmail(firstName, appUrl),
            }),
          });

          if (emailRes.ok) {
            console.log("Welcome Back email sent to", email);
          } else {
            const err = await emailRes.text();
            console.error("Resend welcome-back error:", err);
          }
        } catch (emailErr) {
          console.error("Welcome Back email error:", emailErr.message);
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("save-user error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// -- Welcome email (new users) --------------------------------------------------
function buildWelcomeEmail(firstName, appUrl) {
  const steps = [
    ["&#x1F37D;&#xFE0F;", "Pick your recipes", "Head to the Recipes tab and assign a lunch and dinner. Breakfast, pre-workout, and dessert slots are there too."],
    ["&#x1F6D2;", "Generate your grocery list", "The Shop tab builds your full ingredient list automatically, scaled to your batch size."],
    ["&#x1F4C5;", "Log your first batch", "In the Calendar tab, mark the day you&apos;re cooking. The app tracks your prep day and next shop day."],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0e9de;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0e9de;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#faf6f0;border-radius:16px;overflow:hidden;border:1px solid #ddd3c3;">

        <tr>
          <td style="background:#0C0B0A;padding:32px 32px 24px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.06em;">
              <span style="color:#E07B2A;">SOUL</span><span style="color:#F2EDE6;">GAINZ</span>
            </div>
            <div style="font-size:11px;color:#8C8279;letter-spacing:0.16em;margin-top:6px;">FEED YOUR SOUL &middot; FUEL YOUR GAINZ</div>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 10px;">Hey ${firstName} &#x1F44B;</h1>
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              You&apos;re in. Your meal plan is live and waiting &mdash; here&apos;s how to get the most out of it in your first session:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${steps.map(([icon, title, body]) => `
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:18px;font-size:24px;width:36px;">${icon}</td>
                <td style="padding-bottom:18px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:4px;">${title}</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">${body}</div>
                </td>
              </tr>`).join("")}
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;letter-spacing:0.02em;">
                    Open SoulGainz &#x2192;
                  </a>
                </td>
              </tr>
            </table>

            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:16px 18px;">
              <div style="font-size:12px;color:#4a3f33;line-height:1.7;">
                <strong style="color:#1a1612;">Most recipes are free to browse.</strong> Unlock the full library from &euro;16.99/mo, or save with the annual plan at &euro;150/yr &mdash; every recipe we&apos;ve ever made, plus every future drop.
              </div>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.8;">
              Cook once. Eat all week.<br>
              Questions? Reply to this email or reach us at <a href="mailto:support@soulgainz.app" style="color:#E07B2A;text-decoration:none;">support@soulgainz.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// -- Welcome Back email (returning users) ---------------------------------------
function buildWelcomeBackEmail(firstName, appUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0e9de;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0e9de;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#faf6f0;border-radius:16px;overflow:hidden;border:1px solid #ddd3c3;">

        <tr>
          <td style="background:#0C0B0A;padding:32px 32px 24px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.06em;">
              <span style="color:#E07B2A;">SOUL</span><span style="color:#F2EDE6;">GAINZ</span>
            </div>
            <div style="font-size:11px;color:#8C8279;letter-spacing:0.16em;margin-top:6px;">FEED YOUR SOUL &middot; FUEL YOUR GAINZ</div>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 10px;">Welcome back, ${firstName} &#x1F525;</h1>
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              Good to have you back. Your meal plan is right where you left it &mdash; your recipes, your grocery list, your schedule. Pick up exactly where you stopped.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:24px;width:36px;">&#x1F373;</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:4px;">Your recipes are still saved</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Head to the Recipes tab to review or switch up your weekly rotation.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:24px;width:36px;">&#x1F6D2;</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:4px;">Regenerate your grocery list</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Shop tab rebuilds your full ingredient list in one tap &mdash; scaled to your batch size.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:24px;width:36px;">&#x1F513;</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:4px;">Unlock more recipes</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Monthly from &euro;16.99, or annual for &euro;150/yr &mdash; every recipe, every future drop.</div>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;letter-spacing:0.02em;">
                    Back to SoulGainz &#x2192;
                  </a>
                </td>
              </tr>
            </table>

            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:16px 18px;">
              <div style="font-size:12px;color:#4a3f33;line-height:1.7;">
                <strong style="color:#1a1612;">Cook once. Eat all week.</strong> Consistency is the secret &mdash; and you&apos;re already back. Let&apos;s go.
              </div>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.8;">
              Questions? Reply to this email or reach us at <a href="mailto:support@soulgainz.app" style="color:#E07B2A;text-decoration:none;">support@soulgainz.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
