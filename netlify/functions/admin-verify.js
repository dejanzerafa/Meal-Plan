// netlify/functions/admin-verify.js
// Verifies admin password against ADMIN_SECRET env var.
// Returns a short-lived session token so the password never lives in client code.
//
// Rate limiting: max 10 failed attempts per IP per 15-minute window using Netlify Blobs.
// Requires Netlify Blobs (available automatically on all Netlify plans, no extra config).

const { secretsMatch, clientIp } = require("./_shared/auth");

const { getStore } = require("@netlify/blobs");

const RATE_LIMIT_MAX    = 10;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in ms

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "https://soulgainz.app",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age":       "86400",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return { statusCode: 500, body: JSON.stringify({ error: "Admin not configured" }) };
  }

  // ── IP-based rate limiting ───────────────────────────────────────────────────
  // Same self-referencing-const bug as restore-account had: the local shadowed
  // the imported helper and appeared in its own initialiser.
  const _ip = clientIp(event) || "unknown";

  let store;
  let attempts = { count: 0, windowStart: Date.now() };

  try {
    store = getStore({ name: "admin-rate-limit", consistency: "strong" });
    const stored = await store.get(`ip:${_ip}`, { type: "json" }).catch(() => null);
    if (stored) {
      if (Date.now() - stored.windowStart < RATE_LIMIT_WINDOW) {
        attempts = stored; // still within window
      }
      // else: window expired — start fresh (don't update attempts)
    }
  } catch (_) {
    // Blobs unavailable (e.g. local dev) — degrade gracefully, skip rate limiting
    store = null;
  }

  if (attempts.count >= RATE_LIMIT_MAX) {
    const resetInMs  = RATE_LIMIT_WINDOW - (Date.now() - attempts.windowStart);
    const resetInMin = Math.ceil(resetInMs / 60000);
    return {
      statusCode: 429,
      headers: { "Retry-After": String(resetInMin * 60) },
      body: JSON.stringify({
        error: `Too many failed attempts. Try again in ${resetInMin} minute${resetInMin !== 1 ? "s" : ""}.`,
      }),
    };
  }

  // ── Parse + verify password ─────────────────────────────────────────────────
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { body = {}; }

  if (!secretsMatch(body.password, secret)) {
    // Increment failed-attempt counter
    if (store) {
      try {
        await store.setJSON(`ip:${_ip}`, {
          count:       attempts.count + 1,
          windowStart: attempts.windowStart,
        });
      } catch (_) {}
    }
    // Small sequential delay — combined with rate limiting this stops brute force
    await new Promise(r => setTimeout(r, 400));
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password" }) };
  }

  // ── Success: clear rate limit counter for this IP ───────────────────────────
  if (store) {
    try { await store.delete(`ip:${_ip}`); } catch (_) {}
  }

  // Returns an HMAC of the timestamp, signed with ADMIN_SECRET. NOTE: nothing
  // currently VERIFIES this token — admin.html discards it and gates on a
  // sessionStorage boolean. It is issued for a future server-side check.
  // HMAC, not a slice of the secret. Base64 is encoding, not signing — the old
  // token embedded the last 8 characters of ADMIN_SECRET verbatim, recoverable
  // by anyone who saw it (browser history, proxies, extensions).
  const _ts = Date.now();
  const token = `${_ts}.${require("crypto").createHmac("sha256", secret).update(String(_ts)).digest("hex")}`;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  };
};
