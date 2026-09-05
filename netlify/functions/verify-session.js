// netlify/functions/verify-session.js
//
// Called by marketing.soulgainz.app/success after Stripe redirects the buyer
// back. Confirms the Checkout Session is actually PAID before the success page
// says so, and returns the tier + buyer email so the page can hand the user to
// the app.
//
// This function existed with zero callers for months. success.html read `tier`
// from the query string and rendered "You're in! Your subscription is active"
// unconditionally — a page that anyone could reach by typing the URL, and
// that told a customer whose card was declined that they were in.
//
// GET ?session_id=cs_...
// → { paid: true,  tier, email, customerId }
// → { paid: false, status }               (unpaid / expired / declined)

const { rateLimit, clientIp } = require("./_shared/auth");
const Stripe = require("stripe");

const ALLOWED_ORIGINS = [
  "https://soulgainz.app",
  "https://www.soulgainz.app",
  "https://marketing.soulgainz.app",
  "https://soulgainz.netlify.app",
];
const _isLocalOrigin = o => process.env.CONTEXT !== "production" &&
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || "");

// Only these are sold. create-checkout.js fails closed on anything else, so a
// session carrying any other tier did not come from our checkout.
const SOLD_TIERS = new Set(["monthly", "annual"]);

exports.handler = async (event) => {
  // The caller is the MARKETING origin, not the app's. Without an explicit
  // Access-Control-Allow-Origin on every response — not just the preflight —
  // the browser blocks the JSON and the success page can never learn the
  // payment went through. create-checkout.js learned this the hard way.
  const requestOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  const corsOrigin = (ALLOWED_ORIGINS.includes(requestOrigin) || _isLocalOrigin(requestOrigin))
    ? requestOrigin : "https://marketing.soulgainz.app";
  const headers = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json",
    // Never cache a payment verdict.
    "Cache-Control": "no-store",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Max-Age": "86400" }, body: "" };
  }
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Session ids appear in success_url, so they leak via referrer, history and
  // analytics. Rate-limit by IP so a leaked id cannot be used to enumerate.
  {
    const _rl = await rateLimit(`verifysession:${clientIp(event)}`, { max: 10, windowMs: 60000 });
    if (!_rl.ok) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: "Too many requests. Please try again shortly." }) };
    }
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Stripe not configured" }) };
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const sessionId = event.queryStringParameters?.session_id;
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "session_id required" }) };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return { statusCode: 200, headers, body: JSON.stringify({ paid: false, status: session.payment_status }) };
    }

    const tier = session.metadata?.tier || null;
    if (!SOLD_TIERS.has(tier)) {
      console.error("verify-session: paid session with unknown tier", sessionId, tier);
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, tier: null, email: session.customer_details?.email || null }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        paid: true,
        tier,
        email: session.customer_details?.email || null,
        customerId: session.customer || null,
        // The auth user the session was opened for. The success page compares
        // this against its own signed-in user before handing tokens to the app,
        // so a session id pasted into another browser cannot carry someone
        // else's login across.
        userId: session.metadata?.userId || null,
      }),
    };
  } catch (err) {
    console.error("verify-session error:", err);
    // Do not echo err.message — Stripe's wording reveals whether the id exists.
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Could not verify payment" }) };
  }
};
