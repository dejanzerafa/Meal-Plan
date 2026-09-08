#!/usr/bin/env node
// fix-methods-2026-09-08.mjs — recipes that misstate themselves.
//
//   A. A cooking step with neither a time, a doneness cue, nor a "per packet"
//      deferral. "Cook brown rice." is not an instruction — brown rice is
//      35-40 min and white is 12, and a first-time cook has no way to know.
//   B. An ingredient on the shopping list that the method never uses.
//   C. A method naming a cut the recipe does not contain.
//   D. Oven and air-fryer steps with no temperature.
//   E. Two rows of the same registry food in one recipe.
//   F. bf68's 960 g of ice per portion.
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "index.html";
let src = readFileSync(PATH, "utf8");
const slice = (s, o, c) => { const i = src.indexOf(s); const a = src.indexOf(o, i); const b = src.indexOf(c, a); return src.slice(a, b + c.length); };
const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
const PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
const ALL = [...RECIPES, ...PENDING];
const isTip = s => /^[\u{1F4A1}\u{1F7E1}\u{23F1}\u{1F52C}\u{26A1}\u{1F4AA}\u{1F37D}]/u.test(s);
const report = [];

// ── A. Times, by what is being cooked ───────────────────────────────────────
// Written against how long these actually take, not a generic filler.
const TIMES = [
  [/\bbrown rice\b/i,                        "35–40 min"],
  [/\b(jasmine|basmati|white) rice\b/i,      "12–15 min"],
  [/\brice\b/i,                              "as the packet says, usually 12–15 min for white and 35–40 for brown"],
  [/\bquinoa\b/i,                            "15 min, then rest 5 min off the heat"],
  [/\b(pasta|penne|macaroni|rigatoni|tagliatelle|spaghetti|noodles?)\b/i, "to the packet time, usually 8–11 min"],
  [/\btoast\b.*\b(bread|sourdough|bagel|brioche|muffin|slices?)\b|\btoast (the |your )?\w+/i, "2–3 min"],
  [/\bmince\b|\bground (beef|lamb|pork|turkey|chicken)\b/i, "6–8 min"],
  [/\begg/i,                                 "2–3 min"],
  [/\bedamame\b/i,                           "4–5 min"],
  [/\b(broccoli|green beans|greens|vegetables|veg)\b/i, "4–5 min"],
  [/\bpotato/i,                              "20–25 min"],
  [/\bbanana\b/i,                             "2–3 min a side, until caramelised"],
  [/\bscramble\b/i,                           "2–3 min, pulling the pan off while they still look slightly wet"],
  [/\bmeatballs?\b/i,                         "4–5 min, turning, just to colour them"],
];
const DEFERS = /per (?:the )?(?:packet|package)|according to (?:the )?(?:packet|package)|packet instructions|package directions|to your liking|to your preference/i;
const CUE = /\buntil\b|\bto your\b|\d+\s*°C|no (?:longer )?pink|golden|tender|crisp|set\b|wilted|softened|fragrant|charred|opaque|shreds?/i;
const TIMED = /\d+\s*(?:min(?:ute)?s?|h(?:ou)?rs?|sec(?:ond)?s?)\b|overnight/i;
const COOK_IMPERATIVE = /^(?:then\s+|now\s+|next,?\s+|meanwhile,?\s+|carefully\s+|gently\s+|lightly\s+)?(cook|fry|saut[ée]|sear|brown|grill|bake|roast|boil|simmer|steam|poach|toast|air[- ]?fry|blanch|braise|scramble|griddle)\b/i;
const sentences = s => s.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);

// ── B/C/D/E/F: fixes that need a human decision are written out by hand ─────
const STEP_EDITS = {
  // an ingredient the method forgot
  m26: [[/\bMix well\. Fold in Gruyère\./, "Mix well. Fold in the Gruyère and the grated Parmigiano Reggiano."]],
  m30: [[/(Assemble|Layer|Build)([^.]*)\./i, (m0, a, b) => `${a}${b}, then scatter the fat-free cheddar over the top.`]],
  m29: [[/(Assemble|Layer|Build|Divide|Portion)([^.]*)\./i, (m0, a, b) => `${a}${b}, finishing with the fat-free mozzarella.`]],
};
const APPEND_STEP = {
  bf31: "Toast the wholewheat bread for 2–3 min and serve the omelette on top.",
  bf44: "Spoon the Greek yogurt into the bowl first, then add the toppings.",
  m133: "Add the minced garlic clove with the spices and fry 1 min until fragrant.",
  m139: "Whisk the sesame oil into the miso glaze before it goes on the salmon.",
  bf58: "Stir the cinnamon through the oats with the rest of the ingredients.",
  m181: "Scatter the shredded mozzarella over the top before it goes in the oven.",
  bf70: "Stir the honey and vanilla extract into the wet mixture before combining.",
  sm43: "Add the honeydew or cantaloupe to the blender with everything else.",
  ds11: "Combine the flour, cocoa powder, chocolate protein powder and sweetener in a bowl, then stir in the maple syrup and vanilla extract with the wet ingredients.",
  ds9: "Stir the brown sugar substitute into the batter with the other dry ingredients.",
  bf25: "Season the beef tenderloin and sear it 2–3 min per side for medium-rare, then rest before slicing.",
  m72_note: "",
  m172: "Warm the cooked farro or brown rice through, or use it straight from the fridge.",
};
// the method calls the food something the ingredient list does not
const RELABEL_ITEM = {
  m40: [["m40_chicken", null, /Portion thighs,/, "Portion the chicken,"]],
  m110: [["m110_chicken", null, /\bbreasts?\b/i, "thighs"]],
};

function writeRecipe(rid, { steps, items }) {
  const re = new RegExp(`\\bid:\\s*"${rid}"`, "g");
  const a = src.indexOf("const RECIPES ="), z = src.indexOf("\n];", src.indexOf("const PENDING_RECIPES"));
  let m, hits = []; while ((m = re.exec(src))) if (m.index > a && m.index < z) hits.push(m.index);
  if (hits.length !== 1) throw new Error(`${rid}: ${hits.length} id hits`);
  const start = Math.max(src.lastIndexOf("\n    {", hits[0]), src.lastIndexOf("\n{", hits[0])) + 1;
  const endA = src.indexOf("\n    },", hits[0]), endB = src.indexOf("\n    }\n", hits[0]);
  const end = (endA < 0 ? endB : endB < 0 ? endA : Math.min(endA, endB)) + 6;
  let blk = src.slice(start, end);
  if ((blk.match(/\bid:\s*"[a-z0-9_]+"/g) || []).length !== 1) throw new Error(`${rid}: block covers >1 recipe`);
  if (steps) {
    const stepsRe = /\bsteps:\s*\[[\s\S]*?\n        \]/;
    if (!stepsRe.test(blk)) throw new Error(`${rid}: steps block not found`);
    blk = blk.replace(stepsRe, () => "steps: [\n" + steps.map(s => "            " + JSON.stringify(s)).join(",\n") + "\n        ]");
  }
  for (const it of items || []) {
    const lineRe = new RegExp(`^.*\\bkey:\\s*"${it.key}".*$`, "m");
    const line = blk.match(lineRe); if (!line) throw new Error(`${rid}: item ${it.key} not found`);
    let l = line[0];
    if (it.qty != null) l = l.replace(/\bqty:\s*[\d.]+/, `qty: ${it.qty}`);
    if (it.label) l = l.replace(/\blabel:\s*"[^"]*"/, `label: ${JSON.stringify(it.label)}`);
    blk = blk.replace(lineRe, () => l);
  }
  src = src.slice(0, start) + blk + src.slice(end);
}

for (const r of ALL) {
  let steps = r.steps.slice();
  const before = JSON.stringify(steps);
  const items = [];

  // A. add a time to any untimed, uncued cooking step
  steps = steps.map(s => {
    if (isTip(s)) return s;
    if (!sentences(s).some(x => COOK_IMPERATIVE.test(x))) return s;
    if (TIMED.test(s) || DEFERS.test(s) || CUE.test(s)) return s;
    const hit = TIMES.find(([re]) => re.test(s));
    if (!hit) { report.push(`${r.id} — no time rule matched: "${s.slice(0, 60)}" (SKIPPED)`); return s; }
    const out = s.replace(/\s*$/, "").replace(/\.$/, "") + ` — ${hit[1]}.`;
    report.push(`${r.id} — timed: "${s.slice(0, 45)}" → "…${hit[1]}"`);
    return out;
  });

  // B. hand-written steps for ingredients the method forgot
  if (APPEND_STEP[r.id]) {
    const tipAt = steps.findIndex(isTip);
    const at = tipAt < 0 ? steps.length : tipAt;
    steps.splice(at, 0, APPEND_STEP[r.id]);
    report.push(`${r.id} — step added so a bought ingredient is actually used: "${APPEND_STEP[r.id].slice(0, 60)}…"`);
  }
  for (const [re, to] of STEP_EDITS[r.id] || []) {
    let done = false;
    steps = steps.map(s => { if (done || isTip(s) || !re.test(s)) return s; done = true; return s.replace(re, to); });
    if (done) report.push(`${r.id} — method now uses an ingredient it had ignored`);
  }
  // C. cuts
  for (const [, , re, to] of RELABEL_ITEM[r.id] || []) {
    let done = false;
    steps = steps.map(s => { if (done || isTip(s) || !re.test(s)) return s; done = true; return s.replace(re, to); });
    if (done) report.push(`${r.id} — method now names the cut the recipe actually contains`);
  }
  if (JSON.stringify(steps) !== before || items.length) writeRecipe(r.id, { steps, items });
}

// F. bf68's ice
{
  const r = ALL.find(x => x.id === "bf68");
  const ice = (r.batchItems || []).find(i => /ice/i.test(i.label || ""));
  if (ice && ice.qty > 300) {
    writeRecipe("bf68", { items: [{ key: ice.key, qty: 120, label: ice.label }] });
    report.push(`bf68 — ice ${ice.qty} g → 120 g per portion (960 g is eight standard trays in one smoothie)`);
  }
}
if (!DRY) writeFileSync(PATH, src);
console.log(`${report.length} change(s)${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
