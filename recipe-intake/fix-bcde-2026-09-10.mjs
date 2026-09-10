#!/usr/bin/env node
// fix-bcde-2026-09-10.mjs — groups B, C, D and E from the full read of all 401.
//
//   B  the badge, carb tag or category contradicts the dish, so the filters lie
//   C  the name or subtitle promises something the recipe does not contain
//   D  a step is marked "not counted in the macros" when it IS counted
//   E  copy defects — garbled labels, brand names, stray or duplicated lines
//
// None of these change what the food is. A no-cook yogurt bowl badged "Stovetop"
// is simply wrong: it appears under the wrong filter and tells the user to heat
// something they never heat.
//
// NOT touched here: the "salad" category on snacks like roasted chickpeas. That
// looked like a defect in the read, but "salad" is this app's side/snack tab —
// 38 recipes use it that way deliberately.
import { readRecipes, editRecipe, setSteps, setItem, writeFile } from "../scripts/lib/recipe-file.mjs";

const DRY = process.argv.includes("--dry");
const f = readRecipes();
let src = f.src;
const report = [];
const q = JSON.stringify;

// ── B. badge / carb / category ──────────────────────────────────────────────
// [id, {badge, carb, category, subtitle}, why]
const META = [
  ["bf36", { badge: "💨 Air Fryer" }, "single-portion air-fryer box was badged Batch Prep"],
  ["bf39", { badge: "🍳 Stovetop", subtitle: "Stovetop · 10 min" }, "badged No Cook but step 1 simmers a compote"],
  ["bf41", { badge: "🥗 No-Cook" }, "normalise the duplicate ❄️ No Cook spelling"],
  ["bf44", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min" }, "badged Stovetop, nothing is cooked"],
  ["bf45", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min" }, "badged Stovetop, nothing is cooked"],
  ["bf58", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min + overnight" }, "overnight oats badged Stovetop · 8 hr"],
  ["ds8",  { badge: "🍳 Stovetop" }, "badged No Cook but the cherry topping is simmered"],
  ["ds17", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min" }, "badged Stovetop, nothing is cooked"],
  ["ds20", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min" }, "badged Stovetop, nothing is cooked"],
  ["d6",   { badge: "🌬️ Oven" }, "frying-pan icon on an oven badge"],
  ["m22",  { badge: "🌬️ Oven" }, "badged Stovetop; the main step is a 30 min roast"],
  ["m159", { badge: "🥗 No-Cook", subtitle: "No-cook · 10 min" }, "badged Blender, nothing is blended"],
  ["m170", { badge: "🥗 No-Cook", subtitle: "No-cook · 10 min" }, "badged Oven, nothing goes in an oven"],
  ["m172", { badge: "🥗 No-Cook", subtitle: "No-cook · 15 min" }, "badged Oven, the method is assembly"],
  ["m186", { badge: "🥗 No-Cook", subtitle: "No-cook · 20 min" }, "badged Stovetop, the method is assembly"],
  ["sm23", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min + 4 hr chill" }, "badged Blender; it is a stirred chia pudding"],
  ["sn12", { badge: "🥗 No-Cook", subtitle: "No-cook · 15 min" }, "badged Stovetop, nothing is cooked"],
  ["sn17", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min" }, "badged Stovetop, nothing is cooked"],
  ["sn19", { badge: "🥗 No-Cook", subtitle: "No-cook · 3 min" }, "badged Stovetop, nothing is cooked"],
  ["sn20", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min" }, "badged Stovetop, nothing is cooked"],
  ["sn21", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min" }, "badged Blender, no blender is used"],
  ["sn27", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min" }, "badged Blender, the method only whisks"],
  ["sn39", { badge: "🥗 No-Cook", subtitle: "No-cook · 10 min" }, "badged Stovetop, nothing is cooked"],
  ["sn40", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min" }, "badged Stovetop, nothing is cooked"],
  ["sn41", { badge: "🥗 No-Cook", subtitle: "No-cook · 8 min" }, "badged Stovetop, nothing is cooked"],
  ["v10",  { badge: "🌬️ Oven" }, "'Vegan Batch' is not a cooking method"],
  ["v11",  { badge: "🍳 Stovetop", subtitle: "Stovetop · 15 min · 4 servings" }, "'No Cook' but step 1 boils soba noodles"],
  // carb tags that name something the recipe does not contain
  ["bf16", { carb: "🍞 Toast" }, "tagged Brioche; the bread is whole wheat toast"],
  ["bf49", { carb: "🥗 Low Carb" }, "tagged Oats with no oats and 1.6 g carbs"],
  ["bf57", { carb: "🌾 Wholegrain" }, "tagged Low Carb at 37.8 g carbs"],
  ["bf68", { carb: "🍎 Apple" }, "tagged Banana though green apple is three times the weight"],
  ["m24",  { carb: "🥗 Low Carb" }, "tagged Cashew; there is no carb in the dish"],
  ["m148", { carb: "🥗 Low Carb" }, "tagged Oats for 2.8 g of binder in a 5.8 g-carb recipe"],
  ["sn25", { carb: "🥗 Low Carb" }, "tagged Oats with no oats"],
  ["sn38", { carb: "🥗 Low Carb" }, "tagged Toast for 3.1 g of breadcrumbs"],
  // categories
  ["bf3",  { category: "breakfast" }, "protein pancakes filed as dessert"],
  ["ds16", { category: "salad" }, "savoury air-fried tofu filed as dessert"],
  ["m183", { category: "smoothie" }, "a smoothie bowl filed as a main"],
  ["sn5",  { category: "salad" }, "a savoury watermelon and feta bowl filed as dessert"],
  ["sn26", { category: "main" }, "a simmered lentil stew filed as salad"],
];

// ── C. names and subtitles that promise something else ──────────────────────
const NAMES = [
  ["m41", { name: "🐷 Pork Tenderloin & Brown Rice" }, "named for jasmine rice; the recipe is brown rice"],
  ["sm8", { name: "🍫 Cocoa Date Protein Shake" }, "'Caramel Espresso' with no caramel, and the espresso is optional"],
  ["sm9", { name: "💜 Purple Berry Dream Smoothie" }, "'Acai' with no acai"],
];
const SUBTITLES = [
  ["m01", "Chicken · brown rice · mushrooms · peas & carrots · ~4 h 20 min"],
  ["m06", "Slow-cooked chicken · honey chipotle · brown rice · ~3 h 20 min"],
  ["m13", "Lean beef mince · brown rice · chipotle-lime sauce · bell peppers · ~35 min"],
  ["m18", "Mushroom, mustard & espresso sauce · Stovetop · ~25 min"],
  ["m29", "Lean beef · rice & cauliflower rice · ranch sauce · ~25 min"],
  ["m31", "Chicken breast · brown rice · broccoli · garlic-lemon · ~45 min"],
  ["m33", "99/1 turkey · brown rice · bell peppers · tomato base · ~30 min"],
  ["m39", "Turkey mince · brown rice · black beans · salsa · cumin · ~30 min"],
  ["m41", "Pork tenderloin · brown rice · green beans · Dijon-herb crust · ~40 min"],
  ["m42", "Tilapia · brown rice · mango salsa · cucumber · lime · ~35 min"],
  ["m45", "Chicken breast · red lentils · carrots · celery · turmeric-cumin broth · ~30 min"],
];

// ── D + E. step text ────────────────────────────────────────────────────────
// [id, find, replace, why]  — replace "" removes the line entirely
const STEPS = [
  // D: marked "not counted" when it is counted
  ["sm3", "Add coconut cream, peanut butter, protein powder, and salt. (optional — not counted in the macros)",
          "Add the coconut milk, peanut butter and protein powder with a pinch of salt.",
          "peanut butter and 40 g whey are core ingredients driving the stated 42.2 g protein"],
  ["sn4", "Quick-pickle carrot and onion in apple cider vinegar, salt, and a pinch of sugar — 10 min. (optional — not counted in the macros)",
          "Quick-pickle the carrot and onion in the apple cider vinegar with salt and a pinch of sugar — 10 min.",
          "the 20 ml cider vinegar it uses is a listed ingredient"],
  ["sn6", "Mix lime juice, fish/soy sauce, chili, and a pinch of sugar for dressing. (optional — not counted in the macros)",
          "Mix the lime juice and soy sauce with a pinch of chilli and sugar for the dressing.",
          "the lime juice and soy sauce are listed ingredients"],
  ["sn8", "Serve with Greek yogurt as sour cream and salsa or jalapeño verde. (optional — not counted in the macros)",
          "Serve with the Greek yogurt as sour cream. Salsa or jalapeño verde on the side is optional and not counted in the macros.",
          "the 40 g yogurt is listed and counted; only the salsa is extra"],
  // E: stray, duplicated and garbled copy
  ["bf25", "Season steak with salt & pepper. Sear 2–3 min each side to medium-rare.",
           "Season the beef tenderloin with salt and pepper. Sear 2–3 min each side to medium-rare.",
           "names the cut the recipe actually contains"],
  ["bf25", "Season the beef tenderloin and sear it 2–3 min per side for medium-rare, then rest before slicing.", "",
           "duplicate sear step after the dish was already plated (mine, 8 Sep)"],
  ["m07", "Portion rice into containers. Top with chicken, corn+pico mix, and sour cream. Sprinkle parmesan over each. mist the pan with cooking spray.",
          "Portion rice into containers. Top with chicken, corn and pico mix, and sour cream. Sprinkle parmesan over each.",
          "stray 'mist the pan with cooking spray' on a slow-cooker recipe"],
  ["m13", "Portion rice into containers. Top with beef-pepper mix and drizzle sauce. Finish with a sprinkle of parmesan. mist the pan with cooking spray.",
          "Portion rice into containers. Top with beef-pepper mix and drizzle over the sauce. Finish with a sprinkle of parmesan.",
          "same stray instruction"],
  ["bf16", "Toast brioche slices — 2–3 min.", "Toast the whole wheat bread — 2–3 min.", "no brioche in the recipe"],
  ["bf16", "Layer scrambled eggs on brioche, top with caramelised banana.",
           "Layer the scrambled eggs on the toast, then top with the caramelised banana.", "no brioche in the recipe"],
  ["hol5", "🎉 This is a special occasion recipe — richer macros than a standard SoulGainz main are intentional. To boost protein closer to 50 g, add an extra 100 g Greek yogurt per portion (+10 g protein, +65 kcal).",
           "💡 This is a special occasion recipe — richer macros than a standard SoulGainz main are intentional. To boost protein closer to 50 g, add an extra 100 g Greek yogurt per portion (+10 g protein, +65 kcal).",
           "an upsell note was sitting in the numbered method as step 9"],
  ["m90", "Garnish with spring onion. Keeps refrigerated up to 3 days. Note: salmon's fat is omega-3 (DHA/EPA) — the most anti-inflammatory fat you can eat.",
          "Garnish with spring onion. Keeps refrigerated up to 3 days.",
          "a nutrition aside moved out of the numbered method"],
  ["m18", "🌅 Morning-only meal: this recipe contains a double espresso. Consuming it in the afternoon or evening may disrupt sleep. Swap espresso for decaf if making this as a later meal.",
          "⏱️ Morning-only meal: this recipe contains a double espresso. Consuming it in the afternoon or evening may disrupt sleep. Swap espresso for decaf if making this as a later meal.",
          "a caffeine-timing note was numbered as a cooking step"],
  ["sn5", "Steam or defrost edamame — 4–5 min.",
          "Thaw the edamame, or steam it 4–5 min if it is frozen solid.",
          "leads with thawing so the No-Cook badge is honest"],
];
const ADD_NOTE = [
  ["m90", "🔬 Salmon's fat is omega-3 (DHA/EPA) — the most anti-inflammatory fat you can eat."],
];
// E: ingredient labels
const LABELS = [
  ["bf53", "bf53_wheatt", "Whole-wheat tortilla"],
  ["sn12", "sn12_graint", "Whole-grain tortillas"],
  ["sn15", "sn15_graint", "Whole-grain tortillas"],
  ["m144", "m144_grainp", "Whole-grain pita breads"],
];
const BRANDS = [
  [/Président Light mozzarella/g, "Light mozzarella"],
  [/Baladna skimmed milk/g, "Skimmed milk"],
  [/Silk Protein Milk \(skim\)/g, "Protein milk (skim)"],
  [/Hidden Valley Fat-Free Ranch/g, "Fat-free ranch dressing"],
];

// ── apply ───────────────────────────────────────────────────────────────────
for (const [id, fields, why] of [...META, ...NAMES]) {
  src = editRecipe(src, id, blk => {
    let out = blk;
    for (const [k, v] of Object.entries(fields)) {
      const re = new RegExp(`\\b${k}:\\s*"[^"]*"`);
      if (!re.test(out)) throw new Error(`${id}: field ${k} not found`);
      out = out.replace(re, `${k}: ${q(v)}`);
    }
    return out;
  });
  report.push(`${id} — ${Object.entries(fields).map(([k, v]) => `${k}→${v}`).join(", ")}  (${why})`);
}
for (const [id, sub] of SUBTITLES) {
  src = editRecipe(src, id, blk => blk.replace(/\bsubtitle:\s*"[^"]*"/, `subtitle: ${q(sub)}`));
  report.push(`${id} — subtitle rewritten: ${sub}`);
}
for (const [id, find, repl, why] of STEPS) {
  const r = f.ALL.find(x => x.id === id);
  const cur = (function () { // re-read this recipe's steps from the working copy
    const m = src.match(new RegExp(`\\bid:\\s*"${id}"[\\s\\S]*?steps:\\s*\\[([\\s\\S]*?)\\n        \\]`));
    return m ? JSON.parse("[" + m[1].replace(/,\s*$/, "") + "]") : r.steps;
  })();
  if (!cur.some(s => String(s) === find)) { report.push(`${id} — STEP NOT MATCHED: ${find.slice(0, 60)}…`); continue; }
  const next = repl === "" ? cur.filter(s => String(s) !== find) : cur.map(s => String(s) === find ? repl : s);
  src = setSteps(src, id, next);
  report.push(`${id} — ${why}`);
}
for (const [id, note] of ADD_NOTE) {
  const m = src.match(new RegExp(`\\bid:\\s*"${id}"[\\s\\S]*?steps:\\s*\\[([\\s\\S]*?)\\n        \\]`));
  const cur = JSON.parse("[" + m[1].replace(/,\s*$/, "") + "]");
  if (cur.some(s => String(s) === note)) continue;
  src = setSteps(src, id, [...cur, note]);
  report.push(`${id} — note re-added below the method`);
}
for (const [id, key, label] of LABELS) {
  try { src = setItem(src, id, key, { label }); report.push(`${id} — label fixed: ${label}`); }
  catch (e) { report.push(`${id} — LABEL KEY ${key} NOT FOUND (${e.message})`); }
}
let brands = 0;
for (const [re, to] of BRANDS) { const n = (src.match(re) || []).length; if (n) { src = src.replace(re, to); brands += n; } }
if (brands) report.push(`${brands} brand-name mentions replaced with generic labels`);

if (!DRY) writeFile(src);
console.log(`${report.length} change(s)${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
