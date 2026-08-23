// netlify/functions/admin-friend-code.js
// Generates a 100% off Stripe promo code for a friend and optionally emails it to them.
// Protected by ADMIN_SECRET — never expose this URL publicly.
//
// Usage:
//   curl -X POST https://soulgainz.app/.netlify/functions/admin-friend-code \
//     -H "Content-Type: application/json" \
//     -d '{
//           "secret":  "YOUR_ADMIN_SECRET",
//           "name":    "Ahmed",
//           "email":   "ahmed@example.com",
//           "send_email": true
//         }'
//
// Optional params:
//   "send_email": false   — generate code only, don't email the friend
//   "note": "Enjoy!"     — personal note added to the email
//   "expires_days": 30   — how many days until the code expires (default: 90)
//
// Required env vars:
//   ADMIN_SECRET              — your private passphrase
//   STRIPE_SECRET_KEY         — sk_live_xxxx...
//   STRIPE_FRIENDS_COUPON_ID  — 100% off coupon ID created in Stripe Dashboard
//   RESEND_API_KEY            — re_xxxx...
//   FROM_EMAIL                — SoulGainz <support@soulgainz.app>
//   APP_URL                   — https://soulgainz.app
//
// One-time Stripe setup:
//   Dashboard → Coupons → Create coupon → 100% off → name "Friends & Family"
//   Copy the coupon ID into STRIPE_FRIENDS_COUPON_ID env var.

const { secretsMatch } = require("./_shared/auth");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://soulgainz.app",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || !secretsMatch(payload.secret, adminSecret)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const stripeKey  = process.env.STRIPE_SECRET_KEY;
  const couponId   = process.env.STRIPE_FRIENDS_COUPON_ID;
  const resendKey  = process.env.RESEND_API_KEY;
  const fromEmail  = process.env.FROM_EMAIL || "SoulGainz <support@soulgainz.app>";
  const appUrl     = process.env.APP_URL    || "https://soulgainz.app";

  if (!stripeKey || !couponId) {
    return { statusCode: 500, body: JSON.stringify({ error: "STRIPE_SECRET_KEY or STRIPE_FRIENDS_COUPON_ID not set" }) };
  }

  const friendName    = payload.name  || "Friend";
  const friendEmail   = payload.email || null;
  const sendEmail     = payload.send_email !== false && !!friendEmail && !!resendKey;
  const personalNote  = payload.note  || null;
  const expiresDays   = parseInt(payload.expires_days || "90", 10);
  const expiresAt     = Math.floor((Date.now() + expiresDays * 24 * 60 * 60 * 1000) / 1000);

  // ── Generate a readable promo code ───────────────────────────────────────
  // Format: FRIEND-NAME-XXXX  e.g. FRIEND-AHMED-K4R2
  const namePart   = friendName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const promoCode  = `FRIEND-${namePart}-${randomPart}`;

  try {
    // ── Create Stripe promotional code ───────────────────────────────────────
    const stripeBody = new URLSearchParams({
      coupon:       couponId,
      code:         promoCode,
      max_redemptions: "1",           // single use
      expires_at:   String(expiresAt),
      "metadata[type]":        "friend",
      "metadata[friend_name]": friendName,
    });

    if (friendEmail) {
      stripeBody.set("restrictions[first_time_transaction]", "false");
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/promotion_codes", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeBody.toString(),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.text();
      console.error("Stripe error:", err);
      return { statusCode: 500, body: JSON.stringify({ error: "Stripe failed", detail: err }) };
    }

    const stripeData = await stripeRes.json();
    console.log("Friend code created:", promoCode, "→ Stripe ID:", stripeData.id);

    const expiryLabel = new Date(expiresAt * 1000).toLocaleDateString("en-AU", {
      day: "numeric", month: "long", year: "numeric",
    });

    // ── Send email to friend (optional) ──────────────────────────────────────
    let emailSent = false;
    if (sendEmail) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    fromEmail,
          to:      friendEmail,
          // NOT "lifetime access" — this code is 100% off, single use, and it
          // expires. Terms 6.4 states no lifetime access is sold, and the email
          // body itself says "expires ${expiryDate}", so the old subject line
          // contradicted both the Terms and the message it was attached to.
          subject: `${friendName}, you've got free access to SoulGainz 🎁`,
          html:    buildFriendEmail(friendName, promoCode, appUrl, expiryLabel, personalNote),
        }),
      });

      if (emailRes.ok) {
        console.log("Friend invite email sent to", friendEmail);
        emailSent = true;
      } else {
        const err = await emailRes.text();
        console.error("Resend error:", err);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok:          true,
        promo_code:  promoCode,
        stripe_id:   stripeData.id,
        friend:      friendName,
        email:       friendEmail || null,
        email_sent:  emailSent,
        expires:     expiryLabel,
        discount:    "100% off — single use",
      }),
    };

  } catch (err) {
    console.error("admin-friend-code error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ── Friend invite email HTML ──────────────────────────────────────────────────
function buildFriendEmail(name, promoCode, appUrl, expiryDate, personalNote) {
  const firstName = name.split(" ")[0];
  const noteBlock = personalNote
    ? `<div style="background:#fff8f2;border-left:3px solid #E07B2A;padding:14px 18px;margin-bottom:24px;border-radius:0 8px 8px 0;">
        <div style="font-size:13px;color:#4a3f33;line-height:1.7;font-style:italic;">"${personalNote}"</div>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0e9de;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0e9de;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#faf6f0;border-radius:16px;overflow:hidden;border:1px solid #ddd3c3;">

        <!-- Header -->
        <tr>
          <td style="background:#0C0B0A;padding:32px 32px 24px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.06em;">
              <span style="color:#E07B2A;">SOUL</span><span style="color:#F2EDE6;">GAINZ</span>
            </div>
            <div style="font-size:11px;color:#8C8279;letter-spacing:0.16em;margin-top:6px;">FEED YOUR SOUL · FUEL YOUR GAINZ</div>
          </td>
        </tr>

        <!-- Gift hero -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1612 0%,#2d1f0e 100%);padding:32px;text-align:center;">
            <div style="font-size:52px;margin-bottom:12px;">🎁</div>
            <h1 style="font-family:Georgia,serif;font-size:26px;color:#F2EDE6;margin:0 0 8px;">${firstName}, you're in.</h1>
            <p style="font-size:12px;color:#8C8279;margin:0;letter-spacing:0.1em;text-transform:uppercase;">You've been gifted full access to SoulGainz</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 20px;">
              Hey ${firstName} 👋 — someone thinks you deserve to eat well. They've gifted you <strong style="color:#1a1612;">100% free access</strong> to SoulGainz. No catch. No credit card needed.
            </p>

            ${noteBlock}

            <!-- Code block -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#1a1612;border-radius:12px;padding:24px;text-align:center;">
                  <div style="font-size:11px;color:#8C8279;letter-spacing:0.14em;margin-bottom:10px;">YOUR ACCESS CODE</div>
                  <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#E07B2A;letter-spacing:0.1em;">${promoCode}</div>
                  <div style="font-size:11px;color:#8C8279;margin-top:10px;">100% off · single use · expires ${expiryDate}</div>
                </td>
              </tr>
            </table>

            <!-- What they get -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">🍽️</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Every recipe unlocked</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Full access to every recipe in the library — and every future drop.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">🛒</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Auto grocery lists</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Pick your recipes, hit Shop — your full ingredient list is built in one tap.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">📅</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Meal prep calendar</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Log your batch cook day. The app tracks your next shop and prep sessions.</div>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;letter-spacing:0.02em;">
                    Claim Your Free Access →
                  </a>
                </td>
              </tr>
            </table>

            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:16px 18px;">
              <div style="font-size:12px;color:#4a3f33;line-height:1.7;">
                Enter <strong style="color:#1a1612;">${promoCode}</strong> at checkout to apply 100% off. Single use. Expires ${expiryDate}. If you have any trouble, just reply to this email.
              </div>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.8;">
              Cook once. Eat all week.<br>
              Questions? <a href="mailto:support@soulgainz.app" style="color:#E07B2A;text-decoration:none;">support@soulgainz.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
