// supabase/functions/holiday-emails/index.ts
// Runs daily via Supabase Cron — checks if today is a holiday and sends
// a branded holiday email to all opted-in members.
//
// Deploy:  supabase functions deploy holiday-emails
// Schedule: see supabase/cron-jobs.sql
//
// UPDATE EVERY JANUARY 1:
//   Muslim lunar dates shift ~11 days earlier per year.
//   Use https://www.islamicfinder.org/islamic-calendar/ to update YEAR_HOLIDAYS.
//   Qatar National Sports Day = second Tuesday of February.
//
// Env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — auto-injected
//   RESEND_API_KEY, FROM_EMAIL, APP_URL, CRON_SECRET

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Fixed holidays (same date every year) ──────────────────────────────────
const FIXED_HOLIDAYS: Record<string, { key: string; label: string; faith: string }> = {
  "01-01": { key: "new_year",          label: "New Year's Day",     faith: "universal" },
  "01-06": { key: "epiphany",          label: "Epiphany",           faith: "christian" },
  "12-18": { key: "qatar_national_day",label: "Qatar National Day", faith: "qatar"     },
  "12-24": { key: "christmas_eve",     label: "Christmas Eve",      faith: "christian" },
  "12-25": { key: "christmas",         label: "Christmas Day",      faith: "christian" },
  "12-26": { key: "boxing_day",        label: "Boxing Day",         faith: "christian" },
};

// ── Year-specific holidays (update every January 1) ────────────────────────
const YEAR_HOLIDAYS: Record<number, Array<{ date: string; key: string; label: string; faith: string }>> = {
  2025: [
    { date: "2025-03-05", key: "ash_wednesday",    label: "Ash Wednesday",       faith: "christian" },
    { date: "2025-04-18", key: "good_friday",      label: "Good Friday",         faith: "christian" },
    { date: "2025-04-20", key: "easter_sunday",    label: "Easter Sunday",       faith: "christian" },
    { date: "2025-06-08", key: "pentecost",        label: "Pentecost Sunday",    faith: "christian" },
    { date: "2025-03-01", key: "ramadan_start",    label: "Ramadan",             faith: "muslim"    },
    { date: "2025-03-31", key: "eid_al_fitr",      label: "Eid al-Fitr",         faith: "muslim"    },
    { date: "2025-06-06", key: "eid_al_adha",      label: "Eid al-Adha",         faith: "muslim"    },
    { date: "2025-06-27", key: "islamic_new_year", label: "Islamic New Year",    faith: "muslim"    },
    { date: "2025-09-05", key: "mawlid",           label: "Mawlid al-Nabi",      faith: "muslim"    },
    { date: "2025-02-11", key: "qatar_sports_day", label: "National Sports Day", faith: "qatar"     },
  ],
  2026: [
    { date: "2026-02-18", key: "ash_wednesday",    label: "Ash Wednesday",       faith: "christian" },
    { date: "2026-04-03", key: "good_friday",      label: "Good Friday",         faith: "christian" },
    { date: "2026-04-05", key: "easter_sunday",    label: "Easter Sunday",       faith: "christian" },
    { date: "2026-05-24", key: "pentecost",        label: "Pentecost Sunday",    faith: "christian" },
    { date: "2026-02-18", key: "ramadan_start",    label: "Ramadan",             faith: "muslim"    },
    { date: "2026-03-20", key: "eid_al_fitr",      label: "Eid al-Fitr",         faith: "muslim"    },
    { date: "2026-05-27", key: "eid_al_adha",      label: "Eid al-Adha",         faith: "muslim"    },
    { date: "2026-06-17", key: "islamic_new_year", label: "Islamic New Year",    faith: "muslim"    },
    { date: "2026-08-25", key: "mawlid",           label: "Mawlid al-Nabi",      faith: "muslim"    },
    { date: "2026-02-10", key: "qatar_sports_day", label: "National Sports Day", faith: "qatar"     },
  ],
  2027: [
    { date: "2027-02-10", key: "ash_wednesday",    label: "Ash Wednesday",       faith: "christian" },
    { date: "2027-03-26", key: "good_friday",      label: "Good Friday",         faith: "christian" },
    { date: "2027-03-28", key: "easter_sunday",    label: "Easter Sunday",       faith: "christian" },
    { date: "2027-05-16", key: "pentecost",        label: "Pentecost Sunday",    faith: "christian" },
    { date: "2027-02-08", key: "ramadan_start",    label: "Ramadan",             faith: "muslim"    },
    { date: "2027-03-10", key: "eid_al_fitr",      label: "Eid al-Fitr",         faith: "muslim"    },
    { date: "2027-05-16", key: "eid_al_adha",      label: "Eid al-Adha",         faith: "muslim"    },
    { date: "2027-06-06", key: "islamic_new_year", label: "Islamic New Year",    faith: "muslim"    },
    { date: "2027-08-14", key: "mawlid",           label: "Mawlid al-Nabi",      faith: "muslim"    },
    { date: "2027-02-09", key: "qatar_sports_day", label: "National Sports Day", faith: "qatar"     },
  ],
  2028: [
    { date: "2028-03-01", key: "ash_wednesday",    label: "Ash Wednesday",       faith: "christian" },
    { date: "2028-04-14", key: "good_friday",      label: "Good Friday",         faith: "christian" },
    { date: "2028-04-16", key: "easter_sunday",    label: "Easter Sunday",       faith: "christian" },
    { date: "2028-06-04", key: "pentecost",        label: "Pentecost Sunday",    faith: "christian" },
    { date: "2028-01-28", key: "ramadan_start",    label: "Ramadan",             faith: "muslim"    },
    { date: "2028-02-27", key: "eid_al_fitr",      label: "Eid al-Fitr",         faith: "muslim"    },
    { date: "2028-05-05", key: "eid_al_adha",      label: "Eid al-Adha",         faith: "muslim"    },
    { date: "2028-05-25", key: "islamic_new_year", label: "Islamic New Year",    faith: "muslim"    },
    { date: "2028-08-03", key: "mawlid",           label: "Mawlid al-Nabi",      faith: "muslim"    },
    { date: "2028-02-08", key: "qatar_sports_day", label: "National Sports Day", faith: "qatar"     },
  ],
};

serve(async (req: Request) => {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey   = Deno.env.get("RESEND_API_KEY");
  const fromEmail   = Deno.env.get("FROM_EMAIL") || "SoulGainz <admin@soulgainz.app>";
  const appUrl      = Deno.env.get("APP_URL") || "https://soulgainz.app";

  if (!resendKey) {
    console.log("RESEND_API_KEY not set — skipping holiday run");
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const now     = new Date();
  const year    = now.getUTCFullYear();
  const month   = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day     = String(now.getUTCDate()).padStart(2, "0");
  const mmdd    = `${month}-${day}`;
  const isoDate = `${year}-${month}-${day}`;

  // Determine today's holiday (if any)
  let todayHoliday = FIXED_HOLIDAYS[mmdd] || null;
  if (!todayHoliday && YEAR_HOLIDAYS[year]) {
    todayHoliday = YEAR_HOLIDAYS[year].find((h) => h.date === isoDate) || null;
  }

  if (!todayHoliday) {
    console.log(`No holiday today (${isoDate}) — nothing to send`);
    return new Response(JSON.stringify({ holiday: null, sent: 0 }), { status: 200 });
  }

  console.log(`Holiday: ${todayHoliday.label} (${todayHoliday.faith}) — ${isoDate}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: users, error } = await supabase
    .from("users")
    .select("email, first_name")
    .eq("marketing_opt_in", true);

  if (error) {
    console.error("Supabase query error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = { sent: [] as string[], failed: [] as any[] };

  for (const user of users ?? []) {
    const firstName = user.first_name || (user.email as string).split("@")[0] || "there";
    const { subject, html } = buildHolidayEmail(todayHoliday, firstName, appUrl);

    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to: user.email, subject, html }),
      });

      if (emailRes.ok) {
        results.sent.push(user.email as string);
      } else {
        const err = await emailRes.text();
        console.error("Resend error:", user.email, err);
        results.failed.push({ email: user.email, error: err });
      }
    } catch (e: any) {
      results.failed.push({ email: user.email, error: e.message });
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Holiday emails sent: ${results.sent.length}/${(users ?? []).length}`);
  return new Response(
    JSON.stringify({ holiday: todayHoliday.label, faith: todayHoliday.faith, sent: results.sent.length, failed: results.failed.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

// ── Email builder ──────────────────────────────────────────────────────────
interface HolidayInfo { key: string; label: string; faith: string }

function buildHolidayEmail(holiday: HolidayInfo, firstName: string, appUrl: string): { subject: string; html: string } {
  type TemplateOpts = { firstName: string; appUrl: string; emoji: string; headline: string; subline: string; body: string; cta: string; note: string };

  const tpl = (opts: TemplateOpts): string => `<!DOCTYPE html>
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
            <div style="font-size:52px;margin-bottom:12px;">${opts.emoji}</div>
            <h1 style="font-family:Georgia,serif;font-size:26px;color:#F2EDE6;margin:0 0 8px;">${opts.headline}</h1>
            <p style="font-size:13px;color:#8C8279;margin:0;letter-spacing:0.08em;">${opts.subline.toUpperCase()}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#4a3f33;line-height:1.7;margin:0 0 28px;">${opts.body}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${opts.appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                    ${opts.cta} &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.8;">
              ${opts.note}<br>
              <a href="mailto:support@soulgainz.app" style="color:#E07B2A;text-decoration:none;">support@soulgainz.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  switch (holiday.key) {
    case "christmas":
    case "christmas_eve":
      return {
        subject: `Merry Christmas, ${firstName}! 🎄 Fuel the festive season`,
        html: tpl({ firstName, appUrl, emoji: "🎄", headline: `Merry Christmas, ${firstName}!`, subline: "Wishing you a joyful, nourishing Christmas", body: `Christmas is a time for family, food, and rest. Whatever's on your table this season, we hope it's delicious and shared with people you love.<br><br>When the festivities settle and the new year energy kicks in, your meal plan will be right here — ready to help you start January strong.`, cta: "Explore Your Recipes", note: "Cook once. Eat all week. And have a wonderful Christmas. 🎁" }),
      };
    case "good_friday":
      return {
        subject: `Good Friday — a moment to slow down, ${firstName} ✝️`,
        html: tpl({ firstName, appUrl, emoji: "✝️", headline: `Good Friday, ${firstName}`, subline: "Rest, reflect, and recharge", body: `Good Friday is a time for stillness. Whether you're observing the day quietly or spending it with family, we hope you find space to rest and reset.<br><br>Your meal plan is ready whenever you need it — simple, nourishing food for the long weekend ahead.`, cta: "Plan Your Easter Weekend", note: "Wishing you a peaceful and meaningful Good Friday." }),
      };
    case "easter_sunday":
      return {
        subject: `Happy Easter, ${firstName}! 🐣 New season, new goals`,
        html: tpl({ firstName, appUrl, emoji: "🐣", headline: `Happy Easter, ${firstName}!`, subline: "New beginnings — on the plate and in life", body: `Easter is about renewal — and there's no better time to reset your meal prep routine. Whether you're just starting out or getting back on track, your plan is ready and waiting.<br><br>New season, new goals. Let's fuel them properly.`, cta: "Start Your Easter Reset", note: "Wishing you a joyful Easter surrounded by great food and great people. 🐇" }),
      };
    case "ash_wednesday":
      return {
        subject: `Ash Wednesday — nourish your body, ${firstName} 🕊️`,
        html: tpl({ firstName, appUrl, emoji: "🕊️", headline: `Ash Wednesday, ${firstName}`, subline: "Season of intention — starting with what you eat", body: `Lent is a season of discipline and reflection. If you're looking to simplify your eating and be more intentional about what you put in your body, your meal plan is a great place to start.<br><br>Clean, whole ingredients. Meals made with care. That's what we're about.`, cta: "View Your Meal Plan", note: "Wishing you a meaningful and grounding Lenten season." }),
      };
    case "pentecost":
      return {
        subject: `Happy Pentecost, ${firstName}! 🔥 Keep the fire burning`,
        html: tpl({ firstName, appUrl, emoji: "🔥", headline: `Happy Pentecost, ${firstName}!`, subline: "Fired up for the week ahead", body: `Pentecost Sunday marks the close of the Easter season — and the start of ordinary time. Keep the momentum going with a solid meal prep session this week.`, cta: "Prep This Week's Meals", note: "Wishing you a blessed and energised Pentecost. 🕊️" }),
      };
    case "epiphany":
      return {
        subject: `Happy Epiphany, ${firstName}! ⭐ The season continues`,
        html: tpl({ firstName, appUrl, emoji: "⭐", headline: `Happy Epiphany, ${firstName}!`, subline: "The journey continues", body: `Epiphany marks the end of the Christmas season — and a great moment to get your January meal prep locked in. New year, new routine. Start it right.`, cta: "Set Up January's Plan", note: "Wishing you a wonderful Epiphany and a strong start to the year." }),
      };
    case "new_year":
      return {
        subject: `Happy New Year, ${firstName}! 🎆 Make this year count`,
        html: tpl({ firstName, appUrl, emoji: "🎆", headline: `Happy New Year, ${firstName}!`, subline: "New year. Same commitment to real food.", body: `Here's to a new year of cooking more, eating better, and showing up for your goals. Your meal plan is the perfect place to start — one batch cook at a time.<br><br>Set your recipes, build your grocery list, and kick off the year the right way.`, cta: "Start the Year Strong", note: "Wishing you an incredible year ahead. 🥂" }),
      };
    case "boxing_day":
      return {
        subject: `Happy Boxing Day, ${firstName}! 📦 Time to recharge`,
        html: tpl({ firstName, appUrl, emoji: "📦", headline: `Happy Boxing Day, ${firstName}!`, subline: "Leftovers, rest, and a fresh start tomorrow", body: `Boxing Day is all about slowing down — and maybe finishing off those Christmas leftovers 😄. When you're ready to get back on track, your meal plan is here and ready.`, cta: "Plan Your Week", note: "Enjoy the rest. You've earned it. 🛋️" }),
      };
    case "ramadan_start":
      return {
        subject: `Ramadan Mubarak, ${firstName}! 🌙 A blessed month ahead`,
        html: tpl({ firstName, appUrl, emoji: "🌙", headline: `Ramadan Mubarak, ${firstName}!`, subline: "A blessed month of reflection, intention, and nourishment", body: `As Ramadan begins, we hope this month brings you peace, purpose, and plenty of blessings.<br><br>Your meal plan is here to help with suhoor and iftar — high-protein meals that keep you fuelled through the day and satisfied after sunset.`, cta: "Plan Your Ramadan Meals", note: "Ramadan Mubarak from the SoulGainz kitchen. 🌟" }),
      };
    case "eid_al_fitr":
      return {
        subject: `Eid Mubarak, ${firstName}! 🎉 Celebrate and feast`,
        html: tpl({ firstName, appUrl, emoji: "🎉", headline: `Eid al-Fitr Mubarak, ${firstName}!`, subline: "The celebration begins — enjoy every bite", body: `Eid al-Fitr marks the end of Ramadan — a time for celebration, gratitude, and sharing food with the people you love.<br><br>Enjoy the feast today. When you're ready to get back on track, your meal plan is waiting.`, cta: "Explore Your Recipes", note: "Eid Mubarak! Taqabbal Allahu minna wa minkum. 🌙" }),
      };
    case "eid_al_adha":
      return {
        subject: `Eid al-Adha Mubarak, ${firstName}! 🐑 A blessed celebration`,
        html: tpl({ firstName, appUrl, emoji: "🐑", headline: `Eid al-Adha Mubarak, ${firstName}!`, subline: "A time for gratitude, generosity, and good food", body: `Eid al-Adha is a time to reflect on sacrifice, generosity, and the blessings in our lives. We hope your celebration is filled with family, joy, and of course — incredible food.<br><br>Eid Mubarak from all of us at SoulGainz.`, cta: "Open SoulGainz", note: "Wishing you and your family a blessed Eid al-Adha. 🙏" }),
      };
    case "islamic_new_year":
      return {
        subject: `Islamic New Year Mubarak, ${firstName}! 🌙 Fresh start`,
        html: tpl({ firstName, appUrl, emoji: "🌙", headline: `Happy Islamic New Year, ${firstName}!`, subline: "A new Hijri year — new intentions, new goals", body: `As the new Hijri year begins, it's a wonderful time to set fresh intentions — including the ones around how you nourish your body.<br><br>Your meal plan is here to help you start the year with purpose and protein.`, cta: "Plan Your New Year Meals", note: "Wishing you a blessed and fruitful new Hijri year. ✨" }),
      };
    case "mawlid":
      return {
        subject: `Mawlid al-Nabi Mubarak, ${firstName}! 🌟 Blessed day`,
        html: tpl({ firstName, appUrl, emoji: "🌟", headline: `Mawlid al-Nabi Mubarak, ${firstName}!`, subline: "Celebrating the Prophet's birthday", body: `On this blessed day, we send our warmest wishes to you and your family. May it bring peace, reflection, and gratitude.<br><br>Mawlid Mubarak from the SoulGainz kitchen.`, cta: "Open SoulGainz", note: "Wishing you a blessed Mawlid al-Nabi. 🌙" }),
      };
    case "qatar_national_day":
      return {
        subject: `Qatar National Day Mubarak, ${firstName}! 🇶🇦 Proud day`,
        html: tpl({ firstName, appUrl, emoji: "🇶🇦", headline: `Qatar National Day, ${firstName}!`, subline: "Celebrating Qatar — December 18", body: `Happy Qatar National Day! A proud celebration of Qatar's heritage, resilience, and vision for the future.<br><br>Wishing you and your family a wonderful National Day full of celebration and great food.`, cta: "Open SoulGainz", note: "Qatar National Day Mubarak! 🎉" }),
      };
    case "qatar_sports_day":
      return {
        subject: `Qatar National Sports Day, ${firstName}! 🏋️ Move and fuel`,
        html: tpl({ firstName, appUrl, emoji: "🏋️", headline: `Happy National Sports Day, ${firstName}!`, subline: "Move your body. Fuel it right.", body: `Qatar National Sports Day is the perfect reminder that fitness and nutrition go hand in hand.<br><br>Today is a great day to get moving — and to lock in your meal prep so you're fuelled for whatever workout you've got planned.`, cta: "Set Up Your Meal Plan", note: "Here's to an active and well-fuelled Sports Day! 💪" }),
      };
    default:
      return {
        subject: `Happy ${holiday.label}, ${firstName}! 🎉 From SoulGainz`,
        html: tpl({ firstName, appUrl, emoji: "🎉", headline: `Happy ${holiday.label}, ${firstName}!`, subline: "Wishing you a wonderful day", body: `We hope you're having a wonderful ${holiday.label}. Whatever you're celebrating today, we hope it's full of joy, rest, and of course — great food.<br><br>Your meal plan is here whenever you need it.`, cta: "Open SoulGainz", note: "Warm wishes from the SoulGainz kitchen. 🧡" }),
      };
  }
}
