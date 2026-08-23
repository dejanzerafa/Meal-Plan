// netlify/functions/send-feedback.js
// Receives in-app feedback, stores it in Supabase, and emails a digest
// to support@soulgainz.app via Resend.
//
// POST body:
//   { message, category, email?, tier?, device?, tab? }
//
// Required env vars:
//   SUPABASE_URL         — https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY — service_role key
//   RESEND_API_KEY       — re_xxxx...
//   FROM_EMAIL           — SoulGainz <support@soulgainz.app>

// ── Allowed origins ───────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
  "https://soulgainz.netlify.app",
  "http://localhost",
  "http://127.0.0.1",
];

// ── Valid categories ──────────────────────────────────────────────────────────
// Keep in sync with the `cats` array in FeedbackModal (index.html).
// The category is used as the email subject prefix — "[Billing] App Feedback" —
// so these map directly onto the Gmail labels used to triage support.
const VALID_CATEGORIES = ["Bug", "Feature", "Recipe", "Content", "Billing", "Other"];

// ── IP rate limit: max 3 feedbacks per IP per 10 minutes ─────────────────────
const _ipRateMap = new Map();
function _checkRateLimit(ip) {
  if (!ip) return true;
  const now = Date.now();
  const entry = _ipRateMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 600000) {
    _ipRateMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  _ipRateMap.set(ip, entry);
  return true;
}

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

  const headers = { "Content-Type": "application/json" };

  // ── Payload size guard ───────────────────────────────────────────────────
  if (event.body && event.body.length > 4096) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Payload too large" }) };
  }

  // ── Origin check ─────────────────────────────────────────────────────────
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Forbidden" }) };
  }

  // ── IP rate limit ─────────────────────────────────────────────────────────
  const clientIp = (event.headers && (
    // x-nf-client-connection-ip is set by Netlify's edge and cannot be spoofed.
    // x-forwarded-for is caller-supplied and Netlify APPENDS to it, so taking
    // [0] took the attacker's own value — rotating it defeated the limit
    // entirely. Fall back to the LAST hop, never the first.
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["client-ip"] ||
    (event.headers["x-forwarded-for"] || "").split(",").pop()
  ) || "").trim();
  if (!_checkRateLimit(clientIp)) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: "Too many submissions. Please wait a few minutes." }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { message, category, email, tier, device, tab } = payload;

  // ── Validate required fields ──────────────────────────────────────────────
  if (!message || typeof message !== "string" || message.trim().length < 3) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Message required" }) };
  }
  if (message.trim().length > 2000) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Message too long (max 2000 chars)" }) };
  }

  const safeCategory = VALID_CATEGORIES.includes(category) ? category : "Other";
  const safeEmail    = typeof email === "string" && email.includes("@") ? email.slice(0, 254).toLowerCase().trim() : null;
  const safeTier     = typeof tier   === "string" ? tier.slice(0, 32)   : "free";
  const safeDevice   = typeof device === "string" ? device.slice(0, 64) : "unknown";
  const safeTab      = typeof tab    === "string" ? tab.slice(0, 32)    : "unknown";
  const safeMessage  = message.trim().slice(0, 2000);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey   = process.env.RESEND_API_KEY;
  const fromEmail   = process.env.FROM_EMAIL || "SoulGainz <support@soulgainz.app>";

  // ── 1. Store in Supabase ──────────────────────────────────────────────────
  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          category: safeCategory,
          message: safeMessage,
          email: safeEmail,
          tier: safeTier,
          device: safeDevice,
          tab: safeTab,
          created_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("send-feedback: Supabase insert failed:", e.message);
    }
  }

  // ── 2. Email admin via Resend ─────────────────────────────────────────────
  if (resendKey) {
    const tierBadge = safeTier !== "free" ? `<span style="background:#b84a1f;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;">${safeTier}</span>` : `<span style="background:#444;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">free</span>`;
    const replyTo = safeEmail || "no-reply@soulgainz.app";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3ece0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ebe2d3;border-radius:16px;overflow:hidden;border:1px solid #c9bda9;">
    <div style="background:#1a1209;padding:20px 28px;display:flex;align-items:center;gap:10px;">
      <span style="color:#E07B2A;font-size:20px;font-weight:900;letter-spacing:0.08em;">SOUL</span><span style="color:#f3ece0;font-size:20px;font-weight:900;letter-spacing:0.08em;">GAINZ</span>
      <span style="margin-left:auto;color:#a89880;font-size:12px;">New Feedback</span>
    </div>
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#7a6d5e;width:80px;">CATEGORY</td>
          <td style="padding:6px 0;font-size:13px;font-weight:700;color:#1a1209;">${safeCategory}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#7a6d5e;">PLAN</td>
          <td style="padding:6px 0;">${tierBadge}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#7a6d5e;">TAB</td>
          <td style="padding:6px 0;font-size:13px;color:#1a1209;">${safeTab}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#7a6d5e;">DEVICE</td>
          <td style="padding:6px 0;font-size:13px;color:#1a1209;">${safeDevice}</td>
        </tr>
        ${safeEmail ? `<tr>
          <td style="padding:6px 0;font-size:12px;color:#7a6d5e;">EMAIL</td>
          <td style="padding:6px 0;font-size:13px;color:#1a1209;"><a href="mailto:${safeEmail}" style="color:#b84a1f;">${safeEmail}</a></td>
        </tr>` : ""}
      </table>
      <div style="background:#fff8f0;border-left:3px solid #E07B2A;padding:14px 16px;border-radius:0 8px 8px 0;font-size:14px;line-height:1.7;color:#1a1209;white-space:pre-wrap;">${safeMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>
    <div style="padding:12px 28px 20px;font-size:11px;color:#a89880;text-align:center;">
      Sent from the SoulGainz app · ${new Date().toUTCString()}
    </div>
  </div>
</body>
</html>`;

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: ["support@soulgainz.app"],
          reply_to: replyTo,
          subject: `[${safeCategory}] App Feedback${safeEmail ? ` from ${safeEmail}` : ""}`,
          html,
        }),
      });
    } catch (e) {
      console.error("send-feedback: Resend failed:", e.message);
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true }),
  };
};
