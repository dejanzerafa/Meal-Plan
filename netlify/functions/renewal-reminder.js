// netlify/functions/renewal-reminder.js
// Daily cron at 09:00 UTC — finds subscriptions expiring in 7 days and sends renewal reminders.
//
// Schedule in netlify.toml:
//   [[functions]]
//   name = "renewal-reminder"
//   schedule = "0 9 * * *"
//
// Required env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_KEY
//   RESEND_API_KEY, FROM_EMAIL
//   APP_URL

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const apiKey     = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase env vars not set — skipping renewal reminders");
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true, reason: "no_supabase" }) };
  }
  if (!apiKey) {
    console.log("RESEND_API_KEY not set — skipping renewal reminders");
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true, reason: "no_resend" }) };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const fromEmail = process.env.FROM_EMAIL || "SoulGainz <support@soulgainz.app>";
  const appUrl = process.env.APP_URL || "https://soulgainz.app";

  // Find subscriptions expiring in 6-8 days (window prevents double-sends on retry)
  const now = new Date();
  const windowStart = new Date(now.getTime() + 6 * 86400 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 8 * 86400 * 1000).toISOString();

  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("user_id, tier, current_period_end, users(email)")
    .eq("status", "active")
    .eq("cancel_at_period_end", false)
    .gte("current_period_end", windowStart)
    .lte("current_period_end", windowEnd);

  if (error) {
    console.error("Supabase query error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  if (!subs || subs.length === 0) {
    console.log("No renewals in the 6–8 day window");
    return { statusCode: 200, body: JSON.stringify({ ok: true, sent: 0 }) };
  }

  let sent = 0;
  for (const sub of subs) {
    const email = sub.users?.email;
    if (!email) continue;

    const renewDate = new Date(sub.current_period_end).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    const tierLabel = { annual: "Annual", quarterly: "Quarterly", monthly: "Monthly" }[sub.tier] || sub.tier;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: `Your SoulGainz ${tierLabel} plan renews in 7 days`,
          html: buildRenewalEmail(tierLabel, renewDate, appUrl),
        }),
      });
      if (res.ok) sent++;
      else console.error("Resend error for", email, await res.text());
    } catch (e) {
      console.error("Send error for", email, e);
    }
  }

  console.log(`Renewal reminders sent: ${sent}/${subs.length}`);
  return { statusCode: 200, body: JSON.stringify({ ok: true, sent }) };
};

function buildRenewalEmail(tierLabel, renewDate, appUrl) {
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
            <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 12px;">Renewing soon</h1>
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              Your <strong>${tierLabel} plan</strong> renews on <strong>${renewDate}</strong>. No action needed — we&apos;ll handle it automatically.
            </p>
            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <div style="font-size:11px;font-weight:700;color:#7a6d5e;letter-spacing:0.1em;margin-bottom:8px;">WHAT&rsquo;S INCLUDED</div>
              <table cellpadding="0" cellspacing="0">
                <tr><td style="font-size:13px;padding-right:10px;">&#x1F513;</td><td style="font-size:13px;color:#4a3f33;line-height:1.6;">Full access to every recipe</td></tr>
                <tr><td style="font-size:13px;padding-right:10px;">&#x1F4C5;</td><td style="font-size:13px;color:#4a3f33;line-height:1.6;">New drops every month</td></tr>
                <tr><td style="font-size:13px;padding-right:10px;">&#x1F6D2;</td><td style="font-size:13px;color:#4a3f33;line-height:1.6;">Auto-generated shopping list</td></tr>
                <tr><td style="font-size:13px;padding-right:10px;">&#x1F4CA;</td><td style="font-size:13px;color:#4a3f33;line-height:1.6;">Macro calculator + personalised targets</td></tr>
              </table>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                    Open SoulGainz &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="font-size:12px;color:#7a6d5e;line-height:1.6;margin:0;">
              To cancel before renewal, visit your account or reply to this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.7;">
              Cook once. Eat all week.<br>
              <a href="mailto:support@soulgainz.app" style="color:#E07B2A;text-decoration:none;">support@soulgainz.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
