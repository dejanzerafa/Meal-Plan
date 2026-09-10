#!/usr/bin/env node
// fix-promote-notes-2026-09-10.mjs
//
// Nine recipes kept an instruction that changes the outcome inside a 💡 tip.
//
// WHY THAT IS A PROBLEM NOW AND WAS NOT BEFORE
// ────────────────────────────────────────────
// On 2026-09-10 the tips were moved behind a collapsed "STORAGE & TIPS (n)"
// block, because 195 of 401 recipes carried more note text than method text.
// That was the right call — but it means a tip is no longer read in passing.
// "Salt the courgette noodles and pat dry" is not storage advice; skip it and
// you get watery garlic butter. It belongs in the method.
//
// Each promotion below is the note's OWN sentence, moved. The wording was
// already good; only its location was wrong. The remainder of the note stays.
//
// FOUR FLAGGED RECIPES ARE DELIBERATELY LEFT ALONE:
//   ds18, ds22  "chill / freeze in a single layer" — that IS storage advice.
//   ds20        "lay banana slices in a single layer" — assembly, not browning,
//               and step 2 already says to lay them over the top.
//   m37, m142   already promoted by fix-technique-2026-09-10.mjs.
import { readRecipes, setSteps, writeFile, verifyBlocks } from "../scripts/lib/recipe-file.mjs";

const DRY = process.argv.includes("--dry");
const file = readRecipes();
let src = file.src;
const report = [];

// id: { before: exact step to insert in front of, step: the promoted step,
//       note: exact note to replace, noteNow: what is left of it (null = drop) }
const P = {
  m69: { before: null, matchBefore: /pumpkin/i,
    step: "Spread the pumpkin cubes in a single layer with space between them — a crowded tray steams instead of roasting and you get pale, soft cubes with no caramelised edges.",
    note: "💡 Spread the pumpkin cubes in a single layer with space between them; a crowded tray steams instead of roasting and you get pale, soft cubes with no caramelised edges.", noteNow: null },
  m143: { matchBefore: /asparagus/i,
    step: "Snap the woody ends off the asparagus and lay the spears in a single layer so they roast rather than steam.",
    note: "💡 Snap the woody ends off the asparagus and lay spears in a single layer; thin tilapia fillets overcook in a heartbeat, so check at 12 minutes and stop when the flesh just turns opaque.",
    noteNow: "💡 Thin tilapia fillets overcook in a heartbeat, so check at 12 minutes and stop when the flesh just turns opaque." },
  m153: { matchBefore: /turkey/i,
    step: "Push the onion to one side and brown the turkey in a single layer without stirring — a crowded, stirred pan steams the meat grey instead of browning it.",
    note: "💡 Cook the onion until translucent, then push it aside and brown the turkey in a single layer without stirring; add the paprika and cumin with the zucchini so the spices bloom without burning.",
    noteNow: "💡 Add the paprika and cumin with the zucchini so the spices bloom without burning." },
  m156: { matchBefore: /zucchini noodles/i,
    step: "Salt the zucchini noodles and let them drain in a colander for 10 minutes, then pat them dry — skipping this leaves a watery garlic butter that slides off rather than clinging.",
    note: "💡 Salt the courgette noodles and let them drain in a colander for 10 minutes, then pat dry; skipping this leaves a watery garlic butter that slides off rather than clinging.", noteNow: null },
  m180: { matchBefore: /scoop|shell|eggplant/i,
    step: "Salt the scooped shells and leave them cut-side down for 10 minutes, then pat dry — this draws out bitter moisture and stops the boats collapsing in the oven.",
    note: "💡 Salt the scooped shells and leave them cut-side down for 10 minutes, then pat dry; this draws out bitter moisture and stops the boats collapsing in the oven.", noteNow: null },
  bf72: { matchBefore: /sweet potato/i,
    step: "Dice the sweet potato to 1 cm, spread it in a single layer and leave it undisturbed for the first 4 minutes — constant stirring stops a crust forming and the cubes steam instead.",
    note: "💡 Dice the sweet potato to 1 cm, spread in a single layer and leave it undisturbed for the first 4 minutes; constant stirring stops a crust forming and the cubes steam instead.", noteNow: null },
  m191: { matchBefore: /mushroom/i,
    step: "Cook the mushrooms hard in a single layer until browned before any broth goes in — crowded, they boil grey and rubbery.",
    note: "💡 Cook the mushrooms hard in a single layer until browned before adding the broth; crowding them in the pot means they boil grey and rubbery.", noteNow: null },
  sn36: { matchBefore: /chickpea/i,
    step: "Rinse and pat the chickpeas dry before dressing — the canning liquid waters down the lemon and oil.",
    note: "💡 Rinse and pat the chickpeas dry before dressing, otherwise the canning liquid waters down the lemon and oil. Salt the cucumber and drain for 10 minutes if prepping ahead.",
    noteNow: "💡 Salt the cucumber and drain for 10 minutes if prepping ahead." },
  sn38: { matchBefore: /zucchini/i,
    step: "Cut the zucchini into even batons, salt them for 15 minutes and pat dry before tossing with the oil — wet batons steam and the Parmesan crumb slides off.",
    note: "💡 Courgette holds a lot of water, so cut into even batons, salt them for 15 minutes and pat dry before tossing with oil; wet batons steam and the Parmesan crumb slides off.", noteNow: null },
};

for (const [rid, p] of Object.entries(P)) {
  const r = [...file.RECIPES, ...file.PENDING].find(x => x.id === rid);
  if (!r) throw new Error(`${rid}: not found`);
  let steps = (r.steps || []).slice();

  const ni = steps.findIndex(s => s.trim() === p.note.trim());
  if (ni < 0) throw new Error(`${rid}: note not found verbatim`);
  if (p.noteNow) steps[ni] = p.noteNow; else steps.splice(ni, 1);

  // Insert in front of the first step that actually handles the food.
  const at = steps.findIndex(s => !s.startsWith("💡") && !s.startsWith("💪") && p.matchBefore.test(s));
  if (at < 0) throw new Error(`${rid}: no anchor step matched ${p.matchBefore}`);
  steps.splice(at, 0, p.step);

  src = setSteps(src, rid, steps);
  report.push(`${rid}: promoted to step ${at + 1} — "${p.step.slice(0, 56)}…"${p.noteNow ? " (note trimmed)" : " (note removed)"}`);
}

const bad = verifyBlocks(src);
if (bad.length) throw new Error("block corruption:\n" + bad.join("\n"));
if (!DRY) writeFile(src);
console.log(`${report.length} promotion(s)${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
