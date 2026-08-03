// netlify/functions/track-event.js
// Logs analytics events to Supabase events table.
// POST { event_name, session_id?, email?, properties? }
// Fire-and-forget safe — always returns 200 so client failures don't matter.

// ── Allowed origins ───────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
  "https://soulgainz.netlify.app",
  "http://localhost",
  "http://127.0.0.1",
];

// ── Allowed event names — whitelist prevents DB spam with arbitrary strings ───
const ALLOWED_EVENTS = new Set([
  "page_view",
  "signup",
  "signup_error",
  "calc_open",
  "calc_complete",
  "calc_used",
  "calc_email_captured",
  "calc_app_opened",
  "recipe_view",
  "recipe_unlock_click",
  "checkout_start",
  "checkout_cancel",
  "checkout_success",
  "subscription_start",
  "restore_account_click",
  "restore_account_success",
  "restore_account_not_found",
  "push_subscribe",
  "push_denied",
  "app_install",
  "app_open",
  "tab_switch",
  "filter_change",
  "search",
]);

// ── IP rate limit: max 60 events per IP per minute ────────────────────────────
const _ipRateMap = new Map();
function _checkIpRateLimit(ip) {
  if (!ip) return true;
  const now = Date.now();
  const entry = _ipRateMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 60000) {
    _ipRateMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= 60) return false;
  entry.count++;
  _ipRateMap.set(ip, entry);
  return true;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  // ── Payload size guard (reject > 4 KB) ──────────────────────────────────
  if (event.body && event.body.length > 4096) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  // ── Origin check ─────────────────────────────────────────────────────────
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  if (origin && !ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  // ── IP rate limit ─────────────────────────────────────────────────────────
  const clientIp = (event.headers && (
    event.headers["x-forwarded-for"] ||
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["client-ip"]
  ) || "").split(",")[0].trim();
  if (!_checkIpRateLimit(clientIp)) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };

  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch(e) { return { statusCode: 200, body: JSON.stringify({ ok: true }) }; }

  const { event_name, session_id, email, properties } = payload;

  // ── Validate event name against whitelist ─────────────────────────────────
  if (!event_name || !ALLOWED_EVENTS.has(event_name)) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  // ── Sanitise fields ───────────────────────────────────────────────────────
  const safeSessionId = typeof session_id === 'string' ? session_id.slice(0, 128) : null;
  const safeEmail = typeof email === 'string' && email.includes('@') ? email.slice(0, 254).toLowerCase() : null;
  // properties must be an object (not array/string) and max 2 KB serialised
  let safeProps = {};
  if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
    const serialised = JSON.stringify(properties);
    if (serialised.length <= 2048) safeProps = properties;
  }

  try {
    await fetch(`${supabaseUrl}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        event_name,
        session_id: safeSessionId,
        email: safeEmail,
        properties: safeProps,
        created_at: new Date().toISOString(),
      }),
    });
  } catch(e) { console.error('track-event error:', e.message); }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
