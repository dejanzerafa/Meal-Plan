// netlify/functions/send-promo-code.js
// Sends a branded promo code email to a recipient.
// Called server-side from the admin panel after a code is created.
// POST { code, recipientEmail, label, expires, durationDays }
// Auth: Authorization: Bearer <supabase_access_token>
// Caller must be an admin (email in ADMIN_EMAILS env var).

exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://soulgainz.app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method not allowed" };
  }

  // ── Auth: verify Supabase JWT + admin email check ───────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
  const adminEmails = (process.env.ADMIN_EMAILS || "dejan.zerafa@icloud.com")
    .split(",").map(e => e.trim().toLowerCase());

  const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token || !supabaseUrl || !serviceKey) {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "Forbidden" }) };
  }

  let callerEmail = "";
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { "Authorization": `Bearer ${token}`, "apikey": serviceKey },
    });
    if (!userRes.ok) throw new Error("invalid token");
    const u = await userRes.json();
    callerEmail = (u.email || "").toLowerCase();
  } catch {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "Forbidden" }) };
  }

  if (!adminEmails.includes(callerEmail)) {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "Forbidden" }) };
  }

  // ── Resend key ───────────────────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Email not configured" }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { code, recipientEmail, label, expires, durationDays } = payload;

  if (!code || !recipientEmail || !recipientEmail.includes("@")) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "code and recipientEmail are required" }) };
  }

  // ── Build expiry display ────────────────────────────────────────────────────
  let expiryLine = "";
  if (durationDays) {
    expiryLine = `<p style="margin:0 0 8px;font-size:14px;color:#6B6560;">Your access activates for <strong style="color:#F2EDE6;">${durationDays} days</strong> from the moment you redeem.</p>`;
  }
  let validUntilLine = "";
  if (expires) {
    const d = new Date(expires);
    const formatted = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    validUntilLine = `<p style="margin:0 0 8px;font-size:14px;color:#6B6560;">Code valid until: <strong style="color:#F2EDE6;">${formatted}</strong></p>`;
  }

  const subject = label
    ? `Your SoulGainz access code — ${label}`
    : "Your SoulGainz access code";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0C0B0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C0B0A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#141312;border:1px solid #252220;border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#0C0B0A;padding:32px 32px 24px;text-align:center;border-bottom:1px solid #252220;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:900;letter-spacing:4px;color:#6B6560;">SOUL<span style="color:#E07B2A;">GAINZ</span></p>
            <p style="margin:0;font-size:11px;color:#6B6560;letter-spacing:1px;">COOK ONCE. EAT ALL WEEK.</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:22px;font-weight:900;color:#F2EDE6;line-height:1.2;">
              Here's your access code 🎟️
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#6B6560;line-height:1.6;">
              ${label ? `You've been given access to SoulGainz — <strong style="color:#F2EDE6;">${label}</strong>. Use the code below to unlock your access inside the app.` : "You've been given access to SoulGainz. Use the code below to unlock your access inside the app."}
            </p>

            <!-- Code block -->
            <div style="background:#0C0B0A;border:2px solid #E07B2A;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:3px;color:#6B6560;">YOUR CODE</p>
              <p style="margin:0;font-size:32px;font-weight:900;letter-spacing:8px;color:#E07B2A;font-family:monospace;">${code}</p>
            </div>

            ${expiryLine}
            ${validUntilLine}

            <!-- Steps -->
            <p style="margin:24px 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;color:#6B6560;">HOW TO REDEEM</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;vertical-align:top;">
                  <span style="display:inline-block;width:24px;height:24px;background:#E07B2A;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:900;color:#0C0B0A;margin-right:12px;">1</span>
                  <span style="font-size:14px;color:#F2EDE6;">Open the app at <a href="https://soulgainz.app" style="color:#E07B2A;">soulgainz.app</a></span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;vertical-align:top;">
                  <span style="display:inline-block;width:24px;height:24px;background:#E07B2A;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:900;color:#0C0B0A;margin-right:12px;">2</span>
                  <span style="font-size:14px;color:#F2EDE6;">Sign in with this email address</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;vertical-align:top;">
                  <span style="display:inline-block;width:24px;height:24px;background:#E07B2A;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:900;color:#0C0B0A;margin-right:12px;">3</span>
                  <span style="font-size:14px;color:#F2EDE6;">Tap the <strong>ME</strong> tab → scroll to <strong>"Have a Promo Code?"</strong> → enter the code above → tap <strong>Redeem</strong></span>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <div style="text-align:center;margin-top:32px;">
              <a href="https://soulgainz.app" style="display:inline-block;background:#E07B2A;color:#0C0B0A;font-size:13px;font-weight:900;letter-spacing:2px;padding:14px 32px;border-radius:8px;text-decoration:none;">OPEN THE APP →</a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #252220;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#6B6560;">Questions? Reply to this email or reach us at</p>
            <p style="margin:0;font-size:12px;color:#6B6560;"><a href="mailto:support@soulgainz.app" style="color:#E07B2A;text-decoration:none;">support@soulgainz.app</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // ── Send via Resend ─────────────────────────────────────────────────────────
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SoulGainz <noreply@soulgainz.app>",
      to: [recipientEmail],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("send-promo-code: Resend error", err);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Failed to send email" }) };
  }

  console.log(`send-promo-code: sent code ${code} to ${recipientEmail} (admin: ${callerEmail})`);
  return {
    statusCode: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
