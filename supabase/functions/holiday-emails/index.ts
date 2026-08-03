// supabase/functions/holiday-emails/index.ts
// Deno Edge Function — port of netlify/functions/holiday-emails.js
//
// Schedule via pg_cron (run in Supabase SQL Editor after deploying):
//
//   select cron.schedule(
//     'holiday-emails-daily',
//     '0 7 * * *',
//     $$ select net.http_post(
//         url:='https://rjreunvnsfjclpighogp.supabase.co/functions/v1/holiday-emails',
//         headers:='{"Content-Type":"application/json","Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb,
//         body:='{}'::jsonb
//     ) as request_id; $$
//   );
//
// Required Supabase secrets:
//   RESEND_API_KEY  — re_xxxx...
//   FROM_EMAIL      — SoulGainz <admin@soulgainz.app>
//   APP_URL         — https://soulgainz.app
//
// ── UPDATE INSTRUCTIONS (do this every January 1) ────────────────────────────
// 1. Muslim lunar dates shift ~11 days earlier each year. Update YEAR_HOLIDAYS
//    using: https://www.islamicfinder.org/islamic-calendar/
// 2. Qatar National Sports Day = second Tuesday of February each year.
// 3. Add a new year block (copy 2028 block, update all dates, redeploy).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Fixed holidays (same date every year) ─────────────────────────────────────
const FIXED_HOLIDAYS: Record<string, { key: string; label: string; faith: string }> = {
  "01-01": { key: "new_year",           label: "New Year's Day",     faith: "universal" },
  "01-06": { key: "epiphany",           label: "Epiphany",           faith: "christian" },
  "12-24": { key: "christmas_eve",      label: "Christmas Eve",      faith: "christian" },
  "12-25": { key: "christmas",          label: "Christmas Day",      faith: "christian" },
  "12-26": { key: "boxing_day",         label: "Boxing Day",         faith: "christian" },
  "12-18": { key: "qatar_national_day", label: "Qatar National Day", faith: "qatar"     },
};

// ── Year-specific holidays ────────────────────────────────────────────────────
interface YearHoliday { date: string; key: string; label: string; faith: string; }

const YEAR_HOLIDAYS: Record<number, YearHoliday[]> = {
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

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey   = Deno.env.get("RESEND_API_KEY");
  const fromEmail   = Deno.env.get("FROM_EMAIL") ?? "SoulGainz <admin@soulgainz.app>";
  const appUrl      = Deno.env.get("APP_URL")    ?? "https://soulgainz.app";

  if (!resendKey) {
    console.log("Missing RESEND_API_KEY — skipping holiday run");
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const now     = new Date();
  const year    = now.getUTCFullYear();
  const month   = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day     = String(now.getUTCDate()).padStart(2, "0");
  const mmdd    = `${month}-${day}`;
  const isoDate = `${year}-${month}-${day}`;

  // Find today's holiday (if any)
  let todayHoliday: YearHoliday | null = FIXED_HOLIDAYS[mmdd]
    ? { date: isoDate, ...FIXED_HOLIDAYS[mmdd] }
    : null;

  if (!todayHoliday && YEAR_HOLIDAYS[year]) {
    todayHoliday = YEAR_HOLIDAYS[year].find((h) => h.date === isoDate) ?? null;
  }

  if (!todayHoliday) {
    console.log(`No holiday today (${isoDate}) — nothing to send`);
    return new Response(JSON.stringify({ holiday: null, sent: 0 }), { status: 200 });
  }

  console.log(`Holiday: ${todayHoliday.label} (${todayHoliday.faith}) — ${isoDate}`);

  try {
    // Fetch all opted-in users
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("email,first_name")
      .eq("marketing_opt_in", true);

    if (usersErr) {
      return new Response(JSON.stringify({ error: usersErr.message }), { status: 500 });
    }

    console.log(`Sending ${todayHoliday.label} email to ${(users ?? []).length} users`);

    const results: { sent: string[]; failed: any[] } = { sent: [], failed: [] };

    for (const user of (users ?? [])) {
      const firstName = user.first_name || user.email.split("@")[0] || "there";
      const { subject, html } = buildHolidayEmail(todayHoliday, firstName, appUrl);

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from: fromEmail, to: user.email, subject, html }),
        });

        if (emailRes.ok) {
          results.sent.push(user.email);
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

    return new Response(JSON.stringify({
      holiday: todayHoliday.label,
      faith:   todayHoliday.faith,
      sent:    results.sent.length,
      failed:  results.failed.length,
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("holiday-emails fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

// ── Email builder — routes to correct template ─────────────────────────────────
function buildHolidayEmail(
  holiday: YearHoliday,
  firstName: string,
  appUrl: string
): { subject: string; html: string } {
  switch (holiday.key) {
    case "christmas":
    case "christmas_eve":
      return {
        subject: `Merry Christmas, ${firstName}! 🎄 Fuel the festive season`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🎄", headline: `Merry Christmas, ${firstName}!`, subline: "Wishing you a joyful, nourishing Christmas", body: `Christmas is a time for family, food, and rest. Whatever's on your table this season, we hope it's delicious and shared with people you love.<br><br>When the festivities settle and the new year energy kicks in, your meal plan will be right here &mdash; ready to help you start January strong.`, cta: "Explore Your Recipes", note: "Cook once. Eat all week. And have a wonderful Christmas. 🎁" }),
      };
    case "good_friday":
      return {
        subject: `Good Friday — a moment to slow down, ${firstName} ✝️`,
        html: holidayTemplate({ firstName, appUrl, emoji: "✝️", headline: `Good Friday, ${firstName}`, subline: "Rest, reflect, and recharge", body: `Good Friday is a time for stillness. Whether you're observing the day quietly or spending it with family, we hope you find space to rest and reset.<br><br>Your meal plan is ready whenever you need it &mdash; simple, nourishing food for the long weekend ahead.`, cta: "Plan Your Easter Weekend", note: "Wishing you a peaceful and meaningful Good Friday." }),
      };
    case "easter_sunday":
      return {
        subject: `Happy Easter, ${firstName}! 🐣 New season, new goals`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🐣", headline: `Happy Easter, ${firstName}!`, subline: "New beginnings — on the plate and in life", body: `Easter is about renewal &mdash; and there's no better time to reset your meal prep routine too. Whether you're just starting out or getting back on track, your plan is ready and waiting.<br><br>New season, new goals. Let's fuel them properly.`, cta: "Start Your Easter Reset", note: "Wishing you a joyful Easter surrounded by great food and great people. 🐰" }),
      };
    case "ash_wednesday":
      return {
        subject: `Ash Wednesday — nourish your body, ${firstName} 🕊️`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🕊️", headline: `Ash Wednesday, ${firstName}`, subline: "Season of intention — starting with what you eat", body: `Lent is a season of discipline and reflection. If you're looking to simplify your eating and be more intentional about what you put in your body, your meal plan is a great place to start.<br><br>Clean, whole ingredients. Meals made with care. That's what we're about.`, cta: "View Your Meal Plan", note: "Wishing you a meaningful and grounding Lenten season." }),
      };
    case "pentecost":
      return {
        subject: `Happy Pentecost, ${firstName}! 🔥 Keep the fire burning`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🔥", headline: `Happy Pentecost, ${firstName}!`, subline: "Fired up for the week ahead", body: `Pentecost Sunday marks the close of the Easter season &mdash; and the start of ordinary time. Keep the momentum going with a solid meal prep session this week.`, cta: "Prep This Week's Meals", note: "Wishing you a blessed and energised Pentecost. 🕊️" }),
      };
    case "epiphany":
      return {
        subject: `Happy Epiphany, ${firstName}! ⭐ The season continues`,
        html: holidayTemplate({ firstName, appUrl, emoji: "⭐", headline: `Happy Epiphany, ${firstName}!`, subline: "The journey continues", body: `Epiphany marks the end of the Christmas season &mdash; and a great moment to get your January meal prep locked in. New year, new routine. Start it right.`, cta: "Set Up January's Plan", note: "Wishing you a wonderful Epiphany and a strong start to the year." }),
      };
    case "new_year":
      return {
        subject: `Happy New Year, ${firstName}! 🎆 Make this year count`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🎆", headline: `Happy New Year, ${firstName}!`, subline: "New year. Same commitment to real food.", body: `Here's to a new year of cooking more, eating better, and showing up for your goals. Your meal plan is the perfect place to start &mdash; one batch cook at a time.<br><br>Set your recipes, build your grocery list, and kick off the year the right way.`, cta: "Start the Year Strong", note: "Wishing you an incredible year ahead. 🥂" }),
      };
    case "boxing_day":
      return {
        subject: `Happy Boxing Day, ${firstName}! 📦 Time to recharge`,
        html: holidayTemplate({ firstName, appUrl, emoji: "📦", headline: `Happy Boxing Day, ${firstName}!`, subline: "Leftovers, rest, and a fresh start tomorrow", body: `Boxing Day is all about slowing down &mdash; and maybe finishing off those Christmas leftovers 😄. When you're ready to get back on track, your meal plan is here and ready.`, cta: "Plan Your Week", note: "Enjoy the rest. You've earned it. 🛋️" }),
      };
    case "ramadan_start":
      return {
        subject: `Ramadan Mubarak, ${firstName}! 🌙 Nourish with intention`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🌙", headline: `Ramadan Mubarak, ${firstName}!`, subline: "A blessed month of intention and nourishment", body: `Ramadan Mubarak! This holy month is a time for spiritual reflection, gratitude, and mindful living &mdash; including how we eat.<br><br>Whether you're planning suhoor, iftar, or simply looking for wholesome meals to break your fast, your meal plan can help you eat intentionally and keep your energy steady throughout the month.`, cta: "Plan Your Ramadan Meals", note: "Wishing you and your family a blessed, peaceful, and nourishing Ramadan. 🌙" }),
      };
    case "eid_al_fitr":
      return {
        subject: `Eid Mubarak, ${firstName}! 🎉 Celebrate and feast`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🎉", headline: `Eid Mubarak, ${firstName}!`, subline: "Eid al-Fitr — celebrate, feast, and give thanks", body: `Eid Mubarak! After a month of fasting and devotion, today is for celebration. Enjoy the food, the family, and the joy of Eid.<br><br>When you're ready to get back to your regular meal prep routine, your plan will be right here waiting for you.`, cta: "Explore Your Recipes", note: "Taqabbal Allahu minna wa minkum — may Allah accept from us and from you. 🌙✨" }),
      };
    case "eid_al_adha":
      return {
        subject: `Eid al-Adha Mubarak, ${firstName}! 🐑 A blessed feast`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🐑", headline: `Eid al-Adha Mubarak, ${firstName}!`, subline: "The Festival of Sacrifice — gratitude, giving, and gathering", body: `Eid al-Adha Mubarak! This blessed day commemorates Ibrahim's (AS) devotion and sacrifice. May it be a day of joy, family, and heartfelt gratitude for everything you have.<br><br>Enjoy the feast, share generously, and we'll be here when you're ready to plan the week ahead.`, cta: "Back to Your Meal Plan", note: "Eid Mubarak from the SoulGainz team. May Allah bless you and your family. 🕌" }),
      };
    case "islamic_new_year":
      return {
        subject: `Islamic New Year Mubarak, ${firstName}! 🌙 New beginnings`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🌙", headline: `Islamic New Year, ${firstName}`, subline: "1 Muharram — a new year of intention", body: `As the Islamic New Year begins, it's a powerful time to reflect on the past year and set intentions for the one ahead &mdash; including how you nourish your body.<br><br>May this new year bring you clarity, strength, and barakah in everything you do.`, cta: "Set Your Intentions", note: "Islamic New Year Mubarak from the SoulGainz team. 🌙" }),
      };
    case "mawlid":
      return {
        subject: `Mawlid al-Nabi Mubarak, ${firstName}! 🌹 Peace be upon him`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🌹", headline: `Mawlid al-Nabi Mubarak, ${firstName}!`, subline: "Honouring the birth of the Prophet Muhammad (SAW)", body: `On this blessed occasion of Mawlid al-Nabi, we send peace and blessings upon the Prophet Muhammad (SAW) and warm wishes to you and your family.<br><br>May this day be filled with remembrance, gratitude, and the company of loved ones.`, cta: "Back to Your Meal Plan", note: "Mawlid Mubarak. Peace and blessings be upon him. 🌹" }),
      };
    case "qatar_national_day":
      return {
        subject: `Happy Qatar National Day, ${firstName}! 🇶🇦 December 18`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🇶🇦", headline: `Happy National Day, ${firstName}!`, subline: "18 December — يوم وطني قطري سعيد", body: `Today we celebrate Qatar National Day &mdash; a day of pride, unity, and gratitude for this remarkable country and everything it has built.<br><br>Whether you're watching the celebrations or spending it with family, we hope this National Day fills you with pride and joy.<br><br>From all of us at SoulGainz &mdash; happy 18 December! 🇶🇦`, cta: "Back to Your Meal Plan", note: "يوم وطني سعيد — Happy National Day from the SoulGainz team. 🌟" }),
      };
    case "qatar_sports_day":
      return {
        subject: `Happy National Sports Day, ${firstName}! 🏅 Move. Fuel. Win.`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🏅", headline: `Happy National Sports Day, ${firstName}!`, subline: "Move more. Eat well. Live strong.", body: `National Sports Day is Qatar's reminder that an active life is a good life &mdash; and we couldn't agree more.<br><br>Today is a perfect day to move your body, prep your meals, and commit to fuelling yourself properly. Your meal plan makes the food side effortless so you can focus on the sport.<br><br>Whatever you're doing today &mdash; running, lifting, swimming, or just getting outside &mdash; enjoy it. 💪`, cta: "Fuel Your Active Day", note: "Happy National Sports Day from the SoulGainz team. Cook once. Perform all week. 🏋️" }),
      };
    default:
      return {
        subject: `Happy ${holiday.label}, ${firstName}! 🌟`,
        html: holidayTemplate({ firstName, appUrl, emoji: "🌟", headline: `Happy ${holiday.label}, ${firstName}!`, subline: "Wishing you a wonderful day", body: `From the SoulGainz team, wishing you a wonderful ${holiday.label}. Enjoy the day, take care of yourself, and we'll be here when you're ready to meal prep.`, cta: "Back to Your Meal Plan", note: `Happy ${holiday.label} from all of us. 🌟` }),
      };
  }
}

// ── Shared email layout ────────────────────────────────────────────────────────
function holidayTemplate({ firstName, appUrl, emoji, headline, subline, body, cta, note }: {
  firstName: string; appUrl: string; emoji: string; headline: string;
  subline: string; body: string; cta: string; note: string;
}): string {
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
            <div style="font-size:52px;margin-bottom:12px;">${emoji}</div>
            <h1 style="font-family:Georgia,serif;font-size:26px;color:#F2EDE6;margin:0 0 8px;">${headline}</h1>
            <p style="font-size:12px;color:#8C8279;margin:0;letter-spacing:0.1em;text-transform:uppercase;">${subline}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#4a3f33;line-height:1.8;margin:0 0 28px;">${body}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}" style="display:inline-block;background:#E07B2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;letter-spacing:0.02em;">
                    ${cta} &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <div style="background:#ebe2d3;border:1px solid #c9bda9;border-radius:10px;padding:16px 18px;">
              <div style="font-size:13px;color:#4a3f33;line-height:1.7;">${note}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#0C0B0A;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#8C8279;margin:0;line-height:1.8;">
              Cook once. Eat all week.<br>
              <a href="mailto:admin@soulgainz.app" style="color:#E07B2A;text-decoration:none;">admin@soulgainz.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
