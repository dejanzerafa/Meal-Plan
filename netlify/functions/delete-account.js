// netlify/functions/delete-account.js
//
// Right to erasure. POST with the user's bearer token and { confirm: "DELETE" }.
//
// privacy.html §7 promised deletion and the ME tab had no way to ask for it;
// every request would have been a manual, eight-table SQL job plus a Stripe
// cancel, and easy to leave half-done (Stripe still billing a deleted user).
//
// Order matters:
//   1. Stamp the Stripe customer, then cancel any live subscription. A deleted auth user with a
//      still-billing subscription is the worst outcome — the webhook would
//      then have nowhere to write and the customer would keep paying.
//   2. Delete app rows. `users` cascades to subscriptions / birthday_codes /
//      events (FK ON DELETE CASCADE / SET NULL — see part 12).
//   3. Delete the auth user last, so a failure in 1–2 leaves an account that
//      can retry, rather than an orphaned pile of rows with no owner.
//
// Stripe's own customer record is NOT deleted: invoices are a legal
// retention requirement (7 years). The customer is detached from any
// personal metadata we control.

const { requireUser } = require("./_shared/auth");
const { report } = require("./_shared/report");

const ORIGINS = ["https://soulgainz.app", "https://www.soulgainz.app", "https://soulgainz.netlify.app"];

exports.handler = async (event) => {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  const cors = {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : "https://soulgainz.app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { ...cors, "Access-Control-Max-Age": "86400" }, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "Method not allowed" }) };

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) }; }
  // The client shows a typed-confirmation dialog; the server checks it too so
  // a stray fetch from devtools cannot wipe an account with one call.
  if (body.confirm !== "DELETE") return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Confirmation required" }) };

  const auth = await requireUser(event);
  if (auth.error) return { statusCode: auth.status, headers: cors, body: JSON.stringify({ error: auth.error }) };
  const { user, supabase } = auth;
  const email = String(user.email || "").toLowerCase();
  const steps = [];

  try {
    // ── 1. Stripe: cancel anything still billing ───────────────────────────
    const { data: userRows } = await supabase.from("users").select("id, stripe_customer_id").ilike("email", email);
    const userIds = (userRows || []).map(u => u.id);
    let stripeCancelled = 0;
    if (userIds.length && process.env.STRIPE_SECRET_KEY) {
      const Stripe = require("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
      const { data: subs } = await supabase.from("subscriptions")
        .select("stripe_subscription_id, status").in("user_id", userIds)
        .not("stripe_subscription_id", "is", null);
      // Stamp the customer FIRST. Cancelling fires customer.subscription.deleted
      // immediately, and the webhook reads this stamp to know the account is
      // being closed rather than paging an unmatched revocation.
      for (const u of userRows || []) {
        if (!u.stripe_customer_id) continue;
        try {
          await stripe.customers.update(u.stripe_customer_id, { name: "", description: "deleted account", metadata: { userId: "", deleted_at: new Date().toISOString() } });
        } catch (e) { console.warn("delete-account: customer detach skipped:", e.message); }
      }
      const live = (subs || []).filter(s => !["canceled", "cancelled", "expired", "refunded"].includes(String(s.status || "").toLowerCase()));
      for (const s of live) {
        try {
          await stripe.subscriptions.cancel(s.stripe_subscription_id, { prorate: false });
          stripeCancelled++;
        } catch (e) {
          // Already gone at Stripe is fine; anything else must stop the
          // deletion so we never leave a billing subscription ownerless.
          if (e && e.code === "resource_missing") continue;
          throw new Error(`Stripe cancel failed for ${s.stripe_subscription_id}: ${e.message}`);
        }
      }
    }
    steps.push(`stripe:${stripeCancelled}`);

    // ── 2. App rows ────────────────────────────────────────────────────────
    const del = async (table, col, val, { optional = false } = {}) => {
      const { error } = await supabase.from(table).delete().eq(col, val);
      if (error) {
        if (optional) { console.warn(`delete-account: ${table} skipped: ${error.message}`); return; }
        throw new Error(`${table}: ${error.message}`);
      }
      steps.push(table);
    };
    const delEmail = async (table, { optional = true } = {}) => {
      const { error } = await supabase.from(table).delete().ilike("email", email);
      if (error) {
        if (optional) { console.warn(`delete-account: ${table} skipped: ${error.message}`); return; }
        throw new Error(`${table}: ${error.message}`);
      }
      steps.push(table);
    };

    await del("meal_logs", "user_id", user.id);
    await del("favourites", "user_id", user.id);
    await del("cooked_it", "user_id", user.id);
    await del("user_supplements", "user_id", user.id);
    // Promo codes are the business's records, not the user's: unlink, don't delete.
    { const { error } = await supabase.from("promo_codes").update({ redeemed_by: null }).eq("redeemed_by", user.id);
      if (error) console.warn("delete-account: promo_codes unlink skipped:", error.message); else steps.push("promo_codes"); }
    await delEmail("feedback");
    await delEmail("events");
    await delEmail("waitlist");
    await delEmail("email_signups");
    await delEmail("calc_email_sends");
    // users cascades → subscriptions, birthday_codes; events.user_id SET NULL.
    await delEmail("users", { optional: false });
    await del("profiles", "id", user.id);

    // ── 3. Auth user last ──────────────────────────────────────────────────
    const { error: authErr } = await supabase.auth.admin.deleteUser(user.id);
    if (authErr) throw new Error(`auth: ${authErr.message}`);
    steps.push("auth");

    console.log(`delete-account: ${user.id} removed (${steps.join(",")})`);
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, stripeCancelled }) };
  } catch (err) {
    await report("delete-account", err instanceof Error ? err : new Error(String(err)), { userId: user.id, completed: steps.join(",") });
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Deletion could not be completed. Nothing irreversible happened past: " + (steps.join(", ") || "nothing") + ". Please contact support@soulgainz.app." }) };
  }
};
