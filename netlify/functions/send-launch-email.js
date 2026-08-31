// netlify/functions/send-launch-email.js
// One-shot function: blasts the launch announcement to every waitlist subscriber.
//
// ── How to trigger ───────────────────────────────────────────────────────────
//   POST /.netlify/functions/send-launch-email
//   Body: { "secret": "<LAUNCH_SECRET>" }
//   The LAUNCH_SECRET env var prevents accidental/unauthorised triggering.
//
// ── Required env vars ────────────────────────────────────────────────────────
//   SUPABASE_URL            — https://xxx.supabase.co
//   SUPABASE_SERVICE_KEY    — service_role key
//   RESEND_API_KEY          — re_...
//   FROM_EMAIL              — SoulGainz <support@soulgainz.app>
//   APP_URL                 — https://soulgainz.app
//   LAUNCH_SECRET           — any strong random string (e.g. openssl rand -hex 32)
//
// ── Resend batch limit ───────────────────────────────────────────────────────
//   Resend's batch API sends up to 100 emails per call.
//   This function handles pagination automatically for larger lists.

const { clientIp, rateLimit, secretsMatch } = require("./_shared/auth");
const { createClient } = require("@supabase/supabase-js");

const BATCH_SIZE = 100; // Resend batch limit

exports.handler = async (event) => {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  // Mails the entire waitlist on success.
  {
    const _rl = await rateLimit(`launchmail:${clientIp(event)}`, { max: 3, windowMs: 3600000 });
    if (!_rl.ok) {
      return { statusCode: 429, headers: (typeof corsHeaders !== "undefined" ? corsHeaders : {}),
               body: JSON.stringify({ error: "Too many requests. Please try again shortly." }) };
    }
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // ── Auth check ─────────────────────────────────────────────────────────────
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { body = {}; }

  const secret = process.env.LAUNCH_SECRET;
  if (!secret || !secretsMatch(body.secret, secret)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  // ── Env checks ─────────────────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "SoulGainz <support@soulgainz.app>";
  const appUrl    = process.env.APP_URL     || "https://soulgainz.app";

  if (!resendKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "RESEND_API_KEY not set" }) };
  }

  // ── Fetch all waitlist emails from Supabase ─────────────────────────────────
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: subscribers, error: dbErr } = await supabase
    .from("waitlist")
    .select("email, name")
    .order("joined_at", { ascending: true });

  if (dbErr) {
    console.error("DB error fetching waitlist:", dbErr);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not fetch waitlist" }) };
  }

  if (!subscribers || subscribers.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ sent: 0, message: "No subscribers found" }) };
  }

  console.log(`Sending launch email to ${subscribers.length} subscribers…`);

  // ── Build email HTML ────────────────────────────────────────────────────────
  const buildHtml = (name) => {
    const greeting = name ? `Hey ${name.split(" ")[0]},` : "Hey,";
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>SoulGainz is live 🔥</title>
</head>
<body style="margin:0;padding:0;background:#0C0B0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0C0B0A;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

        <!-- Wordmark -->
        <tr>
          <td style="padding-bottom:32px;">
            <span style="font-size:18px;font-weight:900;letter-spacing:3px;color:#F2EDE6;text-transform:uppercase;">
              SOUL<span style="color:#E07B2A;">GAINZ</span>
            </span>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="padding-bottom:8px;">
            <p style="margin:0;font-size:42px;font-weight:900;line-height:1;letter-spacing:-1.5px;color:#F2EDE6;text-transform:uppercase;">
              IT'S<br><span style="color:#E07B2A;">LIVE.</span>
            </p>
          </td>
        </tr>

        <!-- Subhead -->
        <tr>
          <td style="padding:24px 0 32px;">
            <p style="margin:0;font-size:16px;line-height:1.65;color:#6B6560;">
              ${greeting}<br><br>
              You've been on the list since day one. SoulGainz is now live — your spot is waiting.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding-bottom:40px;">
            <a href="${appUrl}"
               style="display:inline-block;padding:16px 36px;background:#E07B2A;color:#0C0B0A;font-weight:900;font-size:14px;letter-spacing:2px;text-decoration:none;text-transform:uppercase;border-radius:4px;">
              OPEN THE APP →
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="border-top:1px solid #252220;padding-bottom:32px;"></td>
        </tr>

        <!-- What's inside -->
        <tr>
          <td style="padding-bottom:8px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6B6560;">
              What's inside
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="50%" style="padding:16px 8px 0 0;vertical-align:top;">
                  <table style="background:#141312;border:1px solid #252220;border-radius:8px;width:100%;" cellpadding="16" cellspacing="0">
                    <tr><td>
                      <p style="margin:0 0 6px;font-size:20px;">🍱</p>
                      <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#F2EDE6;">173 Recipes</p>
                      <p style="margin:0;font-size:12px;color:#6B6560;line-height:1.5;">High-protein. Verified macros — not estimates.</p>
                    </td></tr>
                  </table>
                </td>
                <td width="50%" style="padding:16px 0 0 8px;vertical-align:top;">
                  <table style="background:#141312;border:1px solid #252220;border-radius:8px;width:100%;" cellpadding="16" cellspacing="0">
                    <tr><td>
                      <p style="margin:0 0 6px;font-size:20px;">🛒</p>
                      <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#F2EDE6;">Grocery List</p>
                      <p style="margin:0;font-size:12px;color:#6B6560;line-height:1.5;">One auto-generated list from your weekly picks.</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:12px 8px 0 0;vertical-align:top;">
                  <table style="background:#141312;border:1px solid #252220;border-radius:8px;width:100%;" cellpadding="16" cellspacing="0">
                    <tr><td>
                      <p style="margin:0 0 6px;font-size:20px;">📅</p>
                      <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#F2EDE6;">Weekly Planner</p>
                      <p style="margin:0;font-size:12px;color:#6B6560;line-height:1.5;">Plan meals. Know exactly what you're eating all week.</p>
                    </td></tr>
                  </table>
                </td>
                <td width="50%" style="padding:12px 0 0 8px;vertical-align:top;">
                  <table style="background:#141312;border:1px solid #252220;border-radius:8px;width:100%;" cellpadding="16" cellspacing="0">
                    <tr><td>
                      <p style="margin:0 0 6px;font-size:20px;">📊</p>
                      <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#F2EDE6;">Macro Calc</p>
                      <p style="margin:0;font-size:12px;color:#6B6560;line-height:1.5;">Your targets, personalised to your body and goals.</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Second CTA -->
        <tr>
          <td style="padding:8px 0 40px;">
            <a href="${appUrl}"
               style="display:inline-block;padding:16px 36px;background:#E07B2A;color:#0C0B0A;font-weight:900;font-size:14px;letter-spacing:2px;text-decoration:none;text-transform:uppercase;border-radius:4px;">
              START YOUR FIRST PREP →
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="border-top:1px solid #252220;padding-bottom:24px;"></td>
        </tr>

        <!-- Sign off -->
        <tr>
          <td>
            <p style="margin:0 0 8px;font-size:15px;color:#F2EDE6;line-height:1.6;">
              Feed your soul. Fuel your gainz. 🔥
            </p>
            <p style="margin:0;font-size:13px;color:#6B6560;">
              — The SoulGainz team
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:40px;">
            <p style="margin:0;font-size:11px;color:#3a3836;line-height:1.6;">
              You're receiving this because you joined the SoulGainz waitlist at
              <a href="${appUrl}" style="color:#3a3836;">${appUrl}</a>.
              No more waitlist emails — this is it.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  };

  // ── Send in batches of 100 ─────────────────────────────────────────────────
  let totalSent = 0;
  let totalFailed = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    const emails = batch.map(({ email, name }) => ({
      from: fromEmail,
      to: email,
      subject: "SoulGainz is live 🔥 — your spot is waiting",
      html: buildHtml(name),
    }));

    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emails),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, result);
        totalFailed += batch.length;
      } else {
        console.log(`Batch ${i / BATCH_SIZE + 1}: sent ${batch.length} emails`);
        totalSent += batch.length;
      }
    } catch (err) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, err);
      totalFailed += batch.length;
    }

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < subscribers.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      total: subscribers.length,
      sent: totalSent,
      failed: totalFailed,
      message: `Launch emails sent: ${totalSent}/${subscribers.length}`,
    }),
  };
};
