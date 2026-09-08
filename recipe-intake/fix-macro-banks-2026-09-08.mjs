#!/usr/bin/env node
// fix-macro-banks-2026-09-08.mjs — make the two macro banks agree on every
// nutrient, not just calories.
//
// INGREDIENT_MACROS drives the recipe card; ING_FLAT drives the ingredients tab
// and the shopping list. check-ingredients compared them on CALORIES ONLY at a
// 15% tolerance, so whole-wheat pasta could read 348 kcal in one bank and 354
// in the other (a pass) while its protein read 14 g against 20 g. Nine foods
// disagreed by more than 15% on protein, carbs or fat.
//
// Three kinds of fix, decided per food against reference values:
//
//   1. REGISTRY WRONG — the row is named for one form of the food and carries
//      another form's numbers. Corn and black beans are both labelled
//      "canned, drained" everywhere but the registry holds the fresh/boiled
//      figures. The registry row is corrected and every card follows.
//   2. DIFFERENT PRODUCT — m97/m101/m103 buy high-protein (legume) pasta and
//      were pointed at the wholewheat row. That is a real second product, so it
//      gets its own registry row and their macros do not move.
//   3. STRAY CARD — one or two recipes carry a variant of a value 30+ others
//      agree on. The card is aligned to the registry.
//
// perPortion is recomputed for every recipe whose numbers moved.
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "index.html";
let src = readFileSync(PATH, "utf8");
const slice = (s, o, c) => { const i = src.indexOf(s); const a = src.indexOf(o, i); const b = src.indexOf(c, a); return src.slice(a, b + c.length); };
const IM = eval("(" + slice("const INGREDIENT_MACROS = {", "{", "\n};").replace(/\n};$/, "\n}") + ")");
const ING = eval(slice("const ING_FLAT", "[", "\n];").replace(/\n];$/, "\n]"));

// ── 1. Registry rows that describe the wrong form of the food ───────────────
// USDA FoodData Central, per 100 g as drained.
const REGISTRY_FIX = {
  78: { kcal: 81, p: 2.6, c: 19.4, f: 0.6, why: 'row is named "canned, drained" but held the fresh/frozen kernel figures' },
  94: { kcal: 114, p: 7.5, c: 20.4, f: 0.4, why: 'row is named "canned, drained" but held the boiled-from-dry figures' },
};
// ── 2. A genuinely different product needs its own row ──────────────────────
const NEW_ROWS = [
  { id: 412, name: "High-Protein Pasta (dry)", cat: "Grains & Carbs", kcal: 354, p: 20, c: 63, f: 1.7 },
];
const REPOINT = { m97_pasta: 412, m101_pasta: 412, m103_pasta: 412 };
// Labels on the wholewheat row that claim to be high-protein: make the label
// say what the macros say.
const RELABEL = {
  m23_pasta: "Wholegrain pasta (dry)",
  v8_pasta: "Wholegrain pasta (dry)",
};

const report = [];
// ── Apply registry corrections ──────────────────────────────────────────────
for (const [id, fix] of Object.entries(REGISTRY_FIX)) {
  const row = ING.find(r => r.id === +id);
  const re = new RegExp(`\\{\\s*id:\\s*${id},[^}]*\\}`);
  const m = src.match(re);
  if (!m) throw new Error(`registry row ${id} not found`);
  let line = m[0];
  for (const k of ["kcal", "p", "c", "f"]) line = line.replace(new RegExp(`\\b${k}:\\s*-?[\\d.]+`), `${k}:${fix[k]}`);
  src = src.replace(re, () => line);
  report.push(`registry ${id} ${row.name}: ${row.kcal}/${row.p}/${row.c}/${row.f} → ${fix.kcal}/${fix.p}/${fix.c}/${fix.f} — ${fix.why}`);
  Object.assign(row, fix);
}
// ── Add the new rows ────────────────────────────────────────────────────────
for (const row of NEW_ROWS) {
  if (ING.some(r => r.id === row.id)) continue;
  // indexOf, not lastIndexOf — lastIndexOf searches BACKWARDS from the given
  // index, which planted the new row 23,000 lines past the end of the file,
  // outside ING_FLAT entirely.
  const anchor = src.indexOf("\n];", src.indexOf("const ING_FLAT"));
  const entry = `  {id:${row.id}, name:${JSON.stringify(row.name)}, cat:${JSON.stringify(row.cat)}, kcal:${row.kcal}, p:${row.p}, c:${row.c}, f:${row.f}},`;
  src = src.slice(0, anchor) + "\n" + entry + src.slice(anchor);
  ING.push(row);
  report.push(`registry ${row.id} ADDED ${row.name} ${row.kcal}/${row.p}/${row.c}/${row.f}`);
}
// ── Repoint and relabel the affected ingredient rows ────────────────────────
const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
const PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
const ALL = [...RECIPES, ...PENDING];
const ownerOf = key => ALL.find(r => (r.batchItems || []).some(i => i.key === key));

function editItemLine(rid, key, edit) {
  const re = new RegExp(`\\bid:\\s*"${rid}"`, "g");
  const a = src.indexOf("const RECIPES ="), z = src.indexOf("\n];", src.indexOf("const PENDING_RECIPES"));
  let m, hits = []; while ((m = re.exec(src))) if (m.index > a && m.index < z) hits.push(m.index);
  if (hits.length !== 1) throw new Error(`${rid}: ${hits.length} id hits`);
  const start = Math.max(src.lastIndexOf("\n    {", hits[0]), src.lastIndexOf("\n{", hits[0])) + 1;
  const endA = src.indexOf("\n    },", hits[0]), endB = src.indexOf("\n    }\n", hits[0]);
  const end = (endA < 0 ? endB : endB < 0 ? endA : Math.min(endA, endB)) + 6;
  let blk = src.slice(start, end);
  const lineRe = new RegExp(`^.*\\bkey:\\s*"${key}".*$`, "m");
  const line = blk.match(lineRe); if (!line) throw new Error(`${rid}: item ${key} not found`);
  blk = blk.replace(lineRe, () => edit(line[0]));
  src = src.slice(0, start) + blk + src.slice(end);
}
for (const [key, ingId] of Object.entries(REPOINT)) {
  const r = ownerOf(key); if (!r) throw new Error(`no recipe owns ${key}`);
  editItemLine(r.id, key, l => l.replace(/\bingId\s*:\s*\d+/, `ingId: ${ingId}`));
  report.push(`${r.id}/${key}: repointed to registry ${ingId} (${ING.find(x => x.id === ingId).name}) — macros unchanged`);
}
for (const [key, label] of Object.entries(RELABEL)) {
  const r = ownerOf(key); if (!r) { report.push(`RELABEL skipped, no recipe owns ${key}`); continue; }
  const old = (r.batchItems.find(i => i.key === key) || {}).label;
  editItemLine(r.id, key, l => l.replace(/\blabel:\s*"[^"]*"/, `label: ${JSON.stringify(label)}`));
  report.push(`${r.id}/${key}: label "${old}" → "${label}" (macros are wholewheat, so the label should be too)`);
}

// ── 3. Align every remaining stray card to its registry row ─────────────────
const macroBlockStart = src.indexOf("const INGREDIENT_MACROS = {");
const macroBlockEnd = src.indexOf("\n};", macroBlockStart);
const changedKeys = [];
for (const r of ALL) for (const it of r.batchItems || []) {
  const k = IM[it.key]; const f = ING.find(x => x.id === (REPOINT[it.key] ?? it.ingId));
  if (!k || !f) continue;
  // The invariant this establishes: a card's macros ARE its registry row's.
  // Anything that genuinely differs is a different product and needs its own
  // row (see High-Protein Pasta above) — that is what keeps the two banks from
  // drifting apart again.
  const off = ["kcal", "p", "c", "f"].some(fld => {
    const a = k[fld], b = f[fld];
    return a != null && b != null && Math.abs(a - b) > 0.001;
  });
  if (!off) continue;
  // Many entries carry a trailing `// Food name` comment, so the line does not
  // end at the brace.
  const lineRe = new RegExp(`^(\\s*)"?${it.key}"?\\s*:\\s*\\{[^}]*\\},?.*$`, "m");
  const region = src.slice(macroBlockStart, macroBlockEnd);
  const m = region.match(lineRe);
  if (!m) { report.push(`WARN could not find macro line for ${it.key}`); continue; }
  let line = m[0];
  const before = `${k.kcal}/${k.p}/${k.c}/${k.f}`;
  for (const [fld, val] of [["kcal", f.kcal], ["p", f.p], ["c", f.c], ["f", f.f]])
    line = line.replace(new RegExp(`\\b${fld}\\s*:\\s*-?[\\d.]+`), `${fld}:${val}`);
  const newRegion = region.replace(lineRe, () => line);
  src = src.slice(0, macroBlockStart) + newRegion + src.slice(macroBlockEnd);
  Object.assign(k, { kcal: f.kcal, p: f.p, c: f.c, f: f.f });
  changedKeys.push(it.key);
  report.push(`${r.id}/${it.key} "${it.label}": card ${before} → ${f.kcal}/${f.p}/${f.c}/${f.f} (registry ${f.id} ${f.name})`);
}

// ── Recompute perPortion wherever the numbers moved ─────────────────────────
const touched = new Set();
for (const r of ALL) for (const it of r.batchItems || [])
  if (changedKeys.includes(it.key) || REGISTRY_FIX[it.ingId]) touched.add(r.id);

const gramsOf = it => { const md = IM[it.key] || {}; const u = String(it.unit || "g").toLowerCase(); return (u === "g" || u === "ml") ? it.qty : it.qty * (md.unitG || 0); };
for (const rid of touched) {
  const r = ALL.find(x => x.id === rid);
  let k = 0, p = 0, c = 0, f = 0, covered = 0;
  for (const it of r.batchItems || []) { const md = IM[it.key]; if (!md) continue; const g = gramsOf(it); if (g <= 0) continue;
    covered++; k += md.kcal / 100 * g; p += md.p / 100 * g; c += md.c / 100 * g; f += md.f / 100 * g; }
  if (covered < 3) continue;
  const n = r.portions || 1;
  const now = { kcal: Math.round(k / n), protein: +(p / n).toFixed(1), carbs: +(c / n).toFixed(1), fat: +(f / n).toFixed(1) };
  const d = r.perPortion;
  if (Math.abs(now.kcal - d.kcal) < 1 && Math.abs(now.protein - d.protein) < 0.05 && Math.abs(now.carbs - d.carbs) < 0.05 && Math.abs(now.fat - d.fat) < 0.05) continue;
  const re = new RegExp(`\\bid:\\s*"${rid}"`, "g");
  const a = src.indexOf("const RECIPES ="), z = src.indexOf("\n];", src.indexOf("const PENDING_RECIPES"));
  let m, hits = []; while ((m = re.exec(src))) if (m.index > a && m.index < z) hits.push(m.index);
  const start = Math.max(src.lastIndexOf("\n    {", hits[0]), src.lastIndexOf("\n{", hits[0])) + 1;
  const endA = src.indexOf("\n    },", hits[0]), endB = src.indexOf("\n    }\n", hits[0]);
  const end = (endA < 0 ? endB : endB < 0 ? endA : Math.min(endA, endB)) + 6;
  let blk = src.slice(start, end);
  blk = blk.replace(/\bperPortion:\s*\{[^}]*\}/, `perPortion: {kcal:${now.kcal}, protein:${now.protein}, carbs:${now.carbs}, fat:${now.fat}}`);
  src = src.slice(0, start) + blk + src.slice(end);
  report.push(`${rid} perPortion ${d.kcal}/${d.protein}/${d.carbs}/${d.fat} → ${now.kcal}/${now.protein}/${now.carbs}/${now.fat}`);
}

if (!DRY) writeFileSync(PATH, src);
console.log(`${report.length} change(s)${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
