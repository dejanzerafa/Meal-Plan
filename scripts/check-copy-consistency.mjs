#!/usr/bin/env node
// check-copy-consistency.mjs
//
// Guards the claims that drifted apart across the app and the marketing site:
// currency, recipe counts, tier names, the refund window, and — most importantly
// — that no price or checkout button is ever served from the app domain.
//
// Every rule here exists because the repo actually violated it:
//   - two pricing pages, one on the app domain, with different wording
//   - "170+ recipes" advertised while 163 were published
//   - "$10,000", "$300" and "AUD $50" left over from a pre-EUR version
//   - "Monthly Pro" / "Annual Pro" from the retired tier naming
//   - a 7-day refund promise on the landing page vs 14 days in the Terms
//
// Run: node scripts/check-copy-consistency.mjs
// Exits non-zero on any violation, so it can gate a deploy.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = f => readFileSync(join(ROOT, f), "utf8");
const exists = f => existsSync(join(ROOT, f));

// Pages served from soulgainz.app — the APP domain. Apple must never see a
// price or a buy button here.
const APP_PAGES = [
  "index.html", "landing.html", "about.html", "waitlist.html", "success.html",
  "install.html", "offline.html", "recipes-preview.html", "blog-30-days.html",
  "404.html", "terms.html", "privacy.html",
].filter(exists);

// Pages served from marketing.soulgainz.app — prices ARE allowed here.
const MARKETING_PAGES = exists("marketing-site")
  ? readdirSync(join(ROOT, "marketing-site")).filter(f => f.endsWith(".html")).map(f => `marketing-site/${f}`)
  : [];

const problems = [];
const fail = (file, line, msg) => problems.push({ file, line, msg });

// Strip comments and <style> blocks so a rule never fires on a code comment or
// a CSS class name. This matters: an earlier version of this check flagged
// "// ── 7-day prep adherence ──" as a refund-window violation.
function proseLines(src) {
  return src
    .replace(/<style[\s\S]*?<\/style>/gi, m => "\n".repeat(m.split("\n").length - 1))
    .replace(/<!--[\s\S]*?-->/g, m => "\n".repeat(m.split("\n").length - 1))
    .split("\n")
    .map((text, i) => ({ n: i + 1, text }))
    .filter(({ text }) => !/^\s*(\/\/|\*|\/\*)/.test(text));
}

// ── Rule 1: no prices on the app domain ──────────────────────────────────────
// €10,000 and €300 on the landing hero are illustrative grocery-spend figures,
// not our prices, so only subscription-shaped amounts are flagged.
const PRICE = /€\s?(0|16[.,]99|149[.,]99|150|12[.,]50)\b/;
for (const f of APP_PAGES) {
  for (const { n, text } of proseLines(read(f))) {
    if (PRICE.test(text)) fail(f, n, `subscription price on the app domain: ${text.trim().slice(0, 90)}`);
  }
}

// ── Rule 2: no checkout on the app domain ────────────────────────────────────
for (const f of APP_PAGES) {
  for (const { n, text } of proseLines(read(f))) {
    if (/handleCheckout\s*\(|\/\.netlify\/functions\/create-checkout|checkout\.stripe\.com/.test(text)) {
      fail(f, n, `checkout call on the app domain: ${text.trim().slice(0, 90)}`);
    }
  }
}

// ── Rule 3: EUR only in user-facing money ────────────────────────────────────
for (const f of [...APP_PAGES, ...MARKETING_PAGES, "TERMS_AND_CONDITIONS.md"].filter(exists)) {
  for (const { n, text } of proseLines(read(f))) {
    if (/\bAUD\s*\$|\bUSD\s*\$|\bA\$\d|\bUS\$\d|(?<!SF )\$\d|£\d/.test(text)) {
      fail(f, n, `non-EUR currency: ${text.trim().slice(0, 90)}`);
    }
  }
}

// ── Rule 4: recipe count claims ──────────────────────────────────────────────
// 163 published. "170+" and "173" both counted the unreleased SoulFood recipes.
for (const f of [...APP_PAGES, ...MARKETING_PAGES]) {
  for (const { n, text } of proseLines(read(f))) {
    if (/\b17[0-9]\s*\+?\s*(recipe|high-protein|verified)/i.test(text) || /\b17[03]\+/.test(text)) {
      fail(f, n, `overstated recipe count — say "160+": ${text.trim().slice(0, 90)}`);
    }
  }
}

// ── Rule 5: retired tier names ───────────────────────────────────────────────
for (const f of [...APP_PAGES, ...MARKETING_PAGES]) {
  for (const { n, text } of proseLines(read(f))) {
    if (/\b(Monthly|Annual)\s+Pro\b|>\s*PRO\s*</.test(text)) {
      fail(f, n, `retired tier name — tiers are Free/Monthly/Annual: ${text.trim().slice(0, 90)}`);
    }
  }
}

// ── Rule 6: nothing sells a bundle or a single recipe ────────────────────────
for (const f of MARKETING_PAGES) {
  for (const { n, text } of proseLines(read(f))) {
    if (/(seasonal|soulfood|holiday)\s+bundle/i.test(text) || /buy this recipe|unlock this recipe for/i.test(text)) {
      fail(f, n, `advertises a product that is not sold: ${text.trim().slice(0, 90)}`);
    }
  }
}

// ── Rule 7: one refund window everywhere ─────────────────────────────────────
for (const f of [...APP_PAGES, ...MARKETING_PAGES]) {
  for (const { n, text } of proseLines(read(f))) {
    const m = text.match(/(\d+)-day (?:money-back|refund)/i);
    if (m && m[1] !== "14") fail(f, n, `refund window says ${m[1]} days, Terms say 14: ${text.trim().slice(0, 90)}`);
  }
}

// ── Rule 8: the free calculator limit must be stated on the pricing page ─────
if (exists("marketing-site/pricing.html")) {
  const src = read("marketing-site/pricing.html");
  if (!/one free calculation/i.test(src)) {
    fail("marketing-site/pricing.html", 0, 'free tier must state "one free calculation"');
  }
  if ((src.match(/Unlimited macro calculator/gi) || []).length < 2) {
    fail("marketing-site/pricing.html", 0, "monthly and annual must both say 'Unlimited macro calculator'");
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`\n  copy consistency — ${APP_PAGES.length} app pages, ${MARKETING_PAGES.length} marketing pages\n`);
if (!problems.length) {
  console.log("  PASS  no drift found\n");
  process.exit(0);
}
for (const p of problems) console.log(`  FAIL  ${p.file}${p.line ? ":" + p.line : ""} — ${p.msg}`);
console.log(`\n  ${problems.length} problem(s)\n`);
process.exit(1);
