// netlify/functions/landing-signup.js
// Captures email signups from the landing page directly into Supabase.
// Replaces (or supplements) Netlify Forms — gives us a unified database.

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email, source } = payload;
  if (!email || !email.includes("@")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
  }

  // Honeypot check (frontend should send botField empty)
  if (payload.botField) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }; // pretend success for bots
  }

  try {
    // Upsert email signup (no user account yet — that comes with payment)
    const { error } = await supabase
      .from("email_signups")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          source: source || "landing-page",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Signup error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
