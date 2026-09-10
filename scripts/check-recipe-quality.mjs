#!/usr/bin/env node
// check-recipe-quality.mjs — the gate every recipe has to pass.
//
// Runs the rules in lib/recipe-rules.mjs over the whole library, and over any
// new batch you are about to merge. Two audits' worth of findings are encoded
// there; this is what stops them coming back one upload at a time.
//
//   node scripts/check-recipe-quality.mjs
//       every recipe in index.html (RECIPES + PENDING_RECIPES)
//
//   node scripts/check-recipe-quality.mjs recipe-intake/build-2026-09-07.json
//       a batch waiting to go in — same rules, before it touches index.html
//
//   node scripts/check-recipe-quality.mjs --severity safety
//       only the findings that could make someone ill
//
// Exit code 1 on any finding, so CI and the intake pipeline both gate on it.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkLibrary } from "./lib/recipe-rules.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const sevArg = args.includes("--severity") ? args[args.indexOf("--severity") + 1] : null;
const files = args.filter(a => !a.startsWith("--") && a !== sevArg);

const src = readFileSync(join(ROOT, "index.html"), "utf8");
const slice = (s, o, c) => { const i = src.indexOf(s); const a = src.indexOf(o, i); const b = src.indexOf(c, a); return src.slice(a, b + c.length); };
const IM = eval("(" + slice("const INGREDIENT_MACROS = {", "{", "\n};").replace(/\n};$/, "\n}") + ")");
const ING = eval(slice("const ING_FLAT", "[", "\n];").replace(/\n];$/, "\n]"));

let recipes, label;
if (files.length) {
  recipes = files.flatMap(f => {
    const j = JSON.parse(readFileSync(f, "utf8"));
    return Array.isArray(j) ? j : (j.recipes || [j]);
  });
  label = files.join(", ");
} else {
  const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
  const PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
  recipes = [...RECIPES, ...PENDING];
  label = `index.html — ${RECIPES.length} live + ${PENDING.length} staged`;
}

let results = checkLibrary(recipes, { IM, ING });
if (sevArg) results = results.map(r => ({ ...r, findings: r.findings.filter(f => f.severity === sevArg) })).filter(r => r.findings.length);

const ORDER = ["safety", "wrong", "technique", "nutrition", "quality"];
const all = results.flatMap(r => r.findings);
const bySeverity = Object.fromEntries(ORDER.map(s => [s, all.filter(f => f.severity === s).length]));

console.log(`\n  recipe quality — ${recipes.length} recipe(s) from ${label}`);
if (!results.length) {
  console.log(`\n  PASS  every recipe is safe to cook from, uses what it buys, and states what it costs\n`);
  process.exit(0);
}
console.log(`  ${ORDER.map(s => `${bySeverity[s]} ${s}`).join(" · ")}\n`);
for (const sev of ORDER) {
  const hits = results.filter(r => r.findings.some(f => f.severity === sev));
  if (!hits.length) continue;
  console.log(`  ${sev.toUpperCase()}`);
  for (const { recipe, findings } of hits)
    for (const f of findings.filter(x => x.severity === sev))
      console.log(`    - ${recipe.id} (${f.id}): ${f.message}\n        why: ${f.why}`);
  console.log("");
}
console.log(`  ${all.length} finding(s) across ${results.length} recipe(s)\n`);
process.exit(1);
