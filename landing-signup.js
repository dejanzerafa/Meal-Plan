// netlify/functions/landing-signup.js
// Captures email signups (landing page + in-app AccountCard) into Supabase
// and fires a welcome email via Resend on first signup.
//
// Required env vars:
//   SUPABASE_URL          — https://xxx.supabase.co
//   SUPABASE_SERVICE_KEY  — service_role key
//   RESEND_API_KEY        — re_xxxxxxxxxxxxxxxxxxxx  (optional; email skipped if missing)
//   FROM_EMAIL            — e.g. Dejan <hello@yourdomain.com>
//   APP_URL               — e.g. https://dejan-mealplan.netlify.app

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email, name, source } = payload;
  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  // Honeypot check (frontend should send botField empty)
  if (payload.botField) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  try {
    // Upsert signup — track whether this is a new record
    const { data: existing } = await supabase
      .from("email_signups")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .single();

    const isNew = !existing;

    const { error } = await supabase
      .from("email_signups")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          name: name ? name.trim() : null,
          source: source || "app-account",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (error) throw error;

    // Send welcome email only on first signup
    if (isNew) {
      await sendWelcomeEmail(email.trim(), name || "");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, welcome: isNew }),
    };
  } catch (err) {
    console.error("Signup error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

async function sendWelcomeEmail(email, name) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY not set — skipping welcome email");
    return;
  }

  const fromEmail = process.env.FROM_EMAIL || "Meal Prep <onboarding@resend.dev>";
  const appUrl = process.env.APP_URL || "https://dejan-mealplan.netlify.app";
  const firstName = (name || "").split(" ")[0] || "there";

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
      html: buildWelcomeEmail(firstName, appUrl),
    }),
  });

  if (!res.ok) {
    console.error("Resend welcome email failed:", await res.text());
  }
}

function buildWelcomeEmail(firstName, appUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0e9de;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0e9de;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#faf6f0;border-radius:16px;overflow:hidden;border:1px solid #ddd3c3;">
        <tr>
          <td style="background:#1a1612;padding:32px 32px 24px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;color:#f3ece0;letter-spacing:0.04em;">MEAL PREP</div>
            <div style="font-size:11px;color:#7a6d5e;letter-spacing:0.12em;margin-top:4px;">REAL FOOD · VERIFIED MACROS</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 10px;">Hey ${firstName} 👋</h1>
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              Your account is live. Here's how to get your first week sorted:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">🍽️</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Pick your recipes</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Recipes tab → assign lunch, dinner, breakfast, pre-workout, and dessert. Every slot is optional.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">🛒</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Generate your grocery list</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Shop tab builds your full list automatically — scaled to 3, 5, or 7 days.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;font-size:22px;width:36px;">📅</td>
                <td>
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Log your batch</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Calendar tab → tap your start date → log. The app marks your shop day and next prep day.</div>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <a href="${appUrl}" style="display:inline-block;background:#b84a1f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;">Open the App →</a>
                </td>
              </tr>
            </table>
            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:14px 18px;">
              <div style="font-size:12px;color:#4a3f33;line-height:1.7;">
                <strong style="color:#1a1612;">Most recipes are free to browse.</strong> Unlock any single recipe for $1.99, or get lifetime access for $59.99 — every recipe, every future drop.
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#1a1612;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#7a6d5e;margin:0;line-height:1.7;">Cook once. Eat all week.<br>Reply to this email with any questions.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
