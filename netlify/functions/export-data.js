// netlify/functions/export-data.js
//
// Data portability. GET with the user's bearer token → a JSON document of
// every row that belongs to them, across every table, as a download.
//
// privacy.html §7 promised "access" and "portability" and nothing in the
// codebase provided either. Every request would have been a hand-run SQL
// export across eight tables.
//
// The bearer is the only input. Nothing is taken from the query string or
// body, so there is no way to ask for someone else's data.

const { requireUser } = require("./_shared/auth");
const { report } = require("./_shared/report");

const ORIGINS = ["https://soulgainz.app", "https://www.soulgainz.app", "https://soulgainz.netlify.app"];

exports.handler = async (event) => {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  const cors = {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : "https://soulgainz.app",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { ...cors, "Access-Control-Max-Age": "86400" }, body: "" };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers: cors, body: "Method not allowed" };

  const auth = await requireUser(event);
  if (auth.error) return { statusCode: auth.status, headers: cors, body: JSON.stringify({ error: auth.error }) };
  const { user, supabase } = auth;
  const email = String(user.email || "").toLowerCase();

  try {
    // Core tables (the user's own rows) throw on error — a half export is
    // worse than a failed one. Peripheral tables (feedback, waitlist…) are
    // best-effort: an optional table missing on one environment must not
    // block the user's right of access.
    const byId = async (table, col = "user_id") => {
      const { data, error } = await supabase.from(table).select("*").eq(col, user.id);
      if (error) throw new Error(`${table}: ${error.message}`);
      return data || [];
    };
    const byEmail = async (table, { optional = false } = {}) => {
      const { data, error } = await supabase.from(table).select("*").ilike("email", email);
      if (error) {
        if (optional) { console.warn(`export-data: skipping ${table}: ${error.message}`); return []; }
        throw new Error(`${table}: ${error.message}`);
      }
      return data || [];
    };

    const profile = (await byId("profiles", "id"))[0] || null;
    const users = await byEmail("users");
    const userIds = users.map(u => u.id);
    let subscriptions = [], birthdayCodes = [];
    if (userIds.length) {
      const s = await supabase.from("subscriptions").select("*").in("user_id", userIds);
      subscriptions = s.data || [];
      const b = await supabase.from("birthday_codes").select("*").in("user_id", userIds);
      birthdayCodes = b.data || [];
    }

    const out = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at,
                 metadata: user.user_metadata || {} },
      profile,
      marketing_and_billing: users.map(u => ({ ...u })),
      subscriptions: subscriptions.map(s => { const { stripe_session_id, ...rest } = s; return rest; }),
      meal_logs:        await byId("meal_logs"),
      favourites:       await byId("favourites"),
      cooked_it:        await byId("cooked_it"),
      supplements:      await byId("user_supplements"),
      feedback:         await byEmail("feedback", { optional: true }),
      events:           await byEmail("events", { optional: true }),
      waitlist:         await byEmail("waitlist", { optional: true }),
      email_signups:    await byEmail("email_signups", { optional: true }),
      calc_email_sends: await byEmail("calc_email_sends", { optional: true }),
      birthday_codes:   birthdayCodes,
      note: "Recipes, meal plans and the shopping list are computed on your device from your selections above and are not stored on our servers. Local-only data (pantry, custom recipes) lives in your browser storage.",
    };

    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "application/json", "Content-Disposition": `attachment; filename="soulgainz-data-${new Date().toISOString().slice(0, 10)}.json"` },
      body: JSON.stringify(out, null, 2),
    };
  } catch (err) {
    await report("export-data", err instanceof Error ? err : new Error(String(err)), { userId: user.id });
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Export failed" }) };
  }
};
