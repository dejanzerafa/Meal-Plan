// netlify/functions/_shared/report.js
//
// Server-side error reporting for the Netlify functions. Posts straight to
// Sentry's envelope API with fetch — no SDK, no dependency, nothing to bundle.
//
// WHY: before this, every failure in the functions was console.error into a
// Netlify log nobody watches. stripe-webhook wrote "UNMATCHED PURCHASE —
// manual grant required" there when a customer had paid and no tier could be
// granted, and the only way anyone would learn of it was the complaint.
//
// Configure with SENTRY_DSN in the app site's Netlify env (any project; the
// client uses a separate loader key). Unset → every call is a no-op after the
// console line, so nothing here can break a function that was working.
//
//   const { report } = require("./_shared/report");
//   await report("stripe-webhook", err, { eventType, sessionId });
//   await report("stripe-webhook", "UNMATCHED PURCHASE", { email }, "fatal");
//
// Never throws. Never waits more than ~2.5 s.

const VERSION = "soulgainz-fn/1.0";

function parseDsn(dsn) {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\/+/, "");
    if (!u.username || !projectId) return null;
    return { key: u.username, host: u.host, projectId, protocol: u.protocol };
  } catch (_) { return null; }
}

function frames(err) {
  const stack = (err && err.stack) ? String(err.stack) : "";
  const out = [];
  for (const line of stack.split("\n").slice(1)) {
    const m = /at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/.exec(line.trim());
    if (!m) continue;
    out.push({ function: m[1] || "?", filename: m[2], lineno: +m[3], colno: +m[4], in_app: !/node_modules/.test(m[2]) });
  }
  return out.reverse();   // Sentry wants oldest first
}

async function report(fn, errOrMessage, extra = {}, level) {
  const isErr = errOrMessage instanceof Error;
  const message = isErr ? errOrMessage.message : String(errOrMessage);
  // Always log, so Netlify's own log still has it even with no DSN.
  console.error(`[${fn}]`, message, extra && Object.keys(extra).length ? JSON.stringify(extra) : "");

  const dsn = parseDsn(process.env.SENTRY_DSN || "");
  if (!dsn) return false;

  const eventId = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  const now = new Date().toISOString();
  const event = {
    event_id: eventId,
    timestamp: now,
    platform: "node",
    level: level || (isErr ? "error" : "warning"),
    logger: fn,
    server_name: "netlify-functions",
    environment: process.env.CONTEXT === "production" ? "production" : (process.env.CONTEXT || "dev"),
    release: process.env.COMMIT_REF ? `soulgainz@${String(process.env.COMMIT_REF).slice(0, 8)}` : undefined,
    tags: { function: fn, site: process.env.SITE_NAME || "soulgainz" },
    // Scrub: never ship a full email or any secret-looking value.
    extra: Object.fromEntries(Object.entries(extra || {}).map(([k, v]) => {
      if (v == null) return [k, v];
      let s = typeof v === "string" ? v : JSON.stringify(v);
      s = s.replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+)/g, "$1***$2");
      s = s.replace(/\b(sk|rk|whsec|re)_[A-Za-z0-9_]{6,}\b/g, "[redacted]");
      return [k, s.length > 2000 ? s.slice(0, 2000) + "…" : s];
    })),
    ...(isErr
      ? { exception: { values: [{ type: errOrMessage.name || "Error", value: message, stacktrace: { frames: frames(errOrMessage) } }] } }
      : { message: { formatted: message } }),
  };

  const envelope =
    JSON.stringify({ event_id: eventId, sent_at: now, dsn: process.env.SENTRY_DSN }) + "\n" +
    JSON.stringify({ type: "event" }) + "\n" +
    JSON.stringify(event) + "\n";

  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 2500) : null;
  try {
    const r = await fetch(`${dsn.protocol}//${dsn.host}/api/${dsn.projectId}/envelope/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsn.key}, sentry_client=${VERSION}`,
      },
      body: envelope,
      signal: ctrl ? ctrl.signal : undefined,
    });
    return r.ok;
  } catch (_) {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

module.exports = { report };
