// netlify/functions/migrate-waitlist.js
// ─────────────────────────────────────────────────────────────────────────────
// Admin-only: syncs waitlist entries (users table) into auth.users + profiles.
//
// WHAT IT DOES:
//   1. Reads all rows from the `users` waitlist table.
//   2. For each email, checks if an auth.users account already exists.
//   3. If yes  → ensures the `profiles` row has first_name/last_name from waitlist.
//   4. If no   → optionally sends a Supabase invite so they can set a password.
//
// HOW TO RUN:
//   POST /.netlify/functions/migrate-waitlist
//   Headers: { "x-admin-key": "<ADMIN_MIGRATION_KEY env var>" }
//   Body:    { "dry_run": true }   ← set false to actually send invites / write data
//
// WHEN TO RUN:
//   Run once just before launch. After launch, remove or gate this endpoint.
//   The waitlist table (`users`) can remain as a marketing/email list.
//
// Required env vars:
//   SUPABASE_URL            — https://xxx.supabase.co
//   SUPABASE_SERVICE_KEY    — service_role key
//   ADMIN_MIGRATION_KEY     — a secret you set; gate this endpoint
//   APP_URL                 — https://soulgainz.app (used in invite emails)
// ─────────────────────────────────────────────────────────────────────────────

const { clientIp, rateLimit, secretsMatch } = require("./_shared/auth");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  // Mails the entire waitlist on success.
  {
    const _rl = await rateLimit(`migratewl:${clientIp(event)}`, { max: 3, windowMs: 3600000 });
    if (!_rl.ok) {
      return { statusCode: 429, headers: (typeof corsHeaders !== "undefined" ? corsHeaders : {}),
               body: JSON.stringify({ error: "Too many requests. Please try again shortly." }) };
    }
  }

  // ── Auth gate ───────────────────────────────────────────────────────────────
  const adminKey = process.env.ADMIN_MIGRATION_KEY;
  if (!adminKey || !secretsMatch(event.headers["x-admin-key"], adminKey)) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "POST only" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const appUrl      = process.env.APP_URL || "https://soulgainz.app";

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Supabase not configured" }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) {}
  const dryRun      = body.dry_run !== false; // default: dry run
  const sendInvites = body.send_invites === true && !dryRun;

  const sb = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results = {
    dry_run:         dryRun,
    send_invites:    sendInvites,
    total_waitlist:  0,
    already_have_account: [],
    profiles_updated:     [],
    invited:              [],
    errors:               [],
  };

  try {
    // ── 1. Read all waitlist entries ─────────────────────────────────────────
    const { data: waitlistUsers, error: wErr } = await sb
      .from("users")
      .select("email, first_name, last_name, created_at, welcome_sent, calc_used")
      .order("created_at", { ascending: true });

    if (wErr) throw new Error(`Waitlist read error: ${wErr.message}`);
    results.total_waitlist = waitlistUsers?.length || 0;

    for (const wUser of (waitlistUsers || [])) {
      const email    = wUser.email?.toLowerCase().trim();
      const firstName = wUser.first_name || null;
      const lastName  = wUser.last_name  || null;
      if (!email) continue;

      try {
        // ── 2. Check if auth account exists ──────────────────────────────────
        // `admin.getUserByEmail` does not exist in supabase-js v2 (verified:
        // typeof is undefined). Calling it threw "not a function", and the
        // trailing `.catch()` could not rescue it because the throw happened
        // first — so this whole migration aborted on its first row. v2 exposes
        // listUsers, which does not filter by email, so match on the page.
        let existingUser = null;
        try {
          const { data: listed, error: listErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
          if (listErr) console.error("listUsers failed:", listErr.message);
          const needle = email.toLowerCase();
          existingUser = (listed?.users || []).find(u => (u.email || "").toLowerCase() === needle) || null;
        } catch (e) {
          console.error("auth lookup failed for", email, e.message);
        }

        if (existingUser) {
          // ── 3a. User has account → sync name to profiles if missing ────────
          results.already_have_account.push(email);

          if (!dryRun && (firstName || lastName)) {
            const { data: profileRow } = await sb
              .from("profiles")
              .select("id, first_name, last_name")
              .eq("id", existingUser.id)
              .single();

            if (profileRow && (!profileRow.first_name || !profileRow.last_name)) {
              await sb.from("profiles").update({
                first_name: profileRow.first_name || firstName,
                last_name:  profileRow.last_name  || lastName,
                updated_at: new Date().toISOString(),
              }).eq("id", existingUser.id);
              results.profiles_updated.push(email);
            } else if (!profileRow) {
              // No profile row at all — create stub
              await sb.from("profiles").insert({
                id:           existingUser.id,
                email:        email,
                first_name:   firstName,
                last_name:    lastName,
                onboarded_at: new Date().toISOString(),
                updated_at:   new Date().toISOString(),
              });
              results.profiles_updated.push(email);
            }
          }

        } else if (sendInvites) {
          // ── 3b. No account → send Supabase invite ─────────────────────────
          const { error: invErr } = await sb.auth.admin.inviteUserByEmail(email, {
            data: {
              first_name: firstName,
              last_name:  lastName,
              invited_from: "waitlist_migration",
            },
            redirectTo: `${appUrl}/?onboarded=invited`,
          });
          if (invErr) {
            results.errors.push({ email, error: invErr.message });
          } else {
            results.invited.push(email);
          }
        }

      } catch (userErr) {
        results.errors.push({ email, error: userErr.message });
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(results, null, 2),
    };

  } catch (err) {
    console.error("migrate-waitlist error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, ...results }),
    };
  }
};
