#!/usr/bin/env node
// next-recipe-ids.mjs
//
// Prints the next free recipe ID in each family, and fails if any ID is used
// twice.
//
// WHY: the ID numbering lived only in a hand-maintained comment above
// PENDING_RECIPES. It went stale the moment a batch was added — by 31 Aug 2026
// it was telling the next author to use "bf87" when the highest breakfast was
// bf35, and "d7" when the highest dessert was d5. Numbering a new batch from a
// stale comment risks a duplicate ID, and a duplicate ID is nasty: RECIPES is
// searched with .find(), so the second recipe becomes unreachable while still
// contributing to counts, the shopping list and the audit scripts.
//
// Run before numbering any new batch:
//   node scripts/next-recipe-ids.mjs

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(ROOT, "index.html"), "utf8");

const slice = (startMark, openChar, closeMark) => {
  const i = src.indexOf(startMark);
  const a = src.indexOf(openChar, i);
  const b = src.indexOf(closeMark, a);
  return src.slice(a, b + closeMark.length);
};

const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
let PENDING = [];
try { PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]")); } catch {}

const all = [...RECIPES, ...PENDING].map(r => r.id);

// Longest prefix first, so "bf9" is read as bf+9 and not b+f9.
const FAMILIES = [
  ["bf", "Breakfasts"],
  ["sm", "Smoothies"],
  ["sn", "Snacks"],
  ["pw", "Pre-workout"],
  ["hol", "Occasions"],
  // Desserts carry TWO prefixes for historical reasons: d1/d4/d5 and ds2–ds6.
  // (d2 and d3 were retired.) Both are live and neither can be renamed — recipe
  // IDs are the keys stored in users' favourites, meal plans and cooked-it
  // history, in localStorage AND in Supabase. Renaming one orphans that data
  // silently. Use ds* for new desserts; it is the larger of the two sets.
  ["ds", "Desserts (ds*)"],
  ["m", "Mains"],
  ["v", "Vegan"],
  ["d", "Desserts (d*)"],
];

console.log(`\n  ${all.length} recipes — ${RECIPES.length} in RECIPES, ${PENDING.length} staged\n`);
console.log("  NEXT FREE ID");
for (const [prefix, label] of FAMILIES) {
  const ns = all
    .filter(id => new RegExp(`^${prefix}\\d+$`).test(id))
    .map(id => +id.slice(prefix.length));
  const highest = ns.length ? Math.max(...ns) : 0;
  console.log(`    ${(label + " ".repeat(14)).slice(0, 14)} ${prefix}${highest + 1}${" ".repeat(Math.max(1, 7 - String(highest + 1).length))}(highest in use: ${ns.length ? prefix + highest : "none"})`);
}

// ── Duplicate guard ─────────────────────────────────────────────────────────
const seen = new Map();
const dupes = [];
for (const id of all) {
  if (seen.has(id)) dupes.push(id);
  seen.set(id, (seen.get(id) || 0) + 1);
}
if (dupes.length) {
  console.log(`\n  FAIL  duplicate recipe IDs: ${[...new Set(dupes)].join(", ")}`);
  console.log("        RECIPES is searched with .find(), so only the FIRST is reachable.\n");
  process.exit(1);
}

// ── Unnumbered / off-convention IDs ─────────────────────────────────────────
const known = new Set();
for (const [prefix] of FAMILIES) {
  for (const id of all) if (new RegExp(`^${prefix}\\d+$`).test(id)) known.add(id);
}
const odd = all.filter(id => !known.has(id) && !id.startsWith("custom_"));
if (odd.length) console.log(`\n  note: ${odd.length} ID(s) off-convention: ${odd.join(", ")}`);

console.log("\n  PASS  no duplicate IDs\n");
