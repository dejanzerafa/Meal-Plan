// netlify/functions/report-test.js
//
// Proves the server-side error path end to end: env var present → envelope
// accepted by Sentry. Nothing else on a normal request path errors on demand.
//
// POST with Authorization: Bearer <CRON_SECRET>. Returns
//   { configured: bool, delivered: bool }
// Rate-limited and secret-gated so it cannot be used to spam the project.

const { secretsMatch, rateLimit, clientIp } = require("./_shared/auth");
const { report } = require("./_shared/report");

exports.handler = async (event) => {
  const h = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: h, body: JSON.stringify({ error: "Method not allowed" }) };
  if (!(await rateLimit(`reporttest_${clientIp(event)}`, { max: 5, windowMs: 600000 })).ok) {
    return { statusCode: 429, headers: h, body: JSON.stringify({ error: "Too many requests" }) };
  }
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!secretsMatch(token, process.env.CRON_SECRET || "")) {
    return { statusCode: 401, headers: h, body: JSON.stringify({ error: "Unauthorized" }) };
  }
  const configured = !!process.env.SENTRY_DSN;
  const delivered = configured
    ? await report("report-test", "Sentry wiring check — safe to resolve", { at: new Date().toISOString() }, "info")
    : false;
  return { statusCode: 200, headers: h, body: JSON.stringify({ configured, delivered }) };
};
