// netlify/functions/save-user.js
// Called from the app's AccountCard when user saves their profile.
// 1. Upserts user in Supabase
// 2. Adds contact to Resend Audience
// 3. Sends welcome email on first save (idempotent via welcome_sent flag)
//
// Required env vars:
//   SUPABASE_URL        — https://xxxx.supabase.co
//   SUPABASE_ANON_KEY   — eyJhbGci...
//   RESEND_API_KEY      — re_xxxx...
//   RESEND_AUDIENCE_ID  — (from Resend → Audiences)
//   URL                 — set automatically by Netlify (your site URL)

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email, first_name, last_name, marketing_opt_in = true } = payload;

  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const siteUrl = process.env.URL || process.env.APP_URL || "https://soulgainz.app";

  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase not configured — skipping");
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  try {
    // ── 1. Upsert user in Supabase ──────────────────────────────────────────
    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        marketing_opt_in,
        updated_at: new Date().toISOString(),
      }),
    });

    let userData = null;
    if (upsertRes.ok) {
      const rows = await upsertRes.json();
      userData = Array.isArray(rows) ? rows[0] : rows;
    } else {
      const err = await upsertRes.text();
      console.error("Supabase upsert error:", err);
    }

    // ── 2. Add / update contact in Resend Audience ──────────────────────────
    // Resolve audience ID — use env var if set, otherwise fetch the first audience
    let resolvedAudienceId = audienceId;
    if (resendKey && !resolvedAudienceId && marketing_opt_in) {
      try {
        const audRes = await fetch("https://api.resend.com/audiences", {
          headers: { "Authorization": `Bearer ${resendKey}` },
        });
        if (audRes.ok) {
          const audData = await audRes.json();
          resolvedAudienceId = audData?.data?.[0]?.id;
        }
      } catch (e) {
        console.error("Fetch audiences error:", e);
      }
    }

    if (resendKey && resolvedAudienceId && marketing_opt_in) {
      fetch(`https://api.resend.com/audiences/${resolvedAudienceId}/contacts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: first_name || "",
          last_name: last_name || "",
          unsubscribed: false,
        }),
      }).catch((e) => console.error("Resend audience error:", e));
    }

    // ── 3. Send welcome email (first save only) ─────────────────────────────
    const alreadySent = userData?.welcome_sent;
    if (!alreadySent && resendKey) {
      const fullName = [first_name, last_name].filter(Boolean).join(" ");
      const welcomeRes = await fetch(
        `${siteUrl}/.netlify/functions/send-welcome`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: fullName }),
        }
      );

      if (welcomeRes.ok) {
        // Mark welcome_sent so we never double-send
        await fetch(
          `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ welcome_sent: true }),
          }
        ).catch((e) => console.error("Mark welcome_sent error:", e));
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("save-user error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
