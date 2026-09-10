#!/usr/bin/env node
// apply-protein-lift-2026-09-10.mjs
//
// Raises 80 staged recipes that sat below their category's live protein floor.
//
// WHY THIS EXISTS
// ───────────────
// Whey was added to smoothies during intake, but nothing equivalent was done for
// the other categories, so 80 staged recipes shipped below the floor their own
// category already held. This is the correction.
//
// Every addition lands in THREE places, because an earlier attempt at this kind
// of change put food in the method that the ingredient list never bought:
//   1. a batchItems row          → the ingredients tab and the shopping list
//   2. an INGREDIENT_MACROS key  → the recipe card's macros
//   3. a method step             → so the cook is actually told to use it
// perPortion is then RECOMPUTED from the ingredients, never hand-written.
//
// The macro key copies its numbers from the ING_FLAT row, exactly. That is the
// invariant check-ingredients enforces: a card's macros ARE its registry row's.
//
// Steps are inserted BEFORE any closing "Serve"/"Enjoy" line. A previous fixer
// appended to the end and produced recipes that said "Serve warm." and then
// "Stir in the yogurt."
import { readFileSync, writeFileSync } from "node:fs";
import { readRecipes, editRecipe, setSteps, setItem, writeFile, verifyBlocks, INDEX } from "../scripts/lib/recipe-file.mjs";
import { isNote } from "../scripts/lib/recipe-rules.mjs";

const DRY = process.argv.includes("--dry");
const props = JSON.parse(readFileSync(new URL("./protein-lift-2026-09-10.json", import.meta.url), "utf8"));
let file = readRecipes();
let src = file.src;
const ING = new Map(file.ING.map(i => [i.id, i]));
const report = [];

// Which shopping-list category each added food belongs to, and which allergen it
// carries. The allergen field is admin-facing (the card computes allergens live
// from the ingredients), but leaving it stale would make the two disagree.
const CAT = {42:"Dairy",47:"Dairy",48:"Dairy",281:"Dairy",52:"Dairy",210:"Supplements",341:"Protein",97:"Protein",96:"Legumes",41:"Protein",40:"Protein"};
const ALLERGEN = {42:"Dairy",47:"Dairy",48:"Dairy",281:"Dairy",52:"Dairy",210:"Dairy",341:"Soy",97:"Soy",96:"Soy",41:"Eggs",40:"Eggs"};

// Key from the DISTINCTIVE word, not the first six letters. "Fat-Free Cottage
// Cheese" and "Fat-Free Mozzarella" both begin "fatfre", and sn36 adds both —
// the naive slug collided and would have silently pointed one row at the
// other's macros.
const STOP = new Set(["fat", "free", "fatfree", "low", "reduced", "whole", "raw", "extra", "firm", "the", "and"]);
function slug(id, label, taken) {
  const words = label.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(w => w && !STOP.has(w));
  const stem = (words[0] || label.toLowerCase().replace(/[^a-z]/g, "")).slice(0, 6);
  let key = `${id}_${stem}`;
  for (let i = 2; taken(key); i++) key = `${id}_${stem.slice(0, 5)}${i}`;
  return key;
}
const CLOSER = /^(serve|enjoy|divide into containers|plate)/i;

for (const [rid, p] of Object.entries(props)) {
  const r = [...file.RECIPES, ...file.PENDING].find(x => x.id === rid);
  if (!r) throw new Error(`${rid}: not found`);
  const n = r.portions || 1;

  for (const [ingId, label, gPer] of p.add) {
    const row = ING.get(ingId);
    if (!row) throw new Error(`${rid}: registry row ${ingId} missing`);
    const batchG = +(gPer * n).toFixed(1);
    const existing = (r.batchItems || []).find(i => i.ingId === ingId);

    if (existing) {
      // A qty bump, never a second row for the same food — two yogurts on one
      // shopping list is the bug this avoids.
      const now = +(existing.qty + batchG).toFixed(1);
      src = setItem(src, rid, existing.key, { qty: now });
      existing.qty = now;
      report.push(`${rid}: ${existing.key} "${existing.label}" ${existing.qty - batchG} → ${now} g (+${gPer} g/portion)`);
    } else {
      const key = slug(rid, label, k => !!file.IM[k]);
      if (file.IM[key]) throw new Error(`${rid}: macro key ${key} already exists`);
      const cat = CAT[ingId] || row.cat || "Protein";
      const line = `            { key: "${key}", label: ${JSON.stringify(label)}, qty: ${batchG}, unit: "g", cat: ${JSON.stringify(cat)}, ingId: ${ingId} },`;
      src = editRecipe(src, rid, blk => {
        const m = blk.match(/^.*\bbatchItems:\s*\[\s*$/m);
        if (!m) throw new Error(`${rid}: batchItems array not found`);
        return blk.replace(m[0], m[0] + "\n" + line);
      });
      // Macros copied from the registry row, exactly — not looked up elsewhere.
      const imLine = `    ${JSON.stringify(key)}: { kcal: ${row.kcal}, p: ${row.p}, c: ${row.c}, f: ${row.f} },`;
      const anchor = src.indexOf("\n};", src.indexOf("const INGREDIENT_MACROS = {"));
      src = src.slice(0, anchor) + "\n" + imLine + src.slice(anchor);
      file.IM[key] = { kcal: row.kcal, p: row.p, c: row.c, f: row.f };
      r.batchItems.push({ key, label, qty: batchG, unit: "g", cat, ingId });
      report.push(`${rid}: + ${key} "${label}" ${batchG} g (${gPer} g/portion) → registry ${ingId} ${row.name}`);
    }
  }

  // ── the method step, inserted before any closing Serve/Enjoy line ──────────
  const steps = r.steps || [];
  const notes = steps.filter(isNote);
  let bodySteps = steps.filter(s => !isNote(s));
  const replaced = bodySteps.findIndex(s => p.replaces && s.trim() === p.replaces.trim());
  if (replaced >= 0) bodySteps[replaced] = p.step;
  else {
    let at = bodySteps.length;
    while (at > 0 && CLOSER.test(bodySteps[at - 1].trim())) at--;
    bodySteps.splice(at, 0, p.step);
  }
  // The non-veg option, where the dish takes it. A 💪 note, so detectAllergens
  // skips it — a suggestion is not an ingredient, and reading it would make a
  // vegetarian recipe declare meat.
  if (p.meat) {
    const [food, g] = p.meat.split(" | ");
    const d = p.meatMacros;
    bodySteps.push(`💪 Not vegetarian? Add ${g} g ${food} per portion — that adds ${d.kcal} kcal, ${d.p} g protein, ${d.c} g carbs and ${d.f} g fat.`);
  }
  src = setSteps(src, rid, [...bodySteps, ...notes]);
  r.steps = [...bodySteps, ...notes];
  report.push(`${rid}: step "${p.step.slice(0, 60)}…"${p.meat ? " + 💪 non-veg option" : ""}`);

  // ── allergens field, kept in step with what the recipe now contains ────────
  const want = new Set(r.allergens || []);
  for (const [ingId] of p.add) if (ALLERGEN[ingId]) want.add(ALLERGEN[ingId]);
  const next = [...want].sort();
  if (JSON.stringify(next) !== JSON.stringify(r.allergens || [])) {
    src = editRecipe(src, rid, blk => blk.replace(/\ballergens:\s*\[[^\]]*\]/, `allergens: [${next.map(a => JSON.stringify(a)).join(", ")}]`));
    report.push(`${rid}: allergens ${JSON.stringify(r.allergens || [])} → ${JSON.stringify(next)}`);
    r.allergens = next;
  }
}

// ── recompute perPortion from the ingredients ───────────────────────────────
for (const rid of Object.keys(props)) {
  const r = [...file.RECIPES, ...file.PENDING].find(x => x.id === rid);
  let k = 0, p = 0, c = 0, ft = 0, covered = 0;
  for (const it of r.batchItems || []) {
    const md = file.IM[it.key]; if (!md) continue;
    const u = String(it.unit || "g").toLowerCase();
    const g = (u === "g" || u === "ml") ? it.qty : it.qty * (md.unitG || 0);
    if (g <= 0) continue;
    covered++; k += md.kcal / 100 * g; p += md.p / 100 * g; c += md.c / 100 * g; ft += md.f / 100 * g;
  }
  if (covered < 3) throw new Error(`${rid}: only ${covered} ingredients resolved`);
  const n = r.portions || 1;
  const now = { kcal: Math.round(k / n), protein: +(p / n).toFixed(1), carbs: +(c / n).toFixed(1), fat: +(ft / n).toFixed(1) };
  const d = r.perPortion;
  src = editRecipe(src, rid, blk => blk.replace(/\bperPortion:\s*\{[^}]*\}/, `perPortion: {kcal:${now.kcal}, protein:${now.protein}, carbs:${now.carbs}, fat:${now.fat}}`));
  report.push(`${rid}: perPortion ${d.kcal}/${d.protein}/${d.carbs}/${d.fat} → ${now.kcal}/${now.protein}/${now.carbs}/${now.fat}`);
}

const bad = verifyBlocks(src);
if (bad.length) throw new Error("block corruption:\n" + bad.join("\n"));
if (!DRY) writeFile(src);
console.log(`${report.length} change(s)${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
