#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// SoulGainz — Create Annual Stripe Price
// Usage:  STRIPE_SECRET_KEY=sk_live_xxx node scripts/create-annual-price.js
//
// What it does:
//   1. Creates a Stripe Product "SoulGainz Annual"
//   2. Creates a recurring Price at $89.99/year
//   3. Prints the price ID
//   4. Auto-patches index.html  replacing "price_annual_placeholder"
// ─────────────────────────────────────────────────────────────────────────────

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error('❌  Set STRIPE_SECRET_KEY env var first.\n    e.g. STRIPE_SECRET_KEY=sk_live_xxx node scripts/create-annual-price.js');
  process.exit(1);
}

// ── Stripe REST helper (no SDK needed) ───────────────────────────────────────
function stripePost(path, params) {
  const body = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.stripe.com',
      path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.error) reject(new Error(`Stripe error: ${json.error.message}`));
        else resolve(json);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n📦  Creating SoulGainz Annual product + price on Stripe...\n');

  // 1. Create product
  const product = await stripePost('/v1/products', {
    name:        'SoulGainz Annual',
    description: 'All recipes + future drops · 12-month subscription · Save 50% vs monthly',
    'metadata[tier]': 'annual',
  });
  console.log(`✅  Product created: ${product.id}  (${product.name})`);

  // 2. Create recurring price at $89.99/year
  const price = await stripePost('/v1/prices', {
    product:               product.id,
    unit_amount:           '8999',        // $89.99 in cents
    currency:              'usd',
    'recurring[interval]': 'year',
    'recurring[interval_count]': '1',
    'metadata[tier]':      'annual',
  });
  console.log(`✅  Price created:   ${price.id}  ($${price.unit_amount / 100}/year)\n`);

  // 3. Patch index.html
  const indexPath = path.join(__dirname, '..', 'index.html');
  const src = fs.readFileSync(indexPath, 'utf8');
  if (src.includes('price_annual_placeholder')) {
    const patched = src.replace('price_annual_placeholder', price.id);
    fs.writeFileSync(indexPath, patched, 'utf8');
    console.log(`✅  index.html patched — "price_annual_placeholder" → "${price.id}"`);
  } else if (src.includes(price.id)) {
    console.log(`ℹ️   index.html already has this price ID — no change needed.`);
  } else {
    console.log(`⚠️   Could not auto-patch index.html. Update STRIPE_PRICES.annual manually:\n    annual: "${price.id}",`);
  }

  console.log('\n─────────────────────────────────────────────────────');
  console.log(`PRICE ID:  ${price.id}`);
  console.log('─────────────────────────────────────────────────────');
  console.log('\nNext steps:');
  console.log('  1. git add index.html && git commit -m "Add annual Stripe price ID"');
  console.log('  2. git push origin main');
  console.log('  3. Run node scripts/migrate-supabase.js to set up analytics table\n');
})().catch(err => {
  console.error('❌ ', err.message);
  process.exit(1);
});
