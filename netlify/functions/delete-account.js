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
  // ilike treats % and _ as wildcards — and _ is common in real addresses.
  // Unescaped, a_b@x.com matched (and here would have read or deleted) every
  // a?b@x.com row belonging to someone else. Escape the pattern characters;
  // PostgREST also rewrites a bare * to %, so refuse that outright.
  if (/[*]/.test(email)) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Unsupported email" }) };
  const emailPattern = email.replace(/[\\%_]/g, c => "\\" + c);
  const steps = [];
  let stampedCustomers = [];

  try {
    // ── 1. Stripe: cancel anything still billing ───────────────────────────
    // Read errors are fatal here. A transient PostgREST failure used to read
    // as "no users row", skip Stripe entirely, and go on to delete the account
    // — the exact ownerless-subscription outcome this step exists to prevent.
    const ur = await supabase.from("users").select("id, stripe_customer_id").ilike("email", emailPattern);
    if (ur.error) throw new Error(`users lookup: ${ur.error.message}`);
    const userRows = ur.data || [];
    const userIds = userRows.map(u => u.id);
    let stripeCancelled = 0;
    if (process.env.STRIPE_SECRET_KEY) {
      const Stripe = require("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

      // Find subscriptions from STRIPE's point of view, not only our ledger:
      // the webhook tolerates a failed ledger insert, and a customer whose
      // Stripe email differs from the auth email has no users row at all.
      // Three sources, de-duplicated: ledger rows, every subscription on each
      // known customer, and a metadata search on the auth user id.
      const subIds = new Set();
      const customerIds = new Set(userRows.map(u => u.stripe_customer_id).filter(Boolean));
      if (userIds.length) {
        const sr = await supabase.from("subscriptions").select("stripe_subscription_id, status")
          .in("user_id", userIds).not("stripe_subscription_id", "is", null);
        if (sr.error) throw new Error(`subscriptions lookup: ${sr.error.message}`);
        for (const s of sr.data || []) subIds.add(s.stripe_subscription_id);
      }
      for (const cid of customerIds) {
        const list = await stripe.subscriptions.list({ customer: cid, status: "all", limit: 100 });
        for (const s of list.data) subIds.add(s.id);
      }
      try {
        const found = await stripe.subscriptions.search({ query: `metadata['userId']:'${user.id}'`, limit: 100 });
        for (const s of found.data) { subIds.add(s.id); if (s.customer) customerIds.add(typeof s.customer === "string" ? s.customer : s.customer.id); }
      } catch (e) { console.warn("delete-account: subscription search skipped:", e.message); }

      // Stamp each customer FIRST. Cancelling fires customer.subscription.deleted
      // immediately, and the webhook reads this stamp to know the account is
      // being closed rather than paging an unmatched revocation. Stamps are
      // reverted in the catch below if anything later fails.
      for (const cid of customerIds) {
        try {
          await stripe.customers.update(cid, { metadata: { deleted_at: new Date().toISOString() } });
          stampedCustomers.push(cid);
        } catch (e) { console.warn("delete-account: customer stamp skipped:", e.message); }
      }
      for (const id of subIds) {
        try {
          const sub = await stripe.subscriptions.retrieve(id);
          if (sub.status === "canceled") continue;
          await stripe.subscriptions.cancel(id, { prorate: false });
          stripeCancelled++;
        } catch (e) {
          // Already gone at Stripe is fine; anything else must stop the
          // deletion so we never leave a billing subscription ownerless.
          if (e && e.code === "resource_missing") continue;
          throw new Error(`Stripe cancel failed for ${id}: ${e.message}`);
        }
      }
      // Only now — every subscription is dead — strip the personal data we
      // set on the customer. Invoices stay (legal retention).
      for (const cid of customerIds) {
        try { await stripe.customers.update(cid, { name: "", description: "deleted account", metadata: { userId: "" } }); }
        catch (e) { console.warn("delete-account: customer detach skipped:", e.message); }
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
      const { error } = await supabase.from(table).delete().ilike("email", emailPattern);
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
    // Resend audience (marketing contacts) — best effort, keyed by email.
    if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
      try {
        const r = await fetch(`https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts/${encodeURIComponent(email)}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
        if (r.ok || r.status === 404) steps.push("resend"); else console.warn("delete-account: resend contact delete", r.status);
      } catch (e) { console.warn("delete-account: resend contact delete skipped:", e.message); }
    }
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
    // Un-stamp: a stamped customer whose account survived would make every
    // future real cancellation look like an account closure to the webhook.
    if (stampedCustomers.length && process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = require("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
        for (const cid of stampedCustomers) { try { await stripe.customers.update(cid, { metadata: { deleted_at: "" } }); } catch (_) {} }
      } catch (_) {}
    }
    await report("delete-account", err instanceof Error ? err : new Error(String(err)), { userId: user.id, completed: steps.join(",") });
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Deletion could not be completed. Nothing irreversible happened past: " + (steps.join(", ") || "nothing") + ". Please contact support@soulgainz.app." }) };
  }
};
