// netlify/functions/save-user.js
// 1. Upserts user in Supabase (PATCH existing â†’ INSERT if new)
// 2. Adds contact to Resend Audience
// 3a. New user  â†’ sends "Welcome to SoulGainz" email + sets welcome_sent = true
// 3b. Returning â†’ sends "Welcome Back!" email (always on re-save)
//
// Required env vars:
//   SUPABASE_URL         â€” https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY â€” service_role key (not anon)
//   RESEND_API_KEY       â€” re_xxxx...
//   RESEND_AUDIENCE_ID   â€” (from Resend â†’ Audiences)
//   FROM_EMAIL           â€” e.g. SoulGainz <admin@soulgainz.app>
//   APP_URL              â€” e.g. https://soulgainz.app

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

  const { email, first_name, last_name, marketing_opt_in = true } = payload;

  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey   = process.env.RESEND_API_KEY;
  const audienceId  = process.env.RESEND_AUDIENCE_ID;
  const fromEmail   = process.env.FROM_EMAIL || "SoulGainz <admin@soulgainz.app>";
  const appUrl      = process.env.APP_URL || "https://soulgainz.app";

  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase not configured â€” skipping");
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  try {
    // â”€â”€ 1. Save user in Supabase â€” PATCH existing, INSERT if new â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        }),
      }
    );

    if (patchRes.ok) {
      const rows = await patchRes.json();
      userData = Array.isArray(rows) ? rows[0] : (rows || null);
      if (userData) console.log("Supabase: updated existing user", email);
    }

    // No existing row found â€” insert new user
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

    // â”€â”€ 2. Add / update contact in Resend Audience â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€ 3. Send email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (resendKey) {
      const firstName = first_name || email.split("@")[0] || "there";
      const alreadySent = userData?.welcome_sent;

      // 3a. Brand-new user â€” send Welcome email
      if (isNewUser || !alreadySent) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from:    fromEmail,
              to:      email,
              subject: "Welcome to SoulGainz â€” your meal plan is ready ðŸ³",
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

      // 3b. Returning user â€” send Welcome Back email
      } else {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from:    fromEmail,
              to:      email,
              subject: "Welcome back to SoulGainz ðŸ”¥",
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

// â”€â”€ Welcome email (new users) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildWelcomeEmail(firstName, appUrl) {
  const steps = [
    ["ðŸ½ï¸", "Pick your recipes", "Head to the Recipes tab and assign a lunch and dinner. Breakfast, pre-workout, and dessert slots are there too."],
    ["ðŸ›’", "Generate your grocery list", "The Shop tab builds your full ingredient list automatically, scaled to your batch size."],
    ["ðŸ“…", "Log your first batch", "In the Calendar tab, mark the day you're cooking. The app tracks your prep day and next shop day."],
  ];

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
            <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 10px;">Hey ${firstName} ðŸ‘‹</h1>
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              You're in. Your meal plan is live and waiting â€” here's how to get the most out of it in your first session:
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
                    Open SoulGainz â†’
                  </a>
                </td>
              </tr>
            </table>

            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:16px 18px;">
              <div style="font-size:12px;color:#4a3f33;line-height:1.7;">
                <strong style="color:#1a1612;">Most recipes are free to browse.</strong> Unlock any single recipe for $1.99, or go lifetime for $59.99 â€” every recipe we've ever made, plus every future drop.
              </div>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.8;">
              Cook once. Eat all week.<br>
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

// â”€â”€ Welcome Back email (returning users) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
