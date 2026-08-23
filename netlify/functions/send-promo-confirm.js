// netlify/functions/send-promo-confirm.js
// Sends a confirmation email when a promo code is successfully redeemed.
// Called client-side after redeem() succeeds.
//
// POST { email, tier, label, tierExpires }
//
// Required env vars: RESEND_API_KEY, FROM_EMAIL, APP_URL

const { rateLimit, clientIp } = require("./_shared/auth");

const TIER_LABELS = {
  annual:     "Annual Access",
  quarterly:  "Quarterly Access",
  monthly:    "Monthly Access",
  calculator: "Macro Calculator",
  seasonal:   "SoulFood Seasonal Bundle",
  single:     "Single Recipe",
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Abuse control: this endpoint sends an email to a CALLER-SUPPLIED address and
  // had no auth and no rate limit, so a loop against it bombs an arbitrary
  // inbox from our domain and burns the Resend quota.
  {
    const _rl = await rateLimit(`promoconf_${clientIp(event)}`, { max: 3, windowMs: 600000 });
    if (!_rl.ok) {
      return { statusCode: 429, headers: { "Retry-After": String(_rl.retryAfter || 600) },
               body: JSON.stringify({ error: "Too many requests. Please wait a few minutes." }) };
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email, tier, label, tierExpires } = payload;
  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const fromEmail = process.env.FROM_EMAIL || "SoulGainz <support@soulgainz.app>";
  const appUrl = process.env.APP_URL || "https://soulgainz.app";
  // Escaped + capped: `label` is caller-supplied and this endpoint is
  // unauthenticated, so it is interpolated into an email sent to an arbitrary
  // address. Prefer the known-tier label over anything the caller sends.
  const escHtml = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const tierLabel = escHtml(TIER_LABELS[tier] || label || "Access").slice(0, 60);
  const expiryText = tierExpires
    ? `Valid until ${new Date(tierExpires).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
    : "Permanent access — no expiry.";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: `Your promo code is live — ${tierLabel} unlocked`,
        html: buildPromoConfirmEmail(tierLabel, expiryText, appUrl),
      }),
    });
    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return { statusCode: 500, body: JSON.stringify({ error: "Email send failed" }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error("send-promo-confirm error:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

function buildPromoConfirmEmail(tierLabel, expiryText, appUrl) {
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
            <div style="text-align:center;font-size:32px;margin-bottom:16px;">&#x1F389;</div>
            <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 10px;text-align:center;">Promo code redeemed</h1>
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;text-align:center;">
              Your access is live. Here&apos;s what you&apos;ve unlocked:
            </p>
            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
              <div style="font-size:11px;font-weight:700;color:#E07B2A;letter-spacing:0.14em;margin-bottom:8px;">PROMO UNLOCK</div>
              <div style="font-size:20px;font-weight:700;color:#1a1612;margin-bottom:6px;">${tierLabel}</div>
              <div style="font-size:13px;color:#7a6d5e;">${expiryText}</div>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                    Open SoulGainz &rarr;
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
