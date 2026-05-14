// netlify/functions/track-event.js
// Logs analytics events to Supabase events table.
// POST { event_name, session_id?, email?, properties? }
// Fire-and-forget safe — always returns 200 so client failures don't matter.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };

  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch(e) { return { statusCode: 200, body: JSON.stringify({ ok: true }) }; }

  const { event_name, session_id, email, properties } = payload;
  if (!event_name) return { statusCode: 200, body: JSON.stringify({ ok: true }) };

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
        session_id: session_id || null,
        email: email || null,
        properties: properties || {},
        created_at: new Date().toISOString(),
      }),
    });
  } catch(e) { console.error('track-event error:', e.message); }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
