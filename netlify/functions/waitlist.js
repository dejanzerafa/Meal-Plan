// netlify/functions/waitlist.js
// Captures waitlist signups → inserts into Supabase waitlist table
// → sends a confirmation email via Resend (optional)
//
// ── Required env vars ────────────────────────────────────────────────────────
//   SUPABASE_URL            — https://xxx.supabase.co
//   SUPABASE_SERVICE_KEY    — service_role key (never expose client-side)
//   RESEND_API_KEY          — re_... (optional; skipped if missing)
//   FROM_EMAIL              — e.g. SoulGainz <support@soulgainz.app>
//   APP_URL                 — e.g. https://soulgainz.app

// Exact matching (correctly) replaced startsWith, but browsers send
// "http://localhost:8888" WITH the port, which no exact list can contain.
// Allow loopback separately, and only outside production.
const _isLocalOrigin = o => process.env.CONTEXT !== "production" &&
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || "");

const { rateLimit, clientIp, escHtml } = require("./_shared/auth");

const { createClient } = require("@supabase/supabase-js");

const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
];

const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

exports.handler = async (event) => {
  const origin = event.headers.origin || "";

  // ── Preflight ──────────────────────────────────────────────────────────────
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(origin), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Abuse control: this endpoint sends an email to a CALLER-SUPPLIED address and
  // had no auth and no rate limit at all, so a loop against it bombs an
  // arbitrary inbox from our domain and drains the Resend quota.
  {
    const _rl = await rateLimit(`waitlist_${clientIp(event)}`, { max: 5, windowMs: 600000 });
    if (!_rl.ok) {
      return {
        statusCode: 429,
        headers: { ...corsHeaders(origin), "Retry-After": String(_rl.retryAfter || 600) },
        body: JSON.stringify({ error: "Too many requests. Please wait a few minutes." }),
      };
    }
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const email = (body.email || "").trim().toLowerCase();
  const name  = (body.name  || "").trim().slice(0, 100);
  const source = (body.source || "waitlist_page").slice(0, 50);

  // ── Validate email ─────────────────────────────────────────────────────────
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      statusCode: 400,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: "A valid email address is required." }),
    };
  }

  // ── Supabase ───────────────────────────────────────────────────────────────
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error: dbError } = await supabase
    .from("waitlist")
    .upsert(
      { email, name: name || null, source, joined_at: new Date().toISOString() },
      { onConflict: "email", ignoreDuplicates: false }
    );

  if (dbError) {
    console.error("Waitlist insert error:", dbError);
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: "Could not save your signup. Please try again." }),
    };
  }

  // ── Confirmation email (optional) ──────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || "SoulGainz <support@soulgainz.app>";
  const appUrl    = process.env.APP_URL || "https://soulgainz.app";

  if (resendKey) {
    // Escaped: this endpoint is unauthenticated and emails a caller-supplied
    // address, so an unescaped name is an HTML-injection / phishing relay.
    const greeting = name ? `Hey ${escHtml(name.split(" ")[0])},` : "Hey,";
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0C0B0A;color:#F2EDE6;font-family:sans-serif;margin:0;padding:40px 24px;">
  <div style="max-width:480px;margin:0 auto;">
    <p style="font-size:28px;font-weight:900;letter-spacing:-1px;margin:0 0 8px;">
      SOUL<span style="color:#E07B2A;">GAINZ</span>
    </p>
    <hr style="border:none;border-top:1px solid #2a2a2a;margin:16px 0 32px;">
    <p style="font-size:16px;line-height:1.6;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;">
      You're on the list. We'll hit you up the moment SoulGainz drops.
    </p>
    <p style="font-size:16px;line-height:1.6;">
      In the meantime — follow us on Instagram for behind-the-scenes and launch updates:
    </p>
    <a href="https://instagram.com/soulgainz.app"
       style="display:inline-block;margin:16px 0;padding:14px 28px;background:#E07B2A;color:#0C0B0A;font-weight:900;font-size:14px;text-decoration:none;letter-spacing:1px;border-radius:4px;">
      @SOULGAINZ.APP
    </a>
    <p style="font-size:14px;color:#888;margin-top:40px;">
      Feed your soul. Fuel your gainz. 🔥
    </p>
    <p style="font-size:12px;color:#555;margin-top:8px;">
      You're receiving this because you signed up at <a href="${appUrl}" style="color:#E07B2A;">${appUrl}</a>.<br>
      No spam. Ever.
    </p>
  </div>
</body>
</html>`;

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: "You're on the SoulGainz waitlist 🔥",
          html,
        }),
      });
    } catch (emailErr) {
      // Non-fatal — signup is saved, just log the email failure
      console.error("Confirmation email error:", emailErr);
    }
  }

  return {
    statusCode: 200,
    headers: corsHeaders(origin),
    body: JSON.stringify({ success: true, message: "You're on the list!" }),
  };
};
