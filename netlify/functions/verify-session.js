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
// → { paid: true,  tier, sameUser }            (no bearer, or bearer ≠ buyer)
// → { paid: true,  tier, sameUser: true, email } (bearer verified as the buyer)
// → { paid: false, status }               (unpaid / expired / declined)

const { rateLimit, clientIp, requireUser } = require("./_shared/auth");
const { report } = require("./_shared/report");
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
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

  const hasBearer = /^Bearer\s+/i.test((event.headers && (event.headers.authorization || event.headers.Authorization)) || "");
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
      return { statusCode: 200, headers, body: JSON.stringify({ paid: true, tier: null }) };
    }

    // Who is asking? A session id leaks (referrer, history, analytics), so an
    // unauthenticated caller learns only that it was paid and for which tier.
    // With a bearer token the server — not the page — decides whether the
    // caller IS the buyer, by verifying the JWT and comparing its subject to
    // the userId the checkout was opened for. Only then does the buyer's own
    // email come back. Both success pages send their bearer.
    let sameUser = false;
    if (hasBearer) {
      const r = await requireUser(event);
      if (r.error) return { statusCode: r.status, headers, body: JSON.stringify({ error: r.error }) };
      sameUser = !!(session.metadata?.userId && r.user.id === session.metadata.userId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        paid: true,
        tier,
        sameUser,
        ...(sameUser ? { email: session.customer_details?.email || null } : {}),
      }),
    };
  } catch (err) {
    console.error("verify-session error:", err && err.code, err && err.message);
    if (!(err && (err.code === "resource_missing" || err.statusCode === 404))) await report("verify-session", err instanceof Error ? err : new Error(String(err)), { sessionId });
    // Do not echo err.message — Stripe's wording reveals whether the id exists.
    // Stripe answers an unknown id with resource_missing; that is the caller's
    // problem (404), not ours (500), and the success page treats both the same.
    const missing = err && (err.code === "resource_missing" || err.statusCode === 404);
    return { statusCode: missing ? 404 : 500, headers, body: JSON.stringify({ error: "Could not verify payment" }) };
  }
};
