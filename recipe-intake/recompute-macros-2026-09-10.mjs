#!/usr/bin/env node
// Recompute perPortion for recipes whose ingredient rows changed in group A.
// The card's macros are always computed from the rows, never typed by hand.
import { readRecipes, editRecipe, writeFile } from "../scripts/lib/recipe-file.mjs";
const IDS = process.argv.slice(2).filter(a => !a.startsWith("--"));
const f = readRecipes();
let src = f.src;
const g = it => { const md = f.IM[it.key] || {}; const u = String(it.unit || "g").toLowerCase();
  return (u === "g" || u === "ml") ? it.qty : it.qty * (md.unitG || 0); };
for (const id of IDS) {
  const r = f.ALL.find(x => x.id === id);
  if (!r) throw new Error(`${id} not found`);
  let k = 0, p = 0, c = 0, fat = 0;
  for (const it of r.batchItems || []) {
    const md = f.IM[it.key]; if (!md) throw new Error(`${id}: no macros for ${it.key}`);
    const grams = g(it); if (grams <= 0) continue;
    k += md.kcal / 100 * grams; p += md.p / 100 * grams; c += md.c / 100 * grams; fat += md.f / 100 * grams;
  }
  const n = r.portions || 1;
  const now = { kcal: Math.round(k / n), protein: +(p / n).toFixed(1), carbs: +(c / n).toFixed(1), fat: +(fat / n).toFixed(1) };
  const was = r.perPortion;
  src = editRecipe(src, id, blk => blk.replace(/\bperPortion:\s*\{[^}]*\}/,
    `perPortion: {kcal:${now.kcal}, protein:${now.protein}, carbs:${now.carbs}, fat:${now.fat}}`));
  console.log(`  ${id}  ${was.kcal}/${was.protein}/${was.carbs}/${was.fat}  →  ${now.kcal}/${now.protein}/${now.carbs}/${now.fat}`);
}
writeFile(src);
