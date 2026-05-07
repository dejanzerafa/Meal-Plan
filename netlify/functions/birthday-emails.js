// netlify/functions/birthday-emails.js
// Scheduled daily at 08:00 UTC â€” finds members whose birthday is today,
// issues a unique 10% Stripe promotional code, stores it, and sends a
// branded birthday email.
//
// Required env vars:
//   SUPABASE_URL         â€” https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY â€” service_role key
//   RESEND_API_KEY       â€” re_xxxx...
//   STRIPE_SECRET_KEY    â€” sk_live_xxxx... (for creating promo codes)
//   FROM_EMAIL           â€” SoulGainz <admin@soulgainz.app>
//   APP_URL              â€” https://soulgainz.app
//
// Stripe setup (one-time in Stripe Dashboard):
//   1. Promotions â†’ Coupons â†’ Create coupon: 10% off, name "BIRTHDAY10BASE"
//   2. Copy the coupon ID into STRIPE_BIRTHDAY_COUPON_ID env var
//   (The function creates a unique promotional code on top of that coupon)

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey   = process.env.RESEND_API_KEY;
  const stripeKey   = process.env.STRIPE_SECRET_KEY;
  const couponId    = process.env.STRIPE_BIRTHDAY_COUPON_ID; // base coupon in Stripe
  const fromEmail   = process.env.FROM_EMAIL || "SoulGainz <admin@soulgainz.app>";
  const appUrl      = process.env.APP_URL    || "https://soulgainz.app";

  if (!supabaseUrl || !supabaseKey || !resendKey) {
    console.log("Missing required env vars â€” skipping birthday run");
    return { statusCode: 200, body: JSON.stringify({ skipped: true }) };
  }

  // Today's month and day (UTC)
  const now   = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day   = String(now.getUTCDate()).padStart(2, "0");
  const year  = now.getUTCFullYear();

  console.log(`Birthday check for ${month}-${day} (${year})`);

  try {
    // â”€â”€ 1. Find users whose birthday is today â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // date_of_birth is stored as DATE; we match on month + day only.
    const usersRes = await fetch(
      `${supabaseUrl}/rest/v1/users` +
      `?date_of_birth=not.is.null` +
      `&marketing_opt_in=eq.true` +
      `&select=id,email,first_name,date_of_birth`,
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

    const allUsers = await usersRes.json();

    // Filter to today's birthdays (month-day match)
    const todaysBirthdays = allUsers.filter((u) => {
      if (!u.date_of_birth) return false;
      const dob = u.date_of_birth; // "YYYY-MM-DD"
      return dob.slice(5, 7) === month && dob.slice(8, 10) === day;
    });

    console.log(`Found ${todaysBirthdays.length} birthday(s) today`);

    if (todaysBirthdays.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };
    }

    // â”€â”€ 2. Process each birthday â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

        // â”€â”€ Generate a unique promo code â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // Format: BDAY-XXXXXX-YYYY (6 random uppercase alphanumeric chars)
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const promoCode  = `BDAY-${randomPart}-${year}`;
        let stripePromoId = null;

        // â”€â”€ Create Stripe promotional code (if Stripe is configured) â”€â”€â”€â”€â”€
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
              console.warn("Stripe promo creation warning:", err, "â€” using code without Stripe link");
            }
          } catch (stripeErr) {
            console.warn("Stripe error (non-fatal):", stripeErr.message);
          }
        }

        // â”€â”€ Store the code in Supabase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        await fetch(`${supabaseUrl}/rest/v1/birthday_codes`, {
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
        }).catch((e) => console.error("Store birthday code error:", e));

        // â”€â”€ Send birthday email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            subject: `Happy Birthday ${firstName}! ðŸŽ‚ Your 10% gift is inside`,
            html:    buildBirthdayEmail(firstName, promoCode, appUrl),
          }),
        });

        if (emailRes.ok) {
          console.log("Birthday email sent to", user.email, "â€” code:", promoCode);
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

// â”€â”€ Birthday email HTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            <div style="font-size:11px;color:#8C8279;letter-spacing:0.16em;margin-top:6px;">FEED YOUR SOUL Â· FUEL YOUR GAINZ</div>
          </td>
        </tr>

        <!-- Birthday hero -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1612 0%,#2d1f0e 100%);padding:32px;text-align:center;">
            <div style="font-size:56px;margin-bottom:12px;">ðŸŽ‚</div>
            <h1 style="font-family:Georgia,serif;font-size:28px;color:#F2EDE6;margin:0 0 8px;">Happy Birthday, ${firstName}!</h1>
            <p style="font-size:14px;color:#8C8279;margin:0;letter-spacing:0.08em;">FROM THE SOULGAINZ KITCHEN TO YOU</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 24px;">
              Your birthday deserves a treat â€” and we don't mean the cheat meal ðŸ˜„. We're giving you <strong style="color:#1a1612;">10% off</strong> any unlock or plan upgrade, just for today (and the next 30 days).
            </p>

            <!-- Discount code block -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#1a1612;border-radius:12px;padding:24px;text-align:center;">
                  <div style="font-size:11px;color:#8C8279;letter-spacing:0.14em;margin-bottom:10px;">YOUR BIRTHDAY DISCOUNT</div>
                  <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#E07B2A;letter-spacing:0.1em;">${promoCode}</div>
                  <div style="font-size:11px;color:#8C8279;margin-top:10px;">10% off Â· expires ${expiryDate}</div>
                </td>
              </tr>
            </table>

            <!-- What to use it on -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">ðŸ”“</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Unlock a recipe</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Any single recipe unlock for just $1.61 instead of $1.99.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;padding-right:14px;padding-bottom:16px;font-size:22px;width:36px;">â™¾ï¸</td>
                <td style="padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1612;margin-bottom:3px;">Go lifetime</div>
                  <div style="font-size:13px;color:#4a3f33;line-height:1.6;">Lifetime access drops to $53.99 â€” every recipe, every future drop, forever.</div>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;letter-spacing:0.02em;">
                    Claim Your Birthday Gift â†’
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
              Cook once. Eat all week. And have a brilliant birthday. ðŸŽ‰<br>
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
