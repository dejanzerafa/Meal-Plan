// netlify/functions/save-user.js
// 1. Upserts user in Supabase
// 2. Adds contact to Resend Audience
// 3. Sends welcome email inline via Resend (first save only)
//
// Required env vars:
//   SUPABASE_URL         â€” https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY â€” service_role key (not anon)
//   RESEND_API_KEY       â€” re_xxxx...
//   RESEND_AUDIENCE_ID   â€” (from Resend â†’ Audiences)

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
    // â”€â”€ 1. Upsert user in Supabase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ?on_conflict=email tells PostgREST which column to use for merge
    const upsertRes = await fetch(
      `${supabaseUrl}/rest/v1/users?on_conflict=email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          email,
          first_name: first_name || null,
          last_name:  last_name  || null,
          marketing_opt_in,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    let userData = null;
    if (upsertRes.ok) {
      const rows = await upsertRes.json();
      userData = Array.isArray(rows) ? rows[0] : rows;
    } else {
      const err = await upsertRes.text();
      console.error("Supabase upsert error:", err);
    }

    // â”€â”€ 2. Add contact to Resend Audience â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€ 3. Send welcome email inline (no internal HTTP call) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const alreadySent = userData?.welcome_sent;
    if (!alreadySent && resendKey) {
      const firstName = first_name || (email.split("@")[0]) || "there";
      const fullName  = [first_name, last_name].filter(Boolean).join(" ");

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
          // Mark welcome_sent so we never double-send
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
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("save-user error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// â”€â”€ Welcome email HTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
