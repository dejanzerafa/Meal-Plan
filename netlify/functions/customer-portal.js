// netlify/functions/customer-portal.js
// Creates a Stripe Billing Portal session for an authenticated user.
// The portal lets users upgrade, downgrade, cancel, and update payment details.
//
// Required env vars:
//   STRIPE_SECRET_KEY      — sk_live_... or sk_test_...
//   SUPABASE_URL           — https://xxx.supabase.co
//   SUPABASE_SERVICE_KEY   — service_role key
//   APP_URL                — https://soulgainz.app

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
  "https://soulgainz.netlify.app",
  "http://localhost",
  "http://127.0.0.1",
];

exports.handler = async (event) => {
  const requestOrigin = (event.headers?.origin || event.headers?.Origin || "");
  const corsOrigin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : "https://soulgainz.app";

  const corsHeaders = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method not allowed" };
  }

  // ── Auth: require Supabase JWT ────────────────────────────────────────────
  const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Unauthorized — please sign in first" }) };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Supabase not configured" }) };
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Stripe not configured" }) };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const appUrl = process.env.APP_URL || "https://soulgainz.app";

  // ── Verify token ──────────────────────────────────────────────────────────
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Invalid or expired session — please sign in again" }) };
  }

  // ── Look up Stripe customer ID via users table ────────────────────────────
  const { data: userData, error: userErr } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("email", user.email)
    .maybeSingle();

  if (userErr) {
    console.error("User lookup error:", userErr);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Failed to look up account" }) };
  }

  if (!userData?.stripe_customer_id) {
    // No Stripe customer yet — user never completed a checkout
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "No active subscription found. If you believe this is wrong, email support@soulgainz.app"
      })
    };
  }

  // ── Create Stripe Billing Portal session ─────────────────────────────────
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      // Return them to the app's ME tab, where their (possibly changed) tier is
      // displayed. Previously returned to /pricing, which showed a member who
      // had just cancelled a page trying to sell them a plan.
      return_url: `${appUrl}/index.html?tab=me`,
    });

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ url: portalSession.url }),
    };
  } catch (err) {
    console.error("Stripe portal error:", err);
    // Billing portal may not be configured in Stripe dashboard
    if (err.code === "resource_missing") {
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Billing portal not configured. Email support@soulgainz.app to manage your subscription."
        })
      };
    }
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
