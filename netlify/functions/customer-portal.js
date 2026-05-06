// netlify/functions/customer-portal.js
// Generates a Stripe Customer Portal URL so users can cancel/update payments.
// User passes their email; we look up Stripe customer ID + create portal session.

const Stripe = require("stripe");

exports.handler = async (event) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return { statusCode: 500, body: "Stripe not configured" };
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const email = event.queryStringParameters?.email;
  if (!email) return { statusCode: 400, body: "email required" };

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "No Stripe account for this email" }) };
    }
    const customer = customers.data[0];
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: process.env.APP_URL || "https://dejan-mealplan.netlify.app",
    });

    return {
      statusCode: 302,
      headers: { Location: session.url },
      body: "",
    };
  } catch (err) {
    console.error("Portal error:", err);
    return { statusCode: 500, body: err.message };
  }
};
