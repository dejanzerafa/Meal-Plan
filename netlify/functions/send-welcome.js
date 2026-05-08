// netlify/functions/send-welcome.js
// Standalone welcome email sender - called by landing-signup and AccountCard
// on first account save. Idempotent: safe to call multiple times.
//
// Required env vars (Netlify -> Site -> Environment variables):
//   RESEND_API_KEY   - re_xxxxxxxxxxxxxxxxxxxx
//   FROM_EMAIL       - e.g. SoulGainz <admin@soulgainz.app>
//   APP_URL          - e.g. https://soulgainz.app

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY not set - skipping welcome email");
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email, name } = payload;
  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const fromEmail = process.env.FROM_EMAIL || "SoulGainz <admin@soulgainz.app>";
  const appUrl = process.env.APP_URL || "https://soulgainz.app";
  const firstName = (name || "").split(" ")[0] || "there";

  const html = buildWelcomeEmail(firstName, appUrl);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: "Welcome to SoulGainz - your meal plan is ready",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return { statusCode: 500, body: JSON.stringify({ error: err }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("send-welcome error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

function buildWelcomeEmail(firstName, appUrl) {
  const steps = [
    ["&#x1F37D;&#xFE0F;", "Pick your recipes", "Head to the Recipes tab and assign a lunch and dinner. Breakfast, pre-workout, and dessert slots are there too."],
    ["&#x1F6D2;", "Generate your grocery list", "The Shop tab builds your full ingredient list automatically, scaled to your batch size."],
    ["&#x1F4C5;", "Log your first batch", "In the Calendar tab, mark the day you&apos;re cooking and how many days it&apos;ll cover. The app tracks your shop day and next prep day."],
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
              Your account is set up and your meal plan is waiting. Here&apos;s how to get the most out of it in the first session:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              ${steps.map(([icon, title, body]) => `
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">${icon}</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">${title}</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">${body}</div>
                </td>
              </tr>`).join("")}
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                    Open SoulGainz &#x2192;
                  </a>
                </td>
              </tr>
            </table>

            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:14px 18px;">
              <div style="font-size:12px;color:#4a3f33;line-height:1.7;">
                <strong style="color:#1a1612;">Most recipes are free to browse.</strong> Unlock any single recipe from $14.99/mo, or go lifetime for $149.99 &mdash; every recipe we&apos;ve ever made, plus every future drop.
              </div>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.7;">
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
