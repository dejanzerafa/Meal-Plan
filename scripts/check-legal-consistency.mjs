#!/usr/bin/env node
/**
 * SoulGainz — legal consistency check.
 *
 * The pricing page, the app, the published Terms and the master document all
 * make promises to customers. When they drift apart, the customer-favourable
 * version generally wins and the contradiction weakens every document.
 *
 * This caught, on first run:
 *   - terms.html promising 7-day annual-only refunds while the FAQ said 14-day
 *   - governing law set to Qatar in one file and Victoria, Australia in another
 *   - three different support addresses across two domains
 *
 * Run before any deploy that touches legal copy:
 *     node scripts/check-legal-consistency.mjs
 *
 * Single source of truth is declared here. Change it here first, then fix the
 * files until this passes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Single source of truth ───────────────────────────────────────────────────
const TRUTH = {
  refundDays: 14,
  supportEmail: 'support@soulgainz.app',
  governingLaw: 'Qatar',
  privacyLaw: 'Law No. 13 of 2016',
  regulator: 'NCGAA',
};

// Terms that must never appear again — previous jurisdiction, dead addresses.
const FORBIDDEN = [
  { pattern: /Australian Consumer Law/i,            why: 'superseded by Qatar governing law' },
  { pattern: /Australian Privacy Act|Privacy Act 1988/i, why: 'superseded by Qatar PDPPL' },
  { pattern: /\bOAIC\b|Office of the Australian Information Commissioner/i, why: 'wrong regulator' },
  { pattern: /State of Victoria|Victoria, Australia/i, why: 'superseded by Qatar governing law' },
  { pattern: /admin@soulgainz\.app/i,                why: `use ${TRUTH.supportEmail}` },
  { pattern: /support@soulgainz\.com/i,              why: `wrong domain — use ${TRUTH.supportEmail}` },
  // Only flag the netlify subdomain when presented to a CUSTOMER as our website
  // (e.g. "Website: soulgainz.netlify.app" in the Terms). It is a legitimate
  // technical origin inside ALLOWED_ORIGINS / CORS allowlists — flagging those
  // caused a bad find-and-replace that silently dropped a valid origin.
  { pattern: /(?:Website|Site|Visit|href="https?:\/\/)[^\n"]{0,20}soulgainz\.netlify\.app/i,
    why: 'customer-facing site is soulgainz.app' },
  { pattern: /30-day (satisfaction|money-back)/i,    why: `refund window is ${TRUTH.refundDays} days` },
  { pattern: /within 7 days/i,                       why: `refund window is ${TRUTH.refundDays} days` },
  // Checkout charges EUR. A USD price in an email is a price we cannot honour.
  { pattern: /\$\d+\.\d{2}/,                         why: 'prices are charged in EUR, not USD' },
  // Only Monthly and Annual are sold (Terms 5.1 / KNOWN_TIERS in
  // create-checkout.js). Match only marketing prose — "quarterly ($39.99)",
  // "quarterly plan". Legacy tier lookups like `quarterly: "Quarterly Access"`
  // or ["annual","quarterly","monthly"] are deliberate back-compat for old
  // account rows and must NOT be flagged, or restores break.
  { pattern: /\bquarterly\b[^\n]{0,20}[$€]\d|[$€]\d[^\n]{0,20}\bquarterly\b|\bquarterly (?:plan|subscription|option|tier)\b/i,
    why: 'no quarterly plan is sold' },
  { pattern: /single[- ]recipe unlock|unlock a recipe for/i,
    why: 'single-recipe unlocks are no longer sold' },
  // Only flag lifetime access when it is being OFFERED. "We do not offer
  // lifetime access" is correct copy and must not trip the check.
  { pattern: /(?<!\b(?:no|not|never|don't|doesn't)\s(?:\w+\s){0,3})\blifetime (access|plan|deal|subscription)\b/i,
    why: 'no lifetime access is sold (Terms 6.4)' },
];

// Files that make customer-facing legal promises.
const FILES = [
  'TERMS_AND_CONDITIONS.md',
  'terms.html',
  'privacy.html',
  'index.html',
];

// Glob the whole marketing site rather than listing pages by hand — contact.html
// was added later and silently escaped every check in this file, including its
// 14-day guarantee, Qatar/PDPPL claims and its "ME tab → …" reference.
const MARKETING_DIR = path.join(ROOT, 'marketing-site');
if (fs.existsSync(MARKETING_DIR)) {
  for (const f of fs.readdirSync(MARKETING_DIR)) {
    if (f.endsWith('.html')) FILES.push(path.join('marketing-site', f));
  }
}

// Serverless functions send email and render error messages to customers, so
// they carry contact addresses too. A stale admin@ was found hiding in
// customer-portal.js and send-feedback.js that the HTML-only scan missed.
const FUNCTIONS_DIR = path.join(ROOT, 'netlify', 'functions');
if (fs.existsSync(FUNCTIONS_DIR)) {
  for (const f of fs.readdirSync(FUNCTIONS_DIR)) {
    if (f.endsWith('.js')) FILES.push(path.join('netlify', 'functions', f));
  }
}

const failures = [];
const notes = [];

for (const rel of FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) { notes.push(`skipped (not found): ${rel}`); continue; }

  // Strip comments before scanning. Only what a CUSTOMER can read matters —
  // a comment explaining "this used to say lifetime access" is not a promise,
  // and flagging it trains you to ignore the checker.
  const text = fs.readFileSync(abs, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')      // HTML comments (incl. inside email templates)
    // Block-comment strip must NOT match a "/*" that appears inside a string
    // (e.g. a glob like "/assets/*"), or everything up to the next "*/" —
    // real customer-facing copy included — is silently deleted and never
    // scanned. Verified: this exact bug swallowed a "30-day money-back
    // guarantee" line, the very thing this checker exists to catch.
    // Requiring a preceding boundary makes the false negative go away.
    .replace(/(^|[\s;{(])\/\*[\s\S]*?\*\//g, '$1')   // JS block comments
    .replace(/^\s*\/\/.*$/gm, '');        // JS line comments

  for (const { pattern, why } of FORBIDDEN) {
    const hit = text.match(pattern);
    if (hit) failures.push(`${rel}: contains "${hit[0]}" — ${why}`);
  }

  // Any refund window stated must be the agreed one.
  for (const m of text.matchAll(/(\d+)[- ]day(?:s)? (?:money-back|satisfaction|refund|guarantee)/gi)) {
    if (Number(m[1]) !== TRUTH.refundDays) {
      failures.push(`${rel}: states a ${m[1]}-day refund window, expected ${TRUTH.refundDays}`);
    }
  }

  // Any governing-law statement must name the agreed jurisdiction. Skip the
  // "mandatory consumer laws of your/their country of residence" carve-out,
  // which is deliberate and jurisdiction-neutral.
  for (const m of text.matchAll(/\blaws of (?:the State of )?([A-Za-z ,]+?)[.,\s]/g)) {
    const named = m[1].trim();
    if (/^(your|their|his|her|the|each|any)\b/i.test(named)) continue;
    if (!named.includes(TRUTH.governingLaw)) {
      failures.push(`${rel}: governing law reads "${named}", expected ${TRUTH.governingLaw}`);
    }
  }
}

// The two authoritative documents must actually cite the privacy framework.
for (const rel of ['TERMS_AND_CONDITIONS.md', 'privacy.html']) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const text = fs.readFileSync(abs, 'utf8');
  if (!text.includes(TRUTH.privacyLaw)) {
    failures.push(`${rel}: does not cite Qatar PDPPL (${TRUTH.privacyLaw})`);
  }
  if (!text.includes(TRUTH.regulator)) {
    failures.push(`${rel}: does not name the supervisory authority (${TRUTH.regulator})`);
  }
}

// ── Docs must not describe UI that doesn't exist ─────────────────────────────
// The Terms told users to cancel via "ME tab → Manage Billing" long after the
// button was renamed. Someone following the Terms would hunt for a control that
// isn't there — and a cancellation route you can't find is a consumer-law
// problem, not a copy nit. Any "ME tab → X" reference must name a real label.
{
  const appPath = path.join(ROOT, 'index.html');
  if (fs.existsSync(appPath)) {
    const app = fs.readFileSync(appPath, 'utf8');
    const seenLabels = new Set();
    for (const rel of FILES) {
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs)) continue;
      const text = fs.readFileSync(abs, 'utf8');
      for (const m of text.matchAll(/ME tab\s*(?:→|-&gt;|->)\s*([A-Z][A-Za-z ]{2,30}?)(?=[.,)<\n]|\s{2})/g)) {
        const label = m[1].trim();
        if (seenLabels.has(label + rel)) continue;
        seenLabels.add(label + rel);
        if (!app.includes(`"${label}"`)) {
          failures.push(`${rel}: refers to "ME tab → ${label}" but no such label exists in the app UI`);
        }
      }
    }
  }
}

// ── Duplicated legal pages must be regenerated, not hand-edited ──────────────
// Terms & Privacy are published on both domains. The marketing copies are
// generated from the canonical root files, so the only way they can disagree
// is if someone edited a copy directly or forgot to re-run the generator.
try {
  const { generate } = await import('./build-legal-pages.mjs');
  for (const { out, html } of generate()) {
    const onDisk = path.join(ROOT, 'marketing-site', out);
    if (!fs.existsSync(onDisk)) {
      failures.push(`marketing-site/${out} is missing — run: node scripts/build-legal-pages.mjs`);
      continue;
    }
    const current = fs.readFileSync(onDisk, 'utf8');
    if (current.trim() !== html.trim()) {
      failures.push(
        `marketing-site/${out} is out of date with the canonical source — ` +
        `run: node scripts/build-legal-pages.mjs`
      );
    }
  }
} catch (err) {
  failures.push(`Could not verify generated legal pages: ${err.message}`);
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log('\nSoulGainz — legal consistency check');
console.log(`  refund window : ${TRUTH.refundDays} days, all plans`);
console.log(`  governing law : ${TRUTH.governingLaw}`);
console.log(`  privacy law   : Qatar PDPPL (${TRUTH.privacyLaw}), GDPR for EEA/UK`);
console.log(`  contact       : ${TRUTH.supportEmail}`);
console.log(`  files checked : ${FILES.length}\n`);

notes.forEach(n => console.log(`  NOTE  ${n}`));

if (failures.length === 0) {
  console.log('  PASS  all documents agree\n');
  process.exit(0);
}
failures.forEach(f => console.log(`  FAIL  ${f}`));
console.log(`\n  ${failures.length} inconsistency(ies) found — fix before deploying.\n`);
process.exit(1);
