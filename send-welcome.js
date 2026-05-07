// netlify/functions/send-welcome.js
// Standalone welcome email sender — called by landing-signup and AccountCard
// on first account save. Idempotent: safe to call multiple times.
//
// Required env vars (Netlify → Site → Environment variables):
//   RESEND_API_KEY   — re_xxxxxxxxxxxxxxxxxxxx
//   FROM_EMAIL       — e.g. Dejan <hello@yourdomain.com>
//   APP_URL          — e.g. https://dejan-mealplan.netlify.app

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY not set — skipping welcome email");
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: "Welcome — your meal plan is ready 🍳",
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
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0e9de;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0e9de;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#faf6f0;border-radius:16px;overflow:hidden;border:1px solid #ddd3c3;">

        <!-- Header -->
        <tr>
          <td style="background:#1a1612;padding:32px 32px 24px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;color:#f3ece0;letter-spacing:0.04em;">SOULGAINZ</div>
            <div style="font-size:11px;color:#7a6d5e;letter-spacing:0.12em;margin-top:4px;">REAL FOOD · MADE SIMPLE</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 10px;">Hey ${firstName} 👋</h1>
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              Your account is set up and your meal plan is waiting. Here's how to get the most out of it in the first session:
            </p>

            <!-- Steps -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              ${[
                ["🍽️", "Pick your recipes", "Head to the Recipes tab and assign a lunch and dinner. Breakfast, pre-workout, and dessert slots are there too."],
                ["🛒", "Generate your grocery list", "The Shop tab builds your full ingredient list automatically, scaled to your batch size."],
                ["📅", "Log your first batch", "In the Calendar tab, mark the day you're cooking and how many days it'll cover. The app tracks your shop day and next prep day."],
              ].map(([icon, title, body]) => `
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">${icon}</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">${title}</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">${body}</div>
                </td>
              </tr>`).join("")}
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <a href="${appUrl}" style="display:inline-block;background:#b84a1f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                    Open the App →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Note -->
            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:14px 18px;">
              <div style="font-size:12px;color:#4a3f33;line-height:1.7;">
                <strong style="color:#1a1612;">Most recipes are free to browse.</strong> Unlock any single recipe for $1.99, or go all-in with lifetime access for $59.99 — every recipe we've ever made plus every future drop.
              </div>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1a1612;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#7a6d5e;margin:0;line-height:1.7;">
              Cook once. Eat all week.<br>
              Questions? Just reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
