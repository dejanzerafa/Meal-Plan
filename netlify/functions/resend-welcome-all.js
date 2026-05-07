// netlify/functions/resend-welcome-all.js
// Admin endpoint â€” sends "Welcome Back!" to every user in Supabase.
// Protected by ADMIN_SECRET env var. Never expose this URL publicly.
//
// Usage:
//   curl -X POST https://soulgainz.app/.netlify/functions/resend-welcome-all \
//     -H "Content-Type: application/json" \
//     -d '{"secret":"YOUR_ADMIN_SECRET"}'
//
// Optional body params:
//   { "secret": "...", "email": "specific@email.com" }  â€” single user only
//   { "secret": "...", "dry_run": true }                â€” list targets without sending
//
// Required env vars:
//   ADMIN_SECRET         â€” any strong passphrase you set in Netlify env vars
//   SUPABASE_URL         â€” https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY â€” service_role key
//   RESEND_API_KEY       â€” re_xxxx...
//   FROM_EMAIL           â€” SoulGainz <admin@soulgainz.app>
//   APP_URL              â€” https://soulgainz.app

const RATE_LIMIT_MS = 300; // ms between sends (Resend free = ~2 req/s)

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || payload.secret !== adminSecret) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey   = process.env.RESEND_API_KEY;
  const fromEmail   = process.env.FROM_EMAIL || "SoulGainz <admin@soulgainz.app>";
  const appUrl      = process.env.APP_URL || "https://soulgainz.app";
  const dryRun      = payload.dry_run === true;
  const targetEmail = payload.email || null;

  if (!supabaseUrl || !supabaseKey || !resendKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing env vars" }) };
  }

  try {
    // â”€â”€ Fetch users from Supabase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let url = `${supabaseUrl}/rest/v1/users?marketing_opt_in=eq.true&select=email,first_name`;
    if (targetEmail) {
      url = `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(targetEmail)}&select=email,first_name`;
    }

    const usersRes = await fetch(url, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    if (!usersRes.ok) {
      const err = await usersRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: "Supabase fetch failed", detail: err }) };
    }

    const users = await usersRes.json();
    console.log(`Found ${users.length} users to contact`);

    if (dryRun) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          dry_run: true,
          count: users.length,
          emails: users.map((u) => u.email),
        }),
      };
    }

    // â”€â”€ Send Welcome Back emails â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const results = { sent: [], failed: [] };

    for (const user of users) {
      const firstName = user.first_name || user.email.split("@")[0] || "there";

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    fromEmail,
            to:      user.email,
            subject: "Welcome back to SoulGainz ðŸ”¥",
            html:    buildWelcomeBackEmail(firstName, appUrl),
          }),
        });

        if (emailRes.ok) {
          console.log("Sent to", user.email);
          results.sent.push(user.email);
        } else {
          const err = await emailRes.text();
          console.error("Failed:", user.email, err);
          results.failed.push({ email: user.email, error: err });
        }
      } catch (e) {
        console.error("Error:", user.email, e.message);
        results.failed.push({ email: user.email, error: e.message });
      }

      // Rate limiting â€” pause between sends
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        sent: results.sent.length,
        failed: results.failed.length,
        details: results,
      }),
    };
  } catch (err) {
    console.error("resend-welcome-all error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// â”€â”€ Welcome Back email HTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildWelcomeBackEmail(firstName, appUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0e9de;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0e9de;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#faf6f0;border-radius:16px;overflow:hidden;border:1px solid #ddd3c3;">

        <tr>
          <td style="background:#0C0B0A;padding:32px 32px 24px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.06em;">
              <span style="color:#E07B2A;">SOUL</span><span style="color:#F2EDE6;">GAINZ</span>
            </div>
            <div style="font-size:11px;color:#8C8279;letter-spacing:0.16em;margin-top:6px;">FEED YOUR SOUL Â· FUEL YOUR GAINZ</div>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 10px;">Welcome back, ${firstName} ðŸ”¥</h1>
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              Good to have you back. Your meal plan is right where you left it â€” your recipes, your grocery list, your schedule. Pick up exactly where you stopped.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:24px;width:36px;">ðŸ³</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:4px;">Your recipes are still saved</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Head to the Recipes tab to review or switch up your weekly rotation.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:24px;width:36px;">ðŸ›’</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:4px;">Regenerate your grocery list</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Shop tab rebuilds your full ingredient list in one tap â€” scaled to your batch size.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:24px;width:36px;">ðŸ”“</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:4px;">Unlock more recipes</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Single recipes from $1.99, or go lifetime for $59.99 â€” every recipe, every future drop, forever.</div>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;letter-spacing:0.02em;">
                    Back to SoulGainz â†’
                  </a>
                </td>
              </tr>
            </table>

            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:16px 18px;">
              <div style="font-size:12px;color:#4a3f33;line-height:1.7;">
                <strong style="color:#1a1612;">Cook once. Eat all week.</strong> Consistency is the secret â€” and you're already back. Let's go.
              </div>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.8;">
              Questions? Reply to this email or reach us at <a href="mailto:admin@soulgainz.app" style="color:#E07B2A;text-decoration:none;">admin@soulgainz.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
