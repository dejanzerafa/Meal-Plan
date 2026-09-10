#!/usr/bin/env node
// fix-groupA-2026-09-10.mjs — the 18 recipes that could not be cooked as written.
//
// Four kinds of fix, chosen per recipe:
//
//   ADD THE INGREDIENT      where the dish is named for it or cannot work
//                           without it. m190 is "Spicy Lentil Tacos" with no
//                           lentils; m142 is "with Garlic Green Beans" with no
//                           garlic. Macros recompute.
//   CHANGE THE INGREDIENT   where the recipe describes a different product.
//                           bf26 plates raw Atlantic salmon cold and calls it
//                           smoked; the honest fix is smoked salmon.
//   ADD THE COOKING STEP    where a component is never cooked. m165 spreads
//                           sweet potato mash that was never boiled or mashed;
//                           m184 would have you eat raw dried lentils. Both
//                           already describe the missing step in a NOTE.
//   DROP THE MENTION        where the method calls for a trace seasoning or
//                           garnish that is not in the list. Adding butter,
//                           coconut or a shallot relish to the shopping list
//                           for a garnish is worse than not mentioning it.
import { readRecipes, editRecipe, setSteps, writeFile, blockRange } from "../scripts/lib/recipe-file.mjs";

const DRY = process.argv.includes("--dry");
let f = readRecipes();
let src = f.src;
const report = [];

// ── helpers ─────────────────────────────────────────────────────────────────
const stepsOf = (source, id) => {
  const m = source.match(new RegExp(`\\bid:\\s*"${id}"[\\s\\S]*?steps:\\s*\\[([\\s\\S]*?)\\n        \\]`));
  if (!m) throw new Error(`${id}: steps not found`);
  return JSON.parse("[" + m[1].replace(/,\s*$/, "") + "]");
};
/** Append an ingredient row + its INGREDIENT_MACROS entry, copying the macros
 *  from the shared ING_FLAT row so the two banks stay identical. */
function addIngredient(source, id, { key, label, qty, unit, cat, ingId, role, unitG }) {
  const reg = f.ING.find(r => r.id === ingId);
  if (!reg) throw new Error(`registry row ${ingId} not found`);
  // 1. the macro entry
  const anchor = source.indexOf("const INGREDIENT_MACROS = {");
  const insertAt = source.indexOf("\n", anchor) + 1;
  const macro = `  "${key}": {kcal:${reg.kcal}, p:${reg.p}, c:${reg.c}, f:${reg.f}${unitG ? `, unitG:${unitG}` : ""}},  // ${reg.name}\n`;
  source = source.slice(0, insertAt) + macro + source.slice(insertAt);
  // 2. the recipe row, after the last existing batchItem
  source = editRecipe(source, id, blk => {
    const m = blk.match(/^(\s*)\{ key:[\s\S]*?\n(\s*)\]/m);
    if (!m) throw new Error(`${id}: batchItems block not found`);
    const indent = m[1];
    const row = `${indent}{ key: "${key}", label: ${JSON.stringify(label)}, qty: ${qty}, unit: ${JSON.stringify(unit)}, cat: ${JSON.stringify(cat)}, ingId: ${ingId}${role ? `, role: ${JSON.stringify(role)}` : ""} },`;
    const lastItem = blk.lastIndexOf("{ key:");
    const lineEnd = blk.indexOf("\n", lastItem);
    return blk.slice(0, lineEnd + 1) + row + "\n" + blk.slice(lineEnd + 1);
  });
  return source;
}

// ── 1. ADD THE INGREDIENT ───────────────────────────────────────────────────
const ADD = [
  ["m142", { key: "m142_garlic", label: "Garlic clove", qty: 3, unit: "g", cat: "Aromatics", ingId: 108, role: "fixed" },
    'named "with Garlic Green Beans" and the method tosses the beans with garlic'],
  ["m190", { key: "m190_lentils", label: "Cooked lentils", qty: 150, unit: "g", cat: "Legumes", ingId: 312, role: "protein" },
    '"Spicy Lentil Tacos" had no lentils — the method fried them, the list never bought them'],
  ["m23",  { key: "m23_pepperoni", label: "Turkey pepperoni (sliced)", qty: 150, unit: "g", cat: "Protein", ingId: 285, role: "protein" },
    '"Pepperoni Pizza Pasta" sliced pepperoni it did not have'],
  ["sn12", { key: "sn12_lettuce", label: "Romaine lettuce", qty: 20, unit: "g", cat: "Vegetables", ingId: 112, role: "veg" },
    "the method tops the wrap with lettuce"],
];
for (const [id, item, why] of ADD) {
  src = addIngredient(src, id, item);
  report.push(`${id} — ADDED ${item.qty} ${item.unit} ${item.label} (${why})`);
}

// ── 2. CHANGE THE INGREDIENT ────────────────────────────────────────────────
{
  const id = "bf26", key = "bf26_salmon";
  const reg = f.ING.find(r => r.id === 31);   // Smoked Salmon
  src = editRecipe(src, id, blk => blk
    .replace(new RegExp(`(key: "${key}"[^\\n]*?)label: "[^"]*"`), `$1label: "Smoked salmon"`)
    .replace(new RegExp(`(key: "${key}"[^\\n]*?)ingId: \\d+`), `$1ingId: 31`));
  const macroRe = new RegExp(`^(\\s*"${key}":\\s*)\\{[^}]*\\}`, "m");
  if (!macroRe.test(src)) throw new Error("bf26 macro line not found");
  src = src.replace(macroRe, `$1{kcal:${reg.kcal}, p:${reg.p}, c:${reg.c}, f:${reg.f}}`);
  report.push("bf26 — raw Atlantic salmon → smoked salmon (the plate is cold and the title says smoked; nothing ever cooked it)");
}

// ── 3. ADD THE COOKING STEP ─────────────────────────────────────────────────
const PREPEND = [
  ["m165", "Boil or steam the sweet potato until soft, about 15 min, then drain and mash it with salt and pepper.", 1,
    "the method spread a mash that was never cooked or mashed"],
  ["m184", "Simmer the dried lentils in unsalted water for 18–20 min until just tender, then drain immediately.", 0,
    "the method never cooked them — as written you would eat raw dried lentils"],
];
for (const [id, step, at, why] of PREPEND) {
  const cur = stepsOf(src, id);
  if (cur.some(s => String(s) === step)) continue;
  const next = cur.slice(); next.splice(at, 0, step);
  src = setSteps(src, id, next);
  report.push(`${id} — cooking step added at position ${at + 1} (${why})`);
}

// ── 4. DROP OR CORRECT THE MENTION ──────────────────────────────────────────
const TEXT = [
  ["bf21", "Brown banana slices in a pan with a tiny bit of grass-fed butter and cinnamon — 2–3 min a side, until caramelised.",
           "Brown the banana slices in a dry non-stick pan with the cinnamon — 2–3 min a side, until caramelised in their own sugars.",
           "butter was never on the shopping list"],
  ["d4",   "Transfer to a bowl. Add oat flour, protein powder, matcha powder, and optional baking powder. Stir until thick and uniform.",
           "Transfer to a bowl. Add the oat flour, protein powder and matcha powder. Stir until thick and uniform.",
           "baking powder is not an ingredient"],
  ["ds3",  "Fill tart shells. Top with fresh mango slices and coconut.",
           "Fill the tart shells and top with the remaining fresh mango slices.",
           "coconut is not an ingredient"],
  ["ds5",  "Whisk in eggs, peanut butter, honey or maple syrup, and vanilla.",
           "Whisk in the eggs, peanut butter and honey.",
           "vanilla is not an ingredient, and the maple syrup alternative is not costed"],
  ["hol1", "Cube sweet potato into 2cm pieces. Toss with remaining olive oil, salt, and paprika.",
           "Cube the sweet potato into 2 cm pieces. Toss with the remaining olive oil, salt and pepper.",
           "paprika is not an ingredient"],
  ["m72",  "Plate with potatoes and bok choy. Top fish with lime and shallot relish.",
           "Plate with the sweet potato and bok choy. Finish the fish with a squeeze of lime.",
           "shallot is not an ingredient"],
  ["sn7",  "Scoop flesh and mash with garlic, a squeeze of lemon, and salt — your baba ganoush.",
           "Scoop out the flesh and mash it with the garlic and salt — that is your baba ganoush.",
           "lemon is not an ingredient"],
  ["sn7",  "Whisk the whey protein powder into the cold Greek yogurt with the remaining garlic and a squeeze of lemon — that's your tzatziki. Keep it cold; heat turns whey grainy.",
           "Whisk the whey protein powder into the cold Greek yogurt with the remaining garlic — that is your tzatziki. Keep it cold; heat turns whey grainy.",
           "lemon is not an ingredient"],
  ["sm3",  "Add water/ice and dates to blender base.",
           "Add a splash of water, a handful of ice and the dates to the blender base.",
           "made the unlisted base liquid explicit rather than implying a missing ingredient"],
  ["m46",  "Toss orzo with cucumber, tomatoes, olives, feta, lemon juice, .",
           "Toss the orzo with the cucumber, tomatoes, olives, feta, lemon juice and dried oregano.",
           "the step was truncated mid-sentence"],
  ["bf30", "Whisk 2 whole eggs and 4 egg whites together. at 200°C for 20 min or microwave until soft.",
           "Whisk the whole eggs and the liquid egg whites together with salt and pepper.",
           "a corrupted fragment left an orphan oven instruction"],
  ["bf30", "Whisk eggs with salt and pepper. Pour into a non-stick pan.",
           "Pour the eggs into a non-stick pan over medium-low heat.",
           "the whisking was duplicated once step 1 was repaired"],
  ["bf30", "As eggs begin to set, add spinach, sweet potato, and feta to one half.",
           "As the eggs begin to set, add the spinach and feta to one half.",
           "sweet potato is not an ingredient"],
  ["m23",  "Slice turkey pepperoni into rounds.",
           "Slice the turkey pepperoni into rounds.", "tidy now that the pepperoni exists"],
];
for (const [id, find, repl, why] of TEXT) {
  const cur = stepsOf(src, id);
  if (!cur.some(s => String(s) === find)) { report.push(`${id} — NOT MATCHED: ${find.slice(0, 55)}…`); continue; }
  src = setSteps(src, id, cur.map(s => String(s) === find ? repl : s));
  report.push(`${id} — ${why}`);
}

if (!DRY) writeFile(src);
console.log(`${report.length} change(s)${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
