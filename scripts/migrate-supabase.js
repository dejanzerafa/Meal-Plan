#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// SoulGainz — Supabase Migration Runner
// Usage:
//   SUPABASE_URL=https://xxx.supabase.co \
//   SUPABASE_SERVICE_KEY=eyJ... \
//   node scripts/migrate-supabase.js
//
// What it does:
//   Runs the SQL in analytics.sql via Supabase's pg REST endpoint.
//   Creates the `events` table + indexes, adds calc_used column to users.
// ─────────────────────────────────────────────────────────────────────────────

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars first.');
  console.error('    e.g. SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node scripts/migrate-supabase.js');
  process.exit(1);
}

// Individual SQL statements to run in order
const STATEMENTS = [
  {
    name: 'Create events table',
    sql: `CREATE TABLE IF NOT EXISTS events (
  id bigserial PRIMARY KEY,
  session_id text,
  email text,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
)`,
  },
  {
    name: 'Index: email',
    sql: `CREATE INDEX IF NOT EXISTS events_email_idx ON events(email)`,
  },
  {
    name: 'Index: event_name',
    sql: `CREATE INDEX IF NOT EXISTS events_name_idx ON events(event_name)`,
  },
  {
    name: 'Index: created_at',
    sql: `CREATE INDEX IF NOT EXISTS events_created_idx ON events(created_at DESC)`,
  },
  {
    name: 'Index: session_id',
    sql: `CREATE INDEX IF NOT EXISTS events_session_idx ON events(session_id)`,
  },
  {
    name: 'Add calc_used to users',
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS calc_used boolean DEFAULT false`,
  },
];

// ── Supabase RPC helper ───────────────────────────────────────────────────────
function runSQL(sql) {
  const host = new URL(SUPABASE_URL).hostname;
  const body = JSON.stringify({ query: sql });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey':          SUPABASE_KEY,
        'Authorization':   `Bearer ${SUPABASE_KEY}`,
        'Content-Type':    'application/json',
        'Content-Length':  Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        // Supabase returns 200 on success, non-200 on error
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true });
        } else {
          // Try pg_query fallback
          resolve({ ok: false, status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Fallback: use Supabase's pg endpoint directly
function runSQLDirect(sql) {
  const host = new URL(SUPABASE_URL).hostname;
  const body = JSON.stringify({ query: sql });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host,
      path: '/pg/query',
      method: 'POST',
      headers: {
        'apikey':         SUPABASE_KEY,
        'Authorization':  `Bearer ${SUPABASE_KEY}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error || res.statusCode >= 400) {
            reject(new Error(json.error || json.message || data));
          } else {
            resolve({ ok: true });
          }
        } catch(e) {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve({ ok: true });
          else reject(new Error(data));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n🗄️   Running Supabase migrations...\n');

  for (const stmt of STATEMENTS) {
    process.stdout.write(`  ${stmt.name}... `);
    try {
      await runSQLDirect(stmt.sql);
      console.log('✅');
    } catch (err) {
      // If the error is "already exists" or "duplicate" that's fine
      const msg = err.message || '';
      if (/already exists|duplicate/i.test(msg)) {
        console.log('⏭️  (already exists)');
      } else {
        console.log(`⚠️  ${msg}`);
        console.log(`\n   ℹ️  If the above failed, run this SQL manually in Supabase dashboard:`);
        console.log(`      ${stmt.sql}\n`);
      }
    }
  }

  console.log('\n✅  Migration complete!\n');
  console.log('Useful queries to verify:');
  console.log('  SELECT count(*) FROM events;');
  console.log('  SELECT column_name FROM information_schema.columns WHERE table_name = \'users\' AND column_name = \'calc_used\';\n');
})().catch(err => {
  console.error('❌  Fatal:', err.message);
  process.exit(1);
});
