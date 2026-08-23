#!/usr/bin/env node
/**
 * SoulGainz — pre-deploy smoke test for the marketing pricing page.
 *
 * Catches the classes of bug that kept shipping silently:
 *   1. A syntax/runtime error that kills the whole inline <script> block
 *      (symptom: checkout buttons, FAQ and every other handler all dead at once).
 *   2. onclick="..." handlers in the HTML that point at functions which no
 *      longer exist — e.g. after deleting a feature like the plan toggle.
 *   3. Stripe price IDs left in TEST mode at launch (or LIVE during testing).
 *   4. Cache-Control rules scoped to "/*.html" that never match pretty URLs.
 *
 * Run before every marketing-site deploy:
 *     node scripts/smoke-test-pricing.mjs
 *
 * Requires: npm i jsdom
 */

import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'marketing-site', 'pricing.html');
const TOML = path.join(ROOT, 'marketing-site', 'netlify.toml');

// Set to 'live' when launching, 'test' while testing.
const EXPECT_MODE = process.env.STRIPE_MODE || 'test';

const failures = [];
const warnings = [];
const fail = m => failures.push(m);
const warn = m => warnings.push(m);

const html = fs.readFileSync(PAGE, 'utf8');

// ── 1. Execute the page and confirm no fatal script error ────────────────────
const vc = new VirtualConsole();
const jsErrors = [];
vc.on('jsdomError', e => jsErrors.push(e.detail?.message || e.message));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://marketing.soulgainz.app/pricing',
  virtualConsole: vc,
  pretendToBeVisual: true,
});
await new Promise(r => setTimeout(r, 300));
const { window } = dom;

if (jsErrors.length) {
  jsErrors.forEach(e => fail(`Fatal script error: ${e}`));
}

// ── 2. Every inline handler must resolve to a real function ──────────────────
// This is the check that would have caught the dead plan toggle.
const handlerRe = /\bon(?:click|change|submit|input)\s*=\s*"([^"]+)"/g;
const seen = new Set();
// Bare calls only — anything with a dot (event.stopPropagation, location.reload,
// window.location.href=...) is a browser built-in and not ours to verify.
const callRe = /(?:^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g;
let m;
while ((m = handlerRe.exec(html))) {
  const body = m[1];
  let c;
  callRe.lastIndex = 0;
  while ((c = callRe.exec(body))) {
    const fnName = c[1];
    if (seen.has(fnName)) continue;
    seen.add(fnName);
    if (typeof window[fnName] !== 'function') {
      fail(`Inline handler "${fnName}(...)" is referenced in HTML but not defined in JS`);
    }
  }
}
if (seen.size === 0) fail('No inline handlers found — did the markup change shape?');

// ── 3. Critical elements exist ───────────────────────────────────────────────
for (const id of ['btn-monthly', 'btn-annual', 'account-bar', 'authModal', 'input-email']) {
  if (!window.document.getElementById(id)) fail(`Missing required element #${id}`);
}
// FAQ must be native <details>/<summary> — it has to survive a JS failure.
const faqItems = window.document.querySelectorAll('.faq-item');
if (faqItems.length === 0) fail('No .faq-item elements found');
faqItems.forEach((el, i) => {
  if (el.tagName !== 'DETAILS') {
    fail(`FAQ item ${i + 1} is <${el.tagName.toLowerCase()}>, expected <details> (JS-free accordion)`);
  } else if (!el.querySelector('summary')) {
    fail(`FAQ item ${i + 1} is missing its <summary>`);
  }
});

// Plan cards must be swipe-selectable and wired to a real tier.
const tierCards = window.document.querySelectorAll('.plan-card[data-tier]');
if (tierCards.length < 2) fail(`Expected 2 selectable paid plan cards, found ${tierCards.length}`);
tierCards.forEach(c => {
  const t = c.dataset.tier;
  if (!['monthly', 'annual'].includes(t)) fail(`Plan card has unknown data-tier="${t}"`);
  if (!c.querySelector(`#btn-${t}`)) fail(`Plan card "${t}" has no matching #btn-${t}`);
});

// Refund promise on the page must match the refund promise in the FAQ.
const guarantees = [...window.document.querySelectorAll('.plan-guarantee')].map(e => e.textContent.trim());
const faqText = window.document.querySelector('.faq')?.textContent || '';
const dayMatch = /(\d+)-day money-back/i;
const cardDays = guarantees.map(g => g.match(dayMatch)?.[1]).filter(Boolean);
const faqDays = faqText.match(dayMatch)?.[1];
if (guarantees.length && !faqDays) {
  fail('Plan cards advertise a money-back guarantee but the FAQ never states the refund window');
}
if (faqDays && cardDays.some(d => d !== faqDays)) {
  fail(`Refund window mismatch: cards say ${cardDays.join('/')} days, FAQ says ${faqDays} days`);
}

// Contact address must be consistent everywhere on the page.
const emails = [...new Set([...html.matchAll(/mailto:([^"'\s>]+)/g)].map(m => m[1].toLowerCase()))];
const support = emails.filter(e => e.startsWith('support@') || e.startsWith('admin@'));
if (support.length > 1) {
  fail(`Conflicting support addresses on one page: ${support.join(', ')}`);
}

// ── 4. Account gate actually rendered ────────────────────────────────────────
const bar = window.document.getElementById('account-bar');
if (bar && !/step 1 of 2|sign-in unavailable/i.test(bar.textContent || '')) {
  fail(`Account gate did not render its signed-out state. Got: "${(bar.textContent || '').slice(0, 60)}"`);
}

// ── 5. Stripe price IDs match the expected mode ──────────────────────────────
const LIVE_IDS = ['price_1U56lUGjmPEqu9q9Rgk9ZIDK', 'price_1U56lDGjmPEqu9q9xfEMKPAd'];
const TEST_IDS = ['price_1TU83bGjmPEqu9q97qSe6xYd', 'price_1TXc8dGjmPEqu9q9sIA4RenP'];
// Scan EVERY marketing page that declares PRICE_IDS. sign-up.html shipped LIVE
// price IDs while pricing.html was in TEST mode — a real-money charge path that
// a single-file scan could never see, and that would stay invisible on launch
// day when only pricing.html gets swapped.
const MARKETING_DIR = path.join(ROOT, 'marketing-site');
const activeIds = [];
for (const f of fs.readdirSync(MARKETING_DIR).filter(x => x.endsWith('.html'))) {
  const src = fs.readFileSync(path.join(MARKETING_DIR, f), 'utf8');
  for (const m of src.matchAll(/^\s*(?:monthly|annual):\s*'(price_[A-Za-z0-9]+)'/gm)) {
    activeIds.push(m[1]);
    if (f !== 'pricing.html') warn(`${f} also declares price IDs — keep it in sync with pricing.html`);
  }
}
if (activeIds.length < 2) {
  warn(`Expected 2 active price IDs, found ${activeIds.length}`);
} else {
  const isLive = activeIds.every(id => LIVE_IDS.includes(id));
  const isTest = activeIds.every(id => TEST_IDS.includes(id));
  if (!isLive && !isTest) fail(`Price IDs are a mix of live/test or unrecognised: ${activeIds.join(', ')}`);
  else if (EXPECT_MODE === 'live' && !isLive) fail('STRIPE_MODE=live but page still uses TEST price IDs');
  else if (EXPECT_MODE === 'test' && !isTest) fail('STRIPE_MODE=test but page uses LIVE price IDs');
}

// ── 5b. Displayed prices must agree across every marketing page ──────────────
// sign-up.html advertised "Annual (€150/yr)" while pricing.html said
// "€149.99/year" — the test-mode amount leaking into customer-facing copy.
{
  const shown = new Map();
  for (const f of fs.readdirSync(MARKETING_DIR).filter(x => x.endsWith('.html'))) {
    const src = fs.readFileSync(path.join(MARKETING_DIR, f), 'utf8');
    // Prices reach the user from BOTH markup and JS (sign-up.html sets its
    // banner via textContent), so scan everything — but drop comments, or the
    // `// TEST €150/yr` annotation beside a price ID false-positives.
    // The (?<!:) guard keeps "https://" from being treated as a comment start.
    const visible = src
      .replace(/<!--[\s\S]*?-->/g, '')
      .split('\n')
      .map(line => line.replace(/(?<!:)\/\/.*$/, ''))
      .join('\n');
    for (const m of visible.matchAll(/€\s?(\d+(?:\.\d{2})?)\s*\/?\s*(?:yr|year)/gi)) {
      if (!shown.has(m[1])) shown.set(m[1], f);
    }
  }
  if (shown.size > 1) {
    fail(`Annual price differs across pages: ${[...shown].map(([v, f]) => `€${v} in ${f}`).join(', ')}`);
  }
}

// ── 6. Cache headers must cover pretty URLs, not just *.html ─────────────────
if (fs.existsSync(TOML)) {
  const toml = fs.readFileSync(TOML, 'utf8');
  const prettyUrls = [...toml.matchAll(/from\s*=\s*"(\/[a-z0-9-]+)"/g)].map(x => x[1]);
  const hasCatchAllCache = /for\s*=\s*"\/\*"[\s\S]{0,400}?Cache-Control/.test(toml);
  if (prettyUrls.length && !hasCatchAllCache) {
    fail(
      `netlify.toml rewrites ${prettyUrls.join(', ')} but has no Cache-Control on "/*". ` +
      `A rule scoped to "/*.html" does NOT match these paths — users get stale pages.`
    );
  }
}

// ── 7. Leftovers from the removed toggle ─────────────────────────────────────
for (const dead of ['toggle-wrap', 'annual-on', 'lbl-monthly', 'lbl-annual']) {
  if (html.includes(dead)) warn(`Leftover reference to removed toggle: "${dead}"`);
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log('\nSoulGainz — pricing page smoke test');
console.log(`  page:  marketing-site/pricing.html`);
console.log(`  mode:  expecting ${EXPECT_MODE.toUpperCase()} Stripe price IDs`);
console.log(`  handlers checked: ${[...seen].join(', ') || '(none)'}\n`);

warnings.forEach(w => console.log(`  WARN  ${w}`));
if (failures.length === 0) {
  console.log(`  PASS  ${warnings.length ? `with ${warnings.length} warning(s)` : 'all checks green'}\n`);
  process.exit(0);
}
failures.forEach(f => console.log(`  FAIL  ${f}`));
console.log(`\n  ${failures.length} check(s) failed — do not deploy.\n`);
process.exit(1);
