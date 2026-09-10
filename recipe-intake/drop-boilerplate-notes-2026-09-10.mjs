#!/usr/bin/env node
// drop-boilerplate-notes-2026-09-10.mjs
//
// Removes the two supplement lines that were pasted onto recipe after recipe:
//
//   💡 "Add 2.5 g fresh grated ginger (or 1.5 g ground) — reduces post-workout
//      muscle soreness (DOMS) and supports digestion."          × 104 recipes
//   🟡 "Add 0.5 g turmeric and a pinch of black pepper while cooking —
//      activates curcumin absorption (piperine effect)…"        ×  61 recipes
//
// One wording each, repeated verbatim, with no connection to the dish it sits
// on: the ginger line appears on a beef pasta skillet and a chicken quesadilla
// alike. Read once it is advice; read on the 40th recipe it is wallpaper, and it
// competes with the method for the cook's attention — 195 of 401 recipes carried
// more note text than method text.
//
// The advice itself is not wrong, and if it is worth making it is worth making
// once, in one place, rather than 165 times on cards where it is incidental.
import { readRecipes, setSteps, writeFile } from "../scripts/lib/recipe-file.mjs";

const DRY = process.argv.includes("--dry");
const GINGER = /^💡 Add 2\.5 g fresh grated ginger/;
const TURMERIC = /^🟡 Add 0\.5 g turmeric/;

const f = readRecipes();
let src = f.src, recipes = 0, ginger = 0, turmeric = 0, chars = 0, emptied = 0;
for (const r of f.ALL) {
  const keep = r.steps.filter(s => !GINGER.test(String(s)) && !TURMERIC.test(String(s)));
  if (keep.length === r.steps.length) continue;
  for (const s of r.steps) {
    if (GINGER.test(String(s))) { ginger++; chars += String(s).length; }
    if (TURMERIC.test(String(s))) { turmeric++; chars += String(s).length; }
  }
  if (!keep.some(s => /^[\u{1F4A1}\u{1F7E1}\u{1F52C}\u{26A1}\u{1F4AA}\u{1F37D}\u{23F1}\u{1F634}]/u.test(String(s)))) emptied++;
  src = setSteps(src, r.id, keep);
  recipes++;
}
if (!DRY) writeFile(src);
console.log(`${ginger} ginger + ${turmeric} turmeric lines removed from ${recipes} recipes (${chars} chars)${DRY ? " (dry)" : ""}`);
console.log(`${emptied} of those recipes now carry no notes at all`);
