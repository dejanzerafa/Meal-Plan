// netlify/functions/birthday-emails.js
// Scheduled daily at 08:00 UTC \u2014 finds members whose birthday is today,
// issues a unique 10% Stripe promotional code, stores it, and sends a
// branded birthday email.
//
// Required env vars:
//   SUPABASE_URL         \u2014 https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY \u2014 service_role key
//   RESEND_API_KEY       \u2014 re_xxxx...
//   STRIPE_SECRET_KEY    \u2014 sk_live_xxxx... (for creating promo codes)
//   FROM_EMAIL           \u2014 SoulGainz <support@soulgainz.app>
//   APP_URL              \u2014 https://soulgainz.app
//
// Stripe setup (one-time in Stripe Dashboard):
//   1. Promotions \u2192 Coupons \u2192 Create coupon: 10% off, name "BIRTHDAY10BASE"
//   2. Copy the coupon ID into STRIPE_BIRTHDAY_COUPON_ID env var
//   (The function creates a unique promotional code on top of that coupon)

const { secretsMatch } = require("./_shared/auth");
exports.handler = async (event) => {
  // ── Auth gate ───────────────────────────────────────────────────────────────
  // Runs on a schedule, but the endpoint is ALSO reachable over plain
  // HTTP. Ungated, anyone could invoke it repeatedly to mail-bomb the entire user
  // base from support@soulgainz.app — and birthday-emails additionally mints live
  // Stripe promotion codes. EVERY caller must present ADMIN_SECRET or CRON_SECRET.
  //
  // The previous version accepted an x-nf-event-trigger header as proof of being
  // the scheduler. That header arrives on the inbound request — anyone could send
  // it and skip the secret check entirely. It was not a gate.
  {
    const _h = event && event.headers ? event.headers : {};
    {
      const adminSecret = process.env.ADMIN_SECRET;
      let provided = null;
      try {
        const auth = _h.authorization || _h.Authorization || "";
        provided = auth.startsWith("Bearer ") ? auth.slice(7)
                 : (event && event.body ? (JSON.parse(event.body).secret || null) : null);
      } catch (_) {}
      // Accept EITHER secret. Netlify's scheduler cannot present one, so if the
      // netlify.toml schedules are live on a paid plan they will now 401 — the
      // Supabase pg_cron path (which DOES send CRON_SECRET as a Bearer token) is
      // the intended invoker. Failing closed is correct here: these functions mail
      // the entire user base and mint live Stripe promotion codes.
      const cronSecret = process.env.CRON_SECRET;
      const okAdmin = adminSecret && secretsMatch(provided, adminSecret);
      const okCron  = cronSecret  && secretsMatch(provided, cronSecret);
      if (!okAdmin && !okCron) {
        return { statusCode: 401, body: JSON.stringify({ error: "unauthorized" }) };
      }
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey   = process.env.RESEND_API_KEY;
  const stripeKey   = process.env.STRIPE_SECRET_KEY;
  const couponId    = process.env.STRIPE_BIRTHDAY_COUPON_ID; // base coupon in Stripe
  const fromEmail   = process.env.FROM_EMAIL || "SoulGainz <support@soulgainz.app>";
  const appUrl      = process.env.APP_URL    || "https://soulgainz.app";

  if (!supabaseUrl || !supabaseKey || !resendKey) {
    console.log("Missing required env vars \u2014 skipping birthday run");
    return { statusCode: 200, body: JSON.stringify({ skipped: true }) };
  }

  // Today's month and day (UTC)
  const now   = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day   = String(now.getUTCDate()).padStart(2, "0");
  const year  = now.getUTCFullYear();

  console.log(`Birthday check for ${month}-${day} (${year})`);

  try {
    // \u2500\u2500 1. Find users whose birthday is today \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    // date_of_birth is stored as DATE; we match on month + day only.
    // users.date_of_birth is written by NOTHING in the app — the profile form
    // writes profiles.dob (text, YYYY-MM-DD). Part 12 backfilled the three rows
    // that existed; every sign-up since would have been invisible here. Read
    // the column that is actually maintained, server-side filtered on today's
    // month-day so we do not pull every profile to filter in JS. Consent is
    // still users.marketing_opt_in, joined on email.
    const usersRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles` +
      `?dob=like.*-${month}-${day}` +
      `&select=id,email,first_name,dob`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!usersRes.ok) {
      const err = await usersRes.text();
      console.error("Supabase users fetch error:", err);
      return { statusCode: 500, body: JSON.stringify({ error: err }) };
    }

    const profiles = await usersRes.json();
    // Consent lives on users. Look those up for today's matches only.
    let todaysBirthdays = [];
    if (profiles.length) {
      const emails = profiles.map(p => String(p.email || "").toLowerCase()).filter(Boolean);
      const consentRes = await fetch(
        // The whole in-list is URL-encoded: a "+" in name+tag@x.com would
        // otherwise decode to a space and "&"/"#" would truncate the filter,
        // so that person's consent lookup missed and their birthday was skipped.
        `${supabaseUrl}/rest/v1/users?email=in.${encodeURIComponent(`(${emails.map(e => `"${e.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")})`)}&marketing_opt_in=eq.true&select=id,email,first_name`,
        { headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` } }
      );
      const consented = consentRes.ok ? await consentRes.json() : [];
      const byEmail = new Map(consented.map(u => [String(u.email).toLowerCase(), u]));
      todaysBirthdays = profiles
        .filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.dob || "") && byEmail.has(String(p.email || "").toLowerCase()))
        .map(p => { const u = byEmail.get(String(p.email).toLowerCase()); return { id: u.id, email: u.email, first_name: p.first_name || u.first_name, date_of_birth: p.dob }; });
    }

    console.log(`Found ${todaysBirthdays.length} birthday(s) today`);

    if (todaysBirthdays.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };
    }

    // \u2500\u2500 2. Process each birthday \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const results = { sent: [], skipped: [], failed: [] };

    for (const user of todaysBirthdays) {
      try {
        // Check if we already sent a code this year
        const checkRes = await fetch(
          `${supabaseUrl}/rest/v1/birthday_codes` +
          `?user_id=eq.${user.id}&year=eq.${year}&select=promo_code`,
          {
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
            },
          }
        );

        if (checkRes.ok) {
          const existing = await checkRes.json();
          if (existing.length > 0) {
            console.log(`Already sent birthday code to ${user.email} for ${year}`);
            results.skipped.push(user.email);
            continue;
          }
        }

        // \u2500\u2500 Generate a unique promo code \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        // Format: BDAY-XXXXXX-YYYY (6 random uppercase alphanumeric chars)
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const promoCode  = `BDAY-${randomPart}-${year}`;
        let stripePromoId = null;

        // \u2500\u2500 Create Stripe promotional code (if Stripe is configured) \u2500\u2500\u2500\u2500\u2500
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
                // Expires 30 days after birthday
                expires_at: String(Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)),
              }).toString(),
            });

            if (stripeRes.ok) {
              const stripeData = await stripeRes.json();
              stripePromoId = stripeData.id;
              console.log("Stripe promo created:", promoCode);
            } else {
              const err = await stripeRes.text();
              console.warn("Stripe promo creation warning:", err, "\u2014 using code without Stripe link");
            }
          } catch (stripeErr) {
            console.warn("Stripe error (non-fatal):", stripeErr.message);
          }
        }

        // \u2500\u2500 Store the code in Supabase \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        // The dedupe row is the ONLY thing stopping a second run (or tomorrow's)
        // from issuing another code and another email. It used to be
        // fire-and-forget with the status ignored: a failed insert meant a new
        // Stripe code and email every day for the rest of the month. Insert
        // first, treat a conflict as "already sent", and only mail on success.
        const storeRes = await fetch(`${supabaseUrl}/rest/v1/birthday_codes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            user_id:        user.id,
            year,
            promo_code:     promoCode,
            stripe_promo_id: stripePromoId,
          }),
        });
        if (storeRes.status === 409) { results.skipped.push(user.email); continue; }
        if (!storeRes.ok) {
          const txt = await storeRes.text().catch(() => "");
          console.error("Store birthday code error:", storeRes.status, txt);
          results.failed.push(user.email);
          continue;
        }

        // \u2500\u2500 Send birthday email \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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
            subject: `Happy Birthday ${firstName}! \u{1F382} Your 10% gift is inside`,
            html:    buildBirthdayEmail(firstName, promoCode, appUrl),
          }),
        });

        if (emailRes.ok) {
          console.log("Birthday email sent to", user.email, "\u2014 code:", promoCode);
          results.sent.push({ email: user.email, code: promoCode });
        } else {
          const err = await emailRes.text();
          console.error("Resend birthday error:", user.email, err);
          results.failed.push({ email: user.email, error: err });
        }

        // Small pause between sends
        await new Promise((r) => setTimeout(r, 300));

      } catch (userErr) {
        console.error("Error processing birthday for", user.email, userErr.message);
        results.failed.push({ email: user.email, error: userErr.message });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        date: `${month}-${day}-${year}`,
        sent:    results.sent.length,
        skipped: results.skipped.length,
        failed:  results.failed.length,
        details: results,
      }),
    };

  } catch (err) {
    console.error("birthday-emails fatal error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// \u2500\u2500 Birthday email HTML \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function buildBirthdayEmail(firstName, promoCode, appUrl) {
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

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
            <div style="font-size:11px;color:#8C8279;letter-spacing:0.16em;margin-top:6px;">FEED YOUR SOUL \u00B7 FUEL YOUR GAINZ</div>
          </td>
        </tr>

        <!-- Birthday hero -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1612 0%,#2d1f0e 100%);padding:32px;text-align:center;">
            <div style="font-size:56px;margin-bottom:12px;">\u{1F382}</div>
            <h1 style="font-family:Georgia,serif;font-size:28px;color:#F2EDE6;margin:0 0 8px;">Happy Birthday, ${firstName}!</h1>
            <p style="font-size:14px;color:#8C8279;margin:0;letter-spacing:0.08em;">FROM THE SOULGAINZ KITCHEN TO YOU</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              Your birthday deserves a treat \u2014 and we don't mean the cheat meal \u{1F604}. We're giving you <strong style="color:#1a1612;">10% off</strong> any unlock or plan upgrade, just for today (and the next 30 days).
            </p>

            <!-- Discount code block -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#1a1612;border-radius:12px;padding:24px;text-align:center;">
                  <div style="font-size:11px;color:#8C8279;letter-spacing:0.14em;margin-bottom:10px;">YOUR BIRTHDAY DISCOUNT</div>
                  <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#E07B2A;letter-spacing:0.1em;">${promoCode}</div>
                  <div style="font-size:11px;color:#8C8279;margin-top:10px;">10% off \u00B7 expires ${expiryDate}</div>
                </td>
              </tr>
            </table>

            <!-- What to use it on -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <!-- Only Monthly and Annual subscriptions are sold (Terms 5.1, and
                   KNOWN_TIERS in create-checkout.js). This block previously
                   advertised single-recipe unlocks at $1.61 and lifetime access
                   at $53.99 \u2014 neither product exists, lifetime is expressly
                   excluded by Terms 6.4, and both were priced in USD while
                   checkout charges EUR. Avoid hard-coding totals here so the
                   copy cannot drift out of step with the pricing page. -->
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">\u{1F513}</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Go Monthly</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">85+ recipes, the macro calculator, auto grocery lists and weekly planning \u2014 with 10% off your first month.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">\u2B50</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Go Annual</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">The full 170+ recipe library plus early access to every new drop \u2014 with 10% off your first year.</div>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;letter-spacing:0.02em;">
                    Claim Your Birthday Gift \u2192
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

        <!-- Footer -->
        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.8;">
              Cook once. Eat all week. And have a brilliant birthday. \u{1F389}<br>
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
