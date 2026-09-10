#!/usr/bin/env node
// strip-nutrition-notes-2026-09-10.mjs
//
// Removes the 43 nutrition notes added on 2026-09-08: 21 💪 protein notes,
// 21 🍽️ serving/portion suggestions and 1 🟡 sodium note.
//
// WHY THEY GO
// The measurement that settled it: 195 of 401 recipes carried more note text
// than method text. Cauliflower Fried Rice had 227 characters of method against
// 976 of notes — four times more commentary than instruction, ending with a
// paragraph telling the cook the recipe they had just chosen "sits below what a
// main should carry". The protein number is already on the card, and the
// protein filter chips already steer people; a paragraph at the hob is the
// wrong instrument for both.
//
// Safety notes STAY: the rice rapid-cool note, the minced-meat doneness cue and
// the reheat clauses. Those can stop someone getting ill. Advice cannot.
//
// Pre-existing notes are untouched — the three older 💪 lines, the 🍽️ line, the
// 🟡 turmeric pairing, and all 678 💡 storage tips.
import { readRecipes, setSteps, writeFile } from "../scripts/lib/recipe-file.mjs";

const DRY = process.argv.includes("--dry");
// Anchored on the exact openings this round introduced, so an older note that
// happens to share a prefix is not swept up with them.
const MINE = [
  /^💪 Protein note:/,
  /^🍽️ Plate it:/,
  /^🟡 Sodium note:/,
];

const f = readRecipes();
let src = f.src, recipes = 0, lines = 0, chars = 0;
const byKind = {};

for (const r of f.ALL) {
  const keep = r.steps.filter(s => !MINE.some(re => re.test(String(s))));
  if (keep.length === r.steps.length) continue;
  for (const s of r.steps.filter(s => MINE.some(re => re.test(String(s))))) {
    const k = String(s).slice(0, 2).trim();
    byKind[k] = (byKind[k] || 0) + 1;
    lines++; chars += String(s).length;
  }
  src = setSteps(src, r.id, keep);
  recipes++;
}
if (!DRY) writeFile(src);
console.log(`${lines} note(s) removed from ${recipes} recipe(s), ${chars} characters${DRY ? " (dry)" : ""}`);
for (const [k, n] of Object.entries(byKind)) console.log(`  ${k}  ${n}`);
