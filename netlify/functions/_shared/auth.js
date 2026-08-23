// netlify/functions/_shared/auth.js
// Shared auth + abuse-control helpers.
//
// Created during the full security review. Three problems recurred across the
// function set and are solved once here:
//
//   1. Admin secrets compared with `!==`, which short-circuits on the first
//      differing byte and leaks length/prefix information under timing analysis.
//   2. Rate limiters keyed on `x-forwarded-for`, which the CALLER supplies —
//      Netlify appends rather than replaces, so taking [0] takes the attacker's
//      value. Rotating it defeats the limit entirely.
//   3. In-memory Map rate limiters, which are per-container and reset on every
//      cold start, so they never really applied.

const crypto = require("crypto");

// ── Timing-safe secret comparison ────────────────────────────────────────────
// Hash both sides first so timingSafeEqual always gets equal-length buffers
// (it throws otherwise, and the throw itself would leak length).
function secretsMatch(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string") return false;
  if (!provided || !expected) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// ── Real client IP ───────────────────────────────────────────────────────────
// `x-nf-client-connection-ip` is set by Netlify's edge and cannot be spoofed by
// the caller. `x-forwarded-for` can be, so it is only a last resort.
function clientIp(event) {
  const h = event.headers || {};
  return (
    h["x-nf-client-connection-ip"] ||
    h["client-ip"] ||
    (h["x-forwarded-for"] || "").split(",").pop()?.trim() ||   // last hop, not first
    ""
  );
}

// ── Cross-instance rate limit (Netlify Blobs) ────────────────────────────────
// Falls back to allowing the request if Blobs is unavailable, so a storage
// outage cannot take checkout down — availability beats strictness here, and
// every caller of this also has other guards.
async function rateLimit(key, { max = 5, windowMs = 900000 } = {}) {
  if (!key) return { ok: true };
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("ratelimit");
    const id = `rl_${crypto.createHash("sha256").update(key).digest("hex").slice(0, 32)}`;
    const now = Date.now();

    let entry = null;
    try { entry = await store.get(id, { type: "json" }); } catch (_) {}

    if (!entry || now - entry.start > windowMs) {
      await store.setJSON(id, { count: 1, start: now });
      return { ok: true, remaining: max - 1 };
    }
    if (entry.count >= max) {
      return { ok: false, retryAfter: Math.ceil((entry.start + windowMs - now) / 1000) };
    }
    await store.setJSON(id, { count: entry.count + 1, start: entry.start });
    return { ok: true, remaining: max - entry.count - 1 };
  } catch (err) {
    console.warn("rateLimit unavailable, allowing request:", err.message);
    return { ok: true };
  }
}

// ── Verify a Supabase JWT and return the user ────────────────────────────────
// Returns { user } or { error, status }. Never trust a caller-supplied user id —
// always use the id/email off the returned user object.
async function requireUser(event) {
  const h = event.headers || {};
  const authHeader = h.authorization || h.Authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "Unauthorized — please sign in", status: 401 };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return { error: "Auth not configured", status: 500 };

  try {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(url, key);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { error: "Invalid or expired session", status: 401 };
    return { user, supabase };
  } catch (err) {
    console.error("requireUser failed:", err.message);
    return { error: "Auth check failed", status: 500 };
  }
}

// ── HTML escaping for anything interpolated into an outbound email ───────────
const escHtml = v => String(v == null ? "" : v)
  .replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = { secretsMatch, clientIp, rateLimit, requireUser, escHtml };
