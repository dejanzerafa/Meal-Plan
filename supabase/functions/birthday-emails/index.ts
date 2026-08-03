// supabase/functions/birthday-emails/index.ts
// Deno Edge Function — port of netlify/functions/birthday-emails.js
//
// Schedule via pg_cron (run in Supabase SQL Editor after deploying):
//
//   select cron.schedule(
//     'birthday-emails-daily',
//     '0 8 * * *',
//     $$ select net.http_post(
//         url:='https://rjreunvnsfjclpighogp.supabase.co/functions/v1/birthday-emails',
//         headers:='{"Content-Type":"application/json","Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb,
//         body:='{}'::jsonb
//     ) as request_id; $$
//   );
//
// Required Supabase secrets (set via `supabase secrets set`):
//   RESEND_API_KEY           — re_xxxx...
//   FROM_EMAIL               — SoulGainz <admin@soulgainz.app>
//   APP_URL                  — https://soulgainz.app
//   STRIPE_SECRET_KEY        — sk_live_xxxx... (optional — creates real Stripe promo codes)
//   STRIPE_BIRTHDAY_COUPON_ID — coupon ID from Stripe dashboard (optional)
//
// Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
// by the Supabase Edge Function runtime — no need to set them manually.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey   = Deno.env.get("RESEND_API_KEY");
  const stripeKey   = Deno.env.get("STRIPE_SECRET_KEY");
  const couponId    = Deno.env.get("STRIPE_BIRTHDAY_COUPON_ID");
  const fromEmail   = Deno.env.get("FROM_EMAIL")  ?? "SoulGainz <admin@soulgainz.app>";
  const appUrl      = Deno.env.get("APP_URL")     ?? "https://soulgainz.app";

  if (!resendKey) {
    console.log("Missing RESEND_API_KEY — skipping birthday run");
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Today's month and day (UTC)
  const now   = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day   = String(now.getUTCDate()).padStart(2, "0");
  const year  = now.getUTCFullYear();

  console.log(`Birthday check for ${month}-${day} (${year})`);

  try {
    // ── 1. Find users whose birthday is today ──────────────────────────────────
    const { data: allUsers, error: usersErr } = await supabase
      .from("users")
      .select("id,email,first_name,date_of_birth")
      .not("date_of_birth", "is", null)
      .eq("marketing_opt_in", true);

    if (usersErr) {
      console.error("Supabase users fetch error:", usersErr.message);
      return new Response(JSON.stringify({ error: usersErr.message }), { status: 500 });
    }

    // Filter to today's birthdays (month-day match)
    const todaysBirthdays = (allUsers ?? []).filter((u: any) => {
      const dob: string = u.date_of_birth ?? "";
      return dob.slice(5, 7) === month && dob.slice(8, 10) === day;
    });

    console.log(`Found ${todaysBirthdays.length} birthday(s) today`);

    if (todaysBirthdays.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    // ── 2. Process each birthday ───────────────────────────────────────────────
    const results: { sent: any[]; skipped: string[]; failed: any[] } = { sent: [], skipped: [], failed: [] };

    for (const user of todaysBirthdays) {
      try {
        // Check if already sent a code this year
        const { data: existing } = await supabase
          .from("birthday_codes")
          .select("promo_code")
          .eq("user_id", user.id)
          .eq("year", year);

        if (existing && existing.length > 0) {
          console.log(`Already sent birthday code to ${user.email} for ${year}`);
          results.skipped.push(user.email);
          continue;
        }

        // Generate unique promo code: BDAY-XXXXXX-YYYY
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const promoCode  = `BDAY-${randomPart}-${year}`;
        let stripePromoId: string | null = null;

        // Create Stripe promotional code (if configured)
        if (stripeKey && couponId) {
          try {
            const stripeRes = await fetch("https://api.stripe.com/v1/promotion_codes", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${stripeKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                coupon: couponId,
                code:   promoCode,
                "restrictions[first_time_transaction]": "false",
                "metadata[user_id]":  user.id,
                "metadata[year]":     String(year),
                "metadata[type]":     "birthday",
                expires_at: String(Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)),
              }).toString(),
            });
            if (stripeRes.ok) {
              const stripeData = await stripeRes.json();
              stripePromoId = stripeData.id;
              console.log("Stripe promo created:", promoCode);
            } else {
              const err = await stripeRes.text();
              console.warn("Stripe promo creation warning:", err, "— using code without Stripe link");
            }
          } catch (stripeErr: any) {
            console.warn("Stripe error (non-fatal):", stripeErr.message);
          }
        }

        // Store the code in Supabase
        await supabase.from("birthday_codes").insert({
          user_id:         user.id,
          year,
          promo_code:      promoCode,
          stripe_promo_id: stripePromoId,
        });

        // Send birthday email
        const firstName = user.first_name || user.email.split("@")[0] || "there";
        const emailRes  = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    fromEmail,
            to:      user.email,
            subject: `Happy Birthday ${firstName}! 🎂 Your 10% gift is inside`,
            html:    buildBirthdayEmail(firstName, promoCode, appUrl),
          }),
        });

        if (emailRes.ok) {
          console.log("Birthday email sent to", user.email, "— code:", promoCode);
          results.sent.push({ email: user.email, code: promoCode });
        } else {
          const err = await emailRes.text();
          console.error("Resend birthday error:", user.email, err);
          results.failed.push({ email: user.email, error: err });
        }

        // Small pause between sends
        await new Promise((r) => setTimeout(r, 300));

      } catch (userErr: any) {
        console.error("Error processing birthday for", user.email, userErr.message);
        results.failed.push({ email: user.email, error: userErr.message });
      }
    }

    return new Response(JSON.stringify({
      date:    `${month}-${day}-${year}`,
      sent:    results.sent.length,
      skipped: results.skipped.length,
      failed:  results.failed.length,
      details: results,
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("birthday-emails fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

// ── Birthday email HTML ────────────────────────────────────────────────────────
function buildBirthdayEmail(firstName: string, promoCode: string, appUrl: string): string {
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

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
          <td style="background:linear-gradient(135deg,#1a1612 0%,#2d1f0e 100%);padding:32px;text-align:center;">
            <div style="font-size:56px;margin-bottom:12px;">🎂</div>
            <h1 style="font-family:Georgia,serif;font-size:28px;color:#F2EDE6;margin:0 0 8px;">Happy Birthday, ${firstName}!</h1>
            <p style="font-size:14px;color:#8C8279;margin:0;letter-spacing:0.08em;">FROM THE SOULGAINZ KITCHEN TO YOU</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              Your birthday deserves a treat &mdash; and we don't mean the cheat meal 😄. We're giving you <strong style="color:#1a1612;">10% off</strong> any unlock or plan upgrade, just for today (and the next 30 days).
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#1a1612;border-radius:12px;padding:24px;text-align:center;">
                  <div style="font-size:11px;color:#8C8279;letter-spacing:0.14em;margin-bottom:10px;">YOUR BIRTHDAY DISCOUNT</div>
                  <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#E07B2A;letter-spacing:0.1em;">${promoCode}</div>
                  <div style="font-size:11px;color:#8C8279;margin-top:10px;">10% off &middot; expires ${expiryDate}</div>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">🔓</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Unlock a recipe</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Any single recipe unlock for just $1.61 instead of $1.99.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">♾️</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Go lifetime</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Lifetime access drops to $53.99 &mdash; every recipe, every future drop, forever.</div>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;letter-spacing:0.02em;">
                    Claim Your Birthday Gift &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:16px 18px;">
              <div style="font-size:12px;color:#4a3f33;line-height:1.7;">
                Enter code <strong style="color:#1a1612;">${promoCode}</strong> at checkout. Valid for 30 days. One use per account. Cannot be combined with other offers.
              </div>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.8;">
              Cook once. Eat all week. And have a brilliant birthday. 🎉<br>
              Questions? <a href="mailto:admin@soulgainz.app" style="color:#E07B2A;text-decoration:none;">admin@soulgainz.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
