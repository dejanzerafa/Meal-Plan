// netlify/functions/send-new-drop.js
// Admin-triggered: sends a new recipe drop announcement to all active subscribers.
// POST with { secret, subject, headline, body, recipes: [{name, description}] }
//
// Required env vars:
//   ADMIN_SECRET — shared secret to authenticate the admin call
//   SUPABASE_URL, SUPABASE_SERVICE_KEY
//   RESEND_API_KEY, FROM_EMAIL, APP_URL

const { createClient } = require("@supabase/supabase-js");

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

  const { secret, subject, headline, body: bodyText, recipes = [] } = payload;
  if (secret !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  if (!subject || !headline) {
    return { statusCode: 400, body: JSON.stringify({ error: "subject and headline required" }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true, reason: "No RESEND_API_KEY" }) };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const fromEmail = process.env.FROM_EMAIL || "SoulGainz <admin@soulgainz.app>";
  const appUrl = process.env.APP_URL || "https://soulgainz.app";

  // Fetch all active subscribers (email from users table via subscriptions)
  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("user_id, users(email)")
    .eq("status", "active");

  if (error) {
    console.error("Supabase error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  const emails = [...new Set((subs || []).map(s => s.users?.email).filter(Boolean))];

  // Batch send via Resend (max 50 per batch)
  const BATCH_SIZE = 50;
  let sent = 0;
  const html = buildDropEmail(headline, bodyText, recipes, appUrl);

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const batchPayload = batch.map(to => ({ from: fromEmail, to, subject, html }));

    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(batchPayload),
      });
      if (res.ok) {
        sent += batch.length;
      } else {
        console.error("Batch send error:", await res.text());
      }
    } catch (e) {
      console.error("Batch send exception:", e);
    }

    // Small delay between batches
    if (i + BATCH_SIZE < emails.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`New drop email sent to ${sent}/${emails.length} subscribers`);
  return { statusCode: 200, body: JSON.stringify({ ok: true, sent, total: emails.length }) };
};

function buildDropEmail(headline, bodyText, recipes, appUrl) {
  const recipeRows = recipes.map(r => `
    <tr>
      <td style="padding-bottom:14px;">
        <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">${r.name}</div>
        ${r.description ? `<div style="font-size:13px;color:#4a3f33;line-height:1.6;">${r.description}</div>` : ""}
      </td>
    </tr>`).join("");

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
            <div style="font-size:11px;color:#8C8279;letter-spacing:0.16em;margin-top:6px;">FEED YOUR SOUL &middot; FUEL YOUR GAINZ</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <div style="font-size:10px;font-weight:700;color:#E07B2A;letter-spacing:0.14em;margin-bottom:10px;">NEW DROP</div>
            <h1 style="font-family:Georgia,serif;font-size:26px;color:#1a1612;margin:0 0 14px;line-height:1.2;">${headline}</h1>
            ${bodyText ? `<p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">${bodyText}</p>` : ""}
            ${recipes.length > 0 ? `
            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <div style="font-size:10px;font-weight:700;color:#7a6d5e;letter-spacing:0.1em;margin-bottom:12px;">WHAT&rsquo;S NEW</div>
              <table cellpadding="0" cellspacing="0" width="100%">${recipeRows}</table>
            </div>` : ""}
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                    Cook it this week &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.7;">
              Cook once. Eat all week.<br>
              <a href="mailto:admin@soulgainz.app" style="color:#E07B2A;text-decoration:none;">admin@soulgainz.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
