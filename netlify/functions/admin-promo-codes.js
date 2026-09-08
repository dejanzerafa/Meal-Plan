// netlify/functions/admin-promo-codes.js
//
// List, create and delete promo codes for the in-app admin panel.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
// ─────────────────────────────────────────────────────────────────────────────
// The admin panel used to talk to `promo_codes` straight from the browser with
// the anon key. supabase-security-fix.sql then revoked that access, and it was
// right to: with a SELECT grant, ANY signed-in user could read the `code`
// column for every live code and redeem one for a free paid tier. The revoke
// closed the hole and broke the panel at the same time — "permission denied for
// table promo_codes".
//
// Re-granting with an admin RLS policy would work, but it puts the table one
// policy mistake away from leaking every code. Redemption already runs
// server-side with the service_role key for exactly this reason, so issuing
// does too. The browser never touches the table.
//
// POST { action: "list" }                        → { codes: [...] }
// POST { action: "create", email, tier }         → { code, expires, durationDays }
// POST { action: "delete", id }                  → { ok: true }
// Auth: Authorization: Bearer <supabase access token>, and the caller must be
// an admin (profiles.is_admin, or ADMIN_EMAILS as a fallback).
//
// Required env: SUPABASE_URL, SUPABASE_SERVICE_KEY. Optional: ADMIN_EMAILS.
// ─────────────────────────────────────────────────────────────────────────────

const { requireUser, clientIp, rateLimit } = require("./_shared/auth");
const { report } = require("./_shared/report");

// Durations live here, not in the request. The client used to send both the
// tier and the day count, so a crafted call could have issued itself 36500
// days of Annual.
const TIERS = {
  monthly: { label: "SoulGainz Monthly", days: 30 },
  annual:  { label: "SoulGainz Annual",  days: 365 },
};
const REDEEM_WINDOW_DAYS = 30;

const CORS = {
  "Access-Control-Allow-Origin": "https://soulgainz.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};
const json = (statusCode, body) => ({ statusCode, headers: CORS, body: JSON.stringify(body) });

// The code the recipient types. No I, O, 0 or 1 — they are indistinguishable in
// most fonts and this gets read off a phone screen and typed by hand.
function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "SG-";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Date-only, in the admin's local timezone, NOT toISOString().
// The admin is in Qatar (UTC+3): an evening-issued code serialised to UTC lost
// a day, so the recipient's "redeem by" was one day earlier than the 30 they
// were promised — and the redeem check compares against local end-of-day, so
// the code died a full day early.
function localDateKey(d, offsetMinutes) {
  const shifted = new Date(d.getTime() - (offsetMinutes || 0) * 60000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  // Issuing a code grants a paid tier, so the endpoint is rate limited even
  // though it is admin-only — a stolen session should not be able to mint
  // hundreds of codes in a loop.
  const rl = await rateLimit(`adminpromo:${clientIp(event)}`, { max: 60, windowMs: 900000 });
  if (!rl.ok) return json(429, { error: "Too many requests. Please try again shortly." });

  const auth = await requireUser(event);
  if (auth.error) return json(auth.status, { error: auth.error });
  const { user, supabase } = auth;

  // Admin check: the profiles flag first (same source of truth as the recipe
  // release panel), with ADMIN_EMAILS as a fallback so the master account still
  // works if the flag has not been set.
  let isAdmin = false;
  try {
    const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    isAdmin = !!(prof && prof.is_admin);
  } catch (e) { console.error("admin-promo-codes: profile lookup failed:", e.message); }
  if (!isAdmin) {
    const allow = (process.env.ADMIN_EMAILS || "dejan.zerafa@icloud.com")
      .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    isAdmin = allow.includes((user.email || "").toLowerCase());
  }
  // Deliberately the same 403 and no detail — an admin-only endpoint should not
  // tell an attacker whether they guessed a real admin.
  if (!isAdmin) return json(403, { error: "Forbidden" });

  let payload;
  try { payload = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid JSON" }); }

  const action = String(payload.action || "").toLowerCase();

  try {
    // ── list ────────────────────────────────────────────────────────────────
    if (action === "list") {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*, redemptions(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json(200, { codes: data || [] });
    }

    // ── create ──────────────────────────────────────────────────────────────
    if (action === "create") {
      const email = String(payload.email || "").trim().toLowerCase();
      const tier = String(payload.tier || "").trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email))
        return json(400, { error: "Enter a valid recipient email address" });
      if (!TIERS[tier]) return json(400, { error: "Unknown tier" });

      const days = TIERS[tier].days;
      const redeemBy = new Date();
      redeemBy.setDate(redeemBy.getDate() + REDEEM_WINDOW_DAYS);
      // The browser sends its own offset so the redeem-by date matches the day
      // the admin sees on screen; anything unparseable falls back to UTC.
      const off = Number.isFinite(+payload.tzOffsetMinutes) ? +payload.tzOffsetMinutes : 0;
      const expires = localDateKey(redeemBy, off);

      // Retry on the unique constraint rather than trusting 32^6 to be unique.
      let code = null, lastErr = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = genCode();
        const { error } = await supabase.from("promo_codes").insert({
          code: candidate,
          tier,
          expires,
          label: email,
          duration_days: days,
          created_by: user.id,
          active: true,
        });
        if (!error) { code = candidate; break; }
        lastErr = error;
        if (!/duplicate key|unique constraint/i.test(error.message || "")) break;
      }
      if (!code) {
        await report("admin-promo-codes", "could not issue a promo code", { tier, error: lastErr && lastErr.message });
        return json(500, { error: (lastErr && lastErr.message) || "Could not issue the code" });
      }
      return json(200, { code, expires, durationDays: days, tierLabel: TIERS[tier].label });
    }

    // ── delete ──────────────────────────────────────────────────────────────
    if (action === "delete") {
      const id = String(payload.id || "");
      if (!id) return json(400, { error: "Missing id" });
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
      return json(200, { ok: true });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    console.error("admin-promo-codes:", e.message);
    await report("admin-promo-codes", "promo code admin action failed", { action, error: e.message });
    return json(500, { error: e.message || "Request failed" });
  }
};
