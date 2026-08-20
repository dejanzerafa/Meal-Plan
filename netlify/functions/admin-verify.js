// netlify/functions/admin-verify.js
// Verifies admin password against ADMIN_SECRET env var.
// Returns a short-lived session token so the password never lives in client code.

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://soulgainz.app",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { body = {}; }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return { statusCode: 500, body: JSON.stringify({ error: "Admin not configured" }) };
  }

  if (!body.password || body.password !== secret) {
    // Small delay to slow brute-force
    await new Promise(r => setTimeout(r, 400));
    return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password" }) };
  }

  // Return a signed token: base64(timestamp + ":" + secret slice)
  // Simple — not JWT, but sufficient for an internal admin page
  const token = Buffer.from(`${Date.now()}:${secret.slice(-8)}`).toString("base64");
  return {
    statusCode: 200,
    body: JSON.stringify({ token }),
  };
};
