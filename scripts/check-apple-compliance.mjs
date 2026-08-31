#!/usr/bin/env node
// check-apple-compliance.mjs
//
// The app domain (soulgainz.app) must show NO subscription price and NO checkout.
// Purchase happens only on marketing.soulgainz.app.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS IS A SCRIPT AND NOT A PARAGRAPH IN THE HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────
// Two versions of this check have now cried wolf:
//
//   1. The original health check flagged ANY `€\d+` in index.html as a CRITICAL
//      violation. The onboarding copy says "€300 per fortnight" and "€4 a meal"
//      — grocery costs, not plan prices. It fired every day and the task was
//      switched off, which is what always happens to a check that is wrong.
//
//   2. The replacement grepped for the bare string "create-checkout". Three
//      COMMENTS in index.html mention create-checkout.js by name while
//      explaining that checkout deliberately lives elsewhere. It reported a
//      violation for code that is the fix, not the problem.
//
// So: strip comments before testing, and require a price to be attached to a
// plan word rather than merely present. A checker that is wrong twice is worse
// than no checker, because it trains you to ignore the one time it is right.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Files served from the APP domain. The marketing site is a separate deploy and
// is allowed — required, in fact — to show prices and run checkout.
const APP_FILES = ["index.html", "landing.html", "success.html", "install.html",
                   "about.html", "method.html", "waitlist.html"];

const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, " ")                       // block comments
    .split("\n")
    .map(l => l.replace(/(^|[^:"'`\\])\/\/.*$/, "$1"))       // line comments, not URLs
    .join("\n")
    .replace(/<!--[\s\S]*?-->/g, " ");                       // HTML comments

// Exclusions run FIRST and win, exactly like ALLERGEN_MAP's `not` lists.
//
// The app legitimately talks about what FOOD costs — that is the pitch. "Stop
// spending €10,000 a year", "€300 per fortnight", "€4 a meal" are all grocery
// claims, and a compliance checker that flags them is the reason the last one
// got switched off. A subscription price is the thing being sold; a grocery
// figure is the thing being saved.
const SPEND_CONTEXT = /(spend|spending|save|saving|costs? you|grocery|groceries|food bill|instead of|per fortnight|a meal|per meal|weekly shop)/i;

const nearSpendTalk = (src, idx) => SPEND_CONTEXT.test(src.slice(Math.max(0, idx - 90), idx + 90));

const RULES = [
  { name: "plan price",
    // A number next to a plan word. "€300 per fortnight" (groceries) does not
    // match; "€16.99/mo" and "Annual — €150" do.
    re: /(monthly|annual|per month|per year|\/mo\b|\/yr\b|billed)[^.<>]{0,24}[€$]\s?\d/i,
    why: "a subscription price on the app domain", excludeSpend: true },
  { name: "price then plan word",
    re: /[€$]\s?\d[\d.,]*\s?(\/\s?mo\b|\/\s?yr\b|per month|per year|a month|a year)/i,
    why: "a subscription price on the app domain", excludeSpend: true },
  { name: "stripe.js",
    re: /js\.stripe\.com|Stripe\s*\(\s*['"]pk_/i,
    why: "the Stripe SDK loaded on the app domain" },
  { name: "checkout call",
    // A real call, not a comment mentioning the filename.
    re: /redirectToCheckout|fetch\s*\(\s*[^)]*create-checkout|["'`][^"'`]*\/create-checkout/i,
    why: "a checkout request from the app domain" },
];

const problems = [];
let scanned = 0;

for (const f of APP_FILES) {
  let raw;
  try { raw = readFileSync(join(ROOT, f), "utf8"); }
  catch { continue; }
  scanned++;
  const src = stripComments(raw);
  for (const rule of RULES) {
    // Scan ALL matches, not just the first — one excluded grocery figure used to
    // mask everything after it.
    const re = new RegExp(rule.re.source, rule.re.flags.includes("g") ? rule.re.flags : rule.re.flags + "g");
    let m;
    while ((m = re.exec(src)) !== null) {
      if (rule.excludeSpend && nearSpendTalk(src, m.index)) continue;
      const line = src.slice(0, m.index).split("\n").length;
      problems.push(`${f}:${line}  ${rule.why}  ->  ${JSON.stringify(m[0].slice(0, 70))}`);
    }
  }
}

// The upgrade path must point off-domain, or the whole separation is pointless.
try {
  const idx = readFileSync(join(ROOT, "index.html"), "utf8");
  const url = (/SUBSCRIBE_URL\s*=\s*["']([^"']+)["']/.exec(idx) || [])[1];
  if (!url) problems.push("index.html  SUBSCRIBE_URL not found — cannot verify the upgrade path leaves the app domain");
  else if (!/^https:\/\/marketing\.soulgainz\.app/.test(url))
    problems.push(`index.html  SUBSCRIBE_URL points at ${url} — must be an absolute marketing.soulgainz.app URL so iOS opens it OUTSIDE the standalone PWA window`);
} catch {}

console.log(`\n  apple compliance — ${scanned} app-domain page(s) scanned\n`);
if (!problems.length) {
  console.log("  PASS  no plan price, no checkout, upgrade path leaves the app domain\n");
  process.exit(0);
}
for (const p of problems) console.log("    - " + p);
console.log(`\n  ${problems.length} violation(s)\n`);
process.exit(1);
