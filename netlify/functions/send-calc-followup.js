// netlify/functions/send-calc-followup.js
// Sends macro results + app signup nudge to someone who used the free calculator.
// Called client-side immediately when the user enters their email on calculator.html.
//
// POST { email, kcal, protein, carbs, fat, goal }
//
// Required env vars: RESEND_API_KEY, FROM_EMAIL, APP_URL
// Optional env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY (enables 1-per-day dedup)
//
// Rate limiting: if Supabase env vars are set, a calc_email_sends table is used
// to enforce one follow-up email per email address per calendar day.
// SQL to create the table:
//   CREATE TABLE IF NOT EXISTS calc_email_sends (
//     id   bigint generated always as identity primary key,
//     email     text not null,
//     sent_date date not null default current_date,
//     created_at timestamptz default now(),
//     unique(email, sent_date)
//   );
//   CREATE INDEX IF NOT EXISTS idx_calc_email_sends_email ON calc_email_sends(email);

const { createClient } = require("@supabase/supabase-js");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "https://soulgainz.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age":       "86400",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
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

  const { email, goal } = payload;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  // Validate all numeric macro fields — reject anything that isn't a positive integer
  // (prevents HTML injection into email template and URL params)
  const safeInt = (v, max) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 && n <= max ? n : null; };
  const kcal    = safeInt(payload.kcal,    9999);
  const protein = safeInt(payload.protein, 999);
  const carbs   = payload.carbs !== undefined ? (parseInt(payload.carbs, 10) >= 0 ? parseInt(payload.carbs, 10) : null) : null;
  const fat     = safeInt(payload.fat,     999);
  const hasMacros = kcal && protein != null && carbs != null && fat != null;

  // Validate goal against allowlist to prevent injection
  const GOAL_ALLOWLIST = ["Lose Fat", "Maintain", "Gain Muscle", "Custom Goal"];
  const safeGoal = GOAL_ALLOWLIST.includes(goal) ? goal : null;

  // ── Supabase dedup: one email per address per calendar day ──────────────────
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const { error: dedupErr } = await supabase
        .from("calc_email_sends")
        .insert({ email: email.toLowerCase(), sent_date: today });
      if (dedupErr) {
        if (dedupErr.code === "23505") {
          // Unique constraint violation — already sent today, silently skip
          return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
        }
        // Other DB error: log but proceed (don't block the send)
        console.error("calc_email_sends insert error:", dedupErr.message);
      }
    } catch (dbErr) {
      console.error("Supabase dedup check failed:", dbErr.message);
      // Proceed anyway — dedup failure must not block a legitimate send
    }
  }

  const fromEmail = process.env.FROM_EMAIL || "SoulGainz <admin@soulgainz.app>";
  const appUrl   = process.env.APP_URL    || "https://soulgainz.app";

  // Build the macro passthrough URL using encodeURIComponent to prevent href injection
  const macroUrl = hasMacros
    ? `${appUrl}?setMacros=1&kcal=${encodeURIComponent(kcal)}&p=${encodeURIComponent(protein)}&c=${encodeURIComponent(carbs)}&f=${encodeURIComponent(fat)}&utm_source=calc_email&utm_medium=email&utm_content=followup`
    : `${appUrl}?utm_source=calc_email&utm_medium=email&utm_content=followup`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: "Your macro targets from SoulGainz",
        html: buildCalcFollowupEmail({ email, kcal, protein, carbs, fat, goal: safeGoal, macroUrl, appUrl }),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      return { statusCode: 500, body: JSON.stringify({ error: "Email send failed" }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error("send-calc-followup error:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

function buildCalcFollowupEmail({ email, kcal, protein, carbs, fat, goal, macroUrl, appUrl }) {
  const goalLabel = goal || "Your Goal";
  // Use != null (not truthy) so carbs=0 (keto) still shows the macro grid
  const hasMacros = kcal != null && protein != null && carbs != null && fat != null && kcal > 0;

  const macroBlock = hasMacros ? `
    <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:14px;padding:22px 24px;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;color:#E07B2A;letter-spacing:0.14em;margin-bottom:14px;">YOUR DAILY TARGETS · ${goalLabel.toUpperCase()}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;">
        <div>
          <div style="font-size:26px;font-weight:800;color:#1a1612;font-family:Georgia,serif;">${kcal.toLocaleString()}</div>
          <div style="font-size:11px;color:#7a6d5e;margin-top:2px;">Calories</div>
        </div>
        <div>
          <div style="font-size:26px;font-weight:800;color:#E07B2A;font-family:Georgia,serif;">${protein}g</div>
          <div style="font-size:11px;color:#7a6d5e;margin-top:2px;">Protein</div>
        </div>
        <div>
          <div style="font-size:26px;font-weight:800;color:#1a1612;font-family:Georgia,serif;">${carbs}g</div>
          <div style="font-size:11px;color:#7a6d5e;margin-top:2px;">Carbs</div>
        </div>
        <div>
          <div style="font-size:26px;font-weight:800;color:#1a1612;font-family:Georgia,serif;">${fat}g</div>
          <div style="font-size:11px;color:#7a6d5e;margin-top:2px;">Fat</div>
        </div>
      </div>
    </div>` : "";

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
            <div style="font-size:11px;color:#8C8279;letter-spacing:0.16em;margin-top:6px;">FEED YOUR SOUL &middot; FUEL YOUR GAINZ</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="font-family:Georgia,serif;font-size:24px;color:#1a1612;margin:0 0 12px;line-height:1.3;">Here are your macro targets</h1>
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              You calculated these on the SoulGainz free macro calculator. Keep them handy &mdash; these are the numbers your meals should hit every day.
            </p>

            ${macroBlock}

            <!-- What to do next -->
            <div style="margin-bottom:24px;">
              <div style="font-size:11px;font-weight:700;color:#7a6d5e;letter-spacing:0.1em;margin-bottom:12px;">WHAT TO DO NEXT</div>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:18px;padding-right:12px;vertical-align:top;padding-bottom:10px;">🎯</td>
                  <td style="font-size:14px;color:#4a3f33;line-height:1.6;padding-bottom:10px;"><strong style="color:#1a1612;">Load these into the app.</strong> SoulGainz auto-imports your targets so every recipe card shows you how it fits.</td>
                </tr>
                <tr>
                  <td style="font-size:18px;padding-right:12px;vertical-align:top;padding-bottom:10px;">🍳</td>
                  <td style="font-size:14px;color:#4a3f33;line-height:1.6;padding-bottom:10px;"><strong style="color:#1a1612;">Pick your meals for the week.</strong> 94+ high-protein recipes, each with verified macros, sorted by protein and prep time.</td>
                </tr>
                <tr>
                  <td style="font-size:18px;padding-right:12px;vertical-align:top;">🛒</td>
                  <td style="font-size:14px;color:#4a3f33;line-height:1.6;"><strong style="color:#1a1612;">Get your shopping list.</strong> Auto-generated, consolidated, and ready to screenshot before you head to the shops.</td>
                </tr>
              </table>
            </div>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <a href="${macroUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:15px 36px;border-radius:10px;letter-spacing:0.02em;">
                    Load my macros into the app &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:12px;color:#7a6d5e;line-height:1.6;margin:0;text-align:center;">
              Free to browse. No credit card needed to get started.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.7;">
              Cook once. Eat all week.<br>
              <a href="mailto:admin@soulgainz.app" style="color:#E07B2A;text-decoration:none;">admin@soulgainz.app</a>
              &nbsp;&middot;&nbsp;
              You&rsquo;re receiving this because you used our free macro calculator.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
