#!/usr/bin/env node
// fix-nutrition-2026-09-08.mjs — the nutrition and quality findings.
//
//   A. A "main" of 200-280 kcal that is protein + veg with no carb is a good
//      dish on an incomplete plate. Rather than inflate the macros, it gets a
//      serving suggestion in the pattern the library already uses (m24, sn3):
//      what to add, and what it costs, explicitly not counted in the numbers.
//   B. A "main" with under 20 g of protein in a protein-focused app gets a
//      concrete protein suggestion instead of being quietly wrong.
//   C. Batch recipes with no instruction to divide the batch.
//   D. Methods of two steps, and two steps over 320 characters.
//   E. m24 stacks three high-sodium sauces.
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "index.html";
let src = readFileSync(PATH, "utf8");
const slice = (s, o, c) => { const i = src.indexOf(s); const a = src.indexOf(o, i); const b = src.indexOf(c, a); return src.slice(a, b + c.length); };
const IM = eval("(" + slice("const INGREDIENT_MACROS = {", "{", "\n};").replace(/\n};$/, "\n}") + ")");
const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
const PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
const ALL = [...RECIPES, ...PENDING];
const isNote = s => /^[\u{1F4A1}\u{1F7E1}\u{1F52C}\u{26A1}\u{1F4AA}\u{1F37D}\u{23F1}\u{1F634}]/u.test(String(s));
const gramsOf = it => { const md = IM[it.key] || {}; const u = String(it.unit || "g").toLowerCase(); return (u === "g" || u === "ml") ? it.qty : it.qty * (md.unitG || 0); };
const CARB = /rice|pasta|potato|quinoa|couscous|bread|tortilla|wrap|noodle|oats|barley|farro|bulgur|gnocchi|polenta|pita|bagel|falafel/i;
const report = [];

const PLATE_IT = "🍽️ Plate it: this is protein and vegetables, so add 150 g of cooked rice, 200 g of potatoes or 60 g (dry) of pasta to make it a full meal — about 195 kcal and 42 g of carbs, not counted in the numbers above.";
const PROTEIN_NOTE = p => `💪 Protein note: at ${p} g per portion this sits below what a main should carry. Add 150 g of 0% Greek yogurt on the side (+15 g protein, +90 kcal), 30 g of whey in water (+24 g, +120 kcal), or 100 g of grilled chicken breast (+31 g, +165 kcal) — none of which is counted in the numbers above.`;

// D. hand-written expansions — a two-step method is not a method
const EXPAND = {
  bf44: ["Spoon the Greek yogurt into a bowl and stir it smooth.",
         "Scatter the berries over the top.",
         "Add the granola and seeds last so they stay crisp, and eat straight away."],
  m131: ["Heat the oven to 200°C. Toss the potato cubes with the oil, salt and pepper and spread them on a tray in a single layer.",
         "Roast the potatoes 25 min, turning once, while you season the chicken with the garlic and herbs.",
         "Add the chicken to the tray and roast a further 20–25 min, until the thickest part reads 75°C.",
         "Steam or roast the broccoli for the last 10 min, then divide everything between the containers."],
  sn27: ["Whisk the Greek yogurt with the spices, lemon juice and a pinch of salt until smooth.",
         "Cut the carrots into sticks of roughly even thickness so they stay crisp in the box.",
         "Pack the dip separately from the carrots — dip poured over them goes watery within a day."],
  ds20: ["Spread the peanut butter across the rice cakes right to the edges.",
         "Slice the banana thinly and lay it over the top.",
         "Finish with the cinnamon and eat straight away — rice cakes soften within minutes once topped."],
  ds11: null,   // already rewritten in stage 3
};
// D. two steps that run over 320 characters
const SPLIT = {
  v8: [[/^(Blend cottage cheese[^]*?This is your cream sauce\.)\s*(.*)$/, (m0, a, b) => [a, b]]],
  bf4: [[/^([^]*?\.)\s*(Spread [^]*)$/, (m0, a, b) => [a, b]]],
};

function writeSteps(rid, steps) {
  const re = new RegExp(`\\bid:\\s*"${rid}"`, "g");
  const a = src.indexOf("const RECIPES ="), z = src.indexOf("\n];", src.indexOf("const PENDING_RECIPES"));
  let m, hits = []; while ((m = re.exec(src))) if (m.index > a && m.index < z) hits.push(m.index);
  if (hits.length !== 1) throw new Error(`${rid}: ${hits.length} id hits`);
  const start = Math.max(src.lastIndexOf("\n    {", hits[0]), src.lastIndexOf("\n{", hits[0])) + 1;
  const endA = src.indexOf("\n    },", hits[0]), endB = src.indexOf("\n    }\n", hits[0]);
  const end = (endA < 0 ? endB : endB < 0 ? endA : Math.min(endA, endB)) + 6;
  let blk = src.slice(start, end);
  if ((blk.match(/\bid:\s*"[a-z0-9_]+"/g) || []).length !== 1) throw new Error(`${rid}: block covers >1 recipe`);
  const stepsRe = /\bsteps:\s*\[[\s\S]*?\n        \]/;
  blk = blk.replace(stepsRe, () => "steps: [\n" + steps.map(s => "            " + JSON.stringify(s)).join(",\n") + "\n        ]");
  src = src.slice(0, start) + blk + src.slice(end);
}

for (const r of ALL) {
  let steps = r.steps.slice();
  const before = JSON.stringify(steps);
  const body = () => steps.filter(s => !isNote(s));
  const T = () => steps.join(" ");
  const pp = r.perPortion || {};
  const plate = (r.batchItems || []).reduce((s, i) => s + gramsOf(i), 0) / (r.portions || 1);
  const hasCarb = (r.batchItems || []).some(i => CARB.test(i.label || "") && gramsOf(i) / (r.portions || 1) >= 20);

  // D. expand a two-step method
  if (EXPAND[r.id]) { steps = [...EXPAND[r.id], ...steps.filter(isNote)]; report.push(`${r.id} — method expanded from ${body().length} steps to ${EXPAND[r.id].length}`); }

  // D. split an over-long step
  for (const [re, fn] of SPLIT[r.id] || []) {
    const i = steps.findIndex(s => !isNote(s) && s.length > 320 && re.test(s));
    if (i < 0) continue;
    const parts = steps[i].match(re) ? fn(...steps[i].match(re)) : null;
    if (parts && parts.every(Boolean)) {
      const wasLen = steps[i].length;
      steps.splice(i, 1, ...parts.map(x => x.trim()));
      report.push(`${r.id} — a ${wasLen}-character step split in two`);
    }
  }

  // A. light main, no carb
  if (r.category === "main" && !hasCarb && (pp.kcal < 300 || plate < 200) && (pp.protein ?? 0) >= 20
      && !/plate it:/i.test(T())) {
    steps.push(PLATE_IT);
    report.push(`${r.id} — serving suggestion added (${pp.kcal} kcal, ${Math.round(plate)} g plate, no carb)`);
  }
  // A2. light main that already HAS its carb — the portion itself is small, so
  // the answer is more of the same dish rather than something on the side.
  else if (r.category === "main" && hasCarb && (pp.kcal < 300 || plate < 200) && (pp.protein ?? 0) >= 20
      && !/plate it:/i.test(T())) {
    steps.push(`🍽️ Plate it: this is a light portion at ${pp.kcal} kcal and about ${Math.round(plate)} g of food. Scale the whole recipe by 1.5 for a full dinner, or keep it as written for a lunch and add a piece of fruit.`);
    report.push(`${r.id} — light-portion note added (${pp.kcal} kcal, ${Math.round(plate)} g plate, carb present)`);
  }
  // B. main with too little protein
  if (r.category === "main" && (pp.protein ?? 0) < 20 && !/protein note:/i.test(T())) {
    steps.push(PROTEIN_NOTE(pp.protein));
    report.push(`${r.id} — protein note added (${pp.protein} g per portion)`);
  }
  // C. batch with no portioning
  // Same predicate as the audit and the assertion, so all three agree on which
  // recipes are missing it.
  if ((r.portions || 1) > 2 && !/\b(portion|divide|distribute|split|container|serve|box|jar|store|among them|each (?:bowl|plate|wrap|tortilla|jar))\b/i.test(T())) {
    const at = steps.findIndex(isNote);
    const line = `Divide equally into ${r.portions} portions — weigh the batch and split by weight rather than by eye, or the macros drift from portion to portion.`;
    steps.splice(at < 0 ? steps.length : at, 0, line);
    report.push(`${r.id} — portioning step added (${r.portions} portions)`);
  }
  // E. sodium
  if (r.id === "m24" && !/sodium/i.test(T())) {
    steps.push("🟡 Sodium note: dark soy, Japanese soy and hoisin stack up fast. Use low-sodium soy for both, and add no extra salt — the sauces carry more than enough.");
    report.push("m24 — sodium note added (three high-sodium sauces)");
  }

  if (JSON.stringify(steps) !== before) writeSteps(r.id, steps);
}
if (!DRY) writeFileSync(PATH, src);
console.log(`${report.length} change(s)${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
