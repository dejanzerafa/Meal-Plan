#!/usr/bin/env node
// check-ingredients.mjs
//
// The ingredient registry guard. Run it after ANY recipe or ingredient change.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
// ─────────────────────────────────────────────────────────────────────────────
// The app stores ingredient macros twice:
//
//   INGREDIENT_MACROS  keyed by a PER-RECIPE key ("bf9_cott", "m16_cott", ...)
//   ING_FLAT           keyed by a numeric ingId, shared across recipes
//
// computePerPortion reads the first; the ingredients tab and the shopping list
// read the second. So the same food can be described twice, and when the two
// copies disagree the app contradicts itself on screen.
//
// There are ~1,500 keys for ~370 distinct foods, which means most foods are
// described many times over. Every data error found in the August audit was a
// symptom of that:
//
//   - bf28_cottage said 98 kcal where 40 other cottage-cheese keys said 72
//   - v2_tofu said 76 (soft) on a label reading "extra-firm"
//   - v7_chees said 403 (full-fat) on a label reading "reduced-fat"
//   - m32_stk said 185 (untrimmed) on a label reading "trimmed"
//   - ingId 177 (Pumpkin Seeds) was used for coconut milk in four recipes,
//     which merged both foods into one shopping-list line
//
// This script catches all five shapes automatically. It does not judge whether
// a macro is correct against USDA — that needs a human and a source. It catches
// the far more common failure: the SAME food described two different ways.

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
const IM   = eval("(" + slice("const INGREDIENT_MACROS = {", "{", "\n};").replace(/\n};$/, "\n}") + ")");
const ING  = eval(slice("const ING_FLAT", "[", "\n];").replace(/\n];$/, "\n]"));
const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
let PENDING = [];
try { PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]")); } catch {}

const byId = new Map(ING.map(i => [i.id, i]));
const items = [...RECIPES, ...PENDING].flatMap(r => (r.batchItems || []).map(b => ({ rid: r.id, ...b })));

const problems = [];
const fail = (kind, msg) => problems.push({ kind, msg });

// ── 1. Every ingredient must be identified in both registries ───────────────
for (const it of items) {
  if (!IM[it.key])       fail("unmapped", `${it.rid}: key "${it.key}" has no INGREDIENT_MACROS entry — it contributes ZERO to the macros`);
  if (!byId.has(it.ingId)) fail("unmapped", `${it.rid}: ingId ${it.ingId} ("${it.label}") is not in ING_FLAT`);
}

// ── 2. The two registries must describe the same food ───────────────────────
for (const it of items) {
  const k = IM[it.key], f = byId.get(it.ingId);
  if (!k || !f || !k.kcal) continue;
  const drift = Math.abs(f.kcal - k.kcal) / k.kcal * 100;
  if (drift > 15) {
    fail("banks-disagree",
      `${it.rid}/${it.key} "${it.label}": macros say ${k.kcal} kcal, ingId ${it.ingId} is "${f.name}" at ${f.kcal} kcal (${Math.round(drift)}% apart)`);
  }
}

// ── 3. One food, one macro value ────────────────────────────────────────────
// Normalise the label down to the food it names, then require every use of that
// food to agree — unless the labels themselves distinguish them (fat-free vs
// whole, 93/7 vs 99/1), which is legitimate.
const DISTINGUISHING = /fat[- ]free|reduced|low[- ]fat|full[- ]fat|whole|skim|light|lite|\d\d\/\d|extra[- ]firm|silken|soft|firm|green|red|yellow|dry|canned|cooked|oil[- ]packed|raw|trimmed/i;
const norm = l => {
  const t = String(l || "").toLowerCase();
  // Preserve the markers that genuinely distinguish two products before the
  // rest of the label is stripped: "0%", "2%", "93/7", "no oil", "drained".
  const marks = (t.match(/\d+\s*%|\d\d\/\d|no oil|oil[- ]packed|drained|in water|dry/g) || []).join("");
  return marks + " " + t
  .split(/\s+/).filter(w => w && !["raw","dry","fresh","frozen","canned","drained","chopped","diced","sliced","shredded","crumbled","minced","cooked","light","reduced","low","free","fat","non","plain","unsweetened","natural","large","medium","small","whole","lean","extra","of","or","and","the","a","g","ml","pack","jar","tin","optional","to","taste","for","with"].includes(w))
  .sort().join(" ");
};

const groups = new Map();
for (const it of items) {
  const k = IM[it.key]; if (!k) continue;
  const n = norm(it.label); if (!n) continue;
  if (!groups.has(n)) groups.set(n, []);
  groups.get(n).push({ ...it, ...k });
}
for (const [name, rows] of groups) {
  const variants = new Map();
  for (const r of rows) variants.set([r.kcal, r.p, r.c, r.f].join("|"), r);
  if (variants.size < 2) continue;
  const vs = [...variants.values()];
  const ks = vs.map(v => v.kcal);
  const spread = (Math.max(...ks) - Math.min(...ks)) / Math.max(1, Math.min(...ks)) * 100;
  if (spread <= 15) continue;
  // Legitimate when the labels themselves say why they differ — "Butter" vs
  // "Light butter", "0% fat" vs "2% fat", "no oil" vs "drained". Requires the
  // labels to be distinct AND at least one to carry a distinguishing marker,
  // so two identically-labelled foods with different macros still fail.
  const labels = vs.map(v => v.label.toLowerCase().trim());
  if (new Set(labels).size === vs.length && vs.some(v => DISTINGUISHING.test(v.label))) continue;
  fail("same-food-differs",
    `"${name}" has ${variants.size} macro values ${Math.round(spread)}% apart: ` +
    vs.map(v => `${v.key}=${v.kcal}k (${v.rid}, "${v.label}")`).join("  vs  "));
}

// ── 4. Countable units need a gram weight ───────────────────────────────────
for (const it of items) {
  const u = String(it.unit || "g").toLowerCase();
  if (u === "g" || u === "ml") continue;
  const k = IM[it.key];
  if (k && !k.unitG) fail("no-unitG", `${it.rid}/${it.key} "${it.label}" is in ${it.unit} but has no unitG — the quantity will be read as grams`);
}

// ── 5. Categories must be renderable ────────────────────────────────────────
const CAT_ORDER = eval(slice("const CAT_ORDER", "[", "]"));
for (const it of items) {
  if (it.cat && !CAT_ORDER.includes(it.cat)) {
    fail("bad-cat", `${it.rid}/${it.key} cat "${it.cat}" is not in CAT_ORDER — it will not render on the recipe card`);
  }
}

// ── 6. Declared macros must match the ingredients ───────────────────────────
// Legitimate exception: fibre-discounted energy for cocoa, where the declared
// figure was computed with Atwater factors.
// d1 and sm2 declare kcal from Atwater factors while the ingredient bank uses
// real, fibre-discounted energy for cocoa. Both describe the same food.
// (sn1 was the third, exempt because of tempeh — that recipe has been removed.)
const ATWATER_EXEMPT = new Set(["d1", "sm2"]);
for (const r of [...RECIPES, ...PENDING]) {
  const d = r.perPortion; if (!d || !d.kcal) continue;
  let k = 0, p = 0, c = 0, f = 0, covered = 0;
  for (const it of (r.batchItems || [])) {
    const md = IM[it.key]; if (!md) continue;
    const u = String(it.unit || "g").toLowerCase();
    let g;
    if (u === "g" || u === "ml") g = it.qty;
    else { if (!md.unitG) continue; g = it.qty * md.unitG; }
    if (g <= 0) continue;
    covered++; k += md.kcal / 100 * g; p += md.p / 100 * g; c += md.c / 100 * g; f += md.f / 100 * g;
  }
  if (covered < 3) continue;
  const n = r.portions || 1;
  const e = (a, b) => b ? Math.abs(a - b) / b * 100 : 0;
  const worst = Math.max(e(k / n, d.kcal), e(p / n, d.protein), e(c / n, d.carbs), e(f / n, d.fat));
  if (worst > 7 && !ATWATER_EXEMPT.has(r.id)) {
    fail("macros-drift", `${r.id}: declared ${Math.round(d.kcal)}/${Math.round(d.protein)}/${Math.round(d.carbs)}/${Math.round(d.fat)} vs ingredients ${Math.round(k/n)}/${Math.round(p/n)}/${Math.round(c/n)}/${Math.round(f/n)} (${Math.round(worst)}% out)`);
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
const KINDS = ["unmapped","banks-disagree","same-food-differs","no-unitG","bad-cat","macros-drift"];
console.log(`\n  ingredient registry — ${items.length} ingredient uses across ${RECIPES.length + PENDING.length} recipes`);
console.log(`  ${Object.keys(IM).length} macro keys · ${ING.length} registry rows · ${groups.size} distinct foods\n`);
if (!problems.length) { console.log("  PASS  every ingredient identified, both registries agree, all macros reconcile\n"); process.exit(0); }
for (const kind of KINDS) {
  const list = problems.filter(p => p.kind === kind);
  if (!list.length) continue;
  console.log(`  ${kind.toUpperCase()} (${list.length})`);
  for (const p of list.slice(0, 20)) console.log(`    - ${p.msg}`);
  if (list.length > 20) console.log(`    ... and ${list.length - 20} more`);
  console.log("");
}
console.log(`  ${problems.length} problem(s)\n`);
process.exit(1);
