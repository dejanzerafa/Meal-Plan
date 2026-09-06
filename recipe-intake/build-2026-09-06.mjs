#!/usr/bin/env node
// build-2026-09-06.mjs — the seven recipes approved from the 2026-09-06 intake
// (4 Instagram, 3 from the Real Food Ritual cookbook), plus five registry rows.
// Same bottom-up method as build-2026-09-05.mjs: perPortion is summed from
// batchItems against ING_FLAT; INGREDIENT_MACROS lines are emitted from the
// same rows; allergens come from the app's own detectAllergens.
// Run: node recipe-intake/build-2026-09-06.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(ROOT, "index.html"), "utf8");
const arrAt = (mark) => { const a = raw.indexOf(mark); const s = raw.indexOf("[", a); let d = 0, b = s; for (; b < raw.length; b++) { if (raw[b] === "[") d++; else if (raw[b] === "]") { d--; if (!d) break; } } return eval(raw.slice(s, b + 1)); };
const braceBody = (from) => { let d = 0, j = raw.indexOf("{", from); for (; j < raw.length; j++) { if (raw[j] === "{") d++; else if (raw[j] === "}") { d--; if (!d) break; } } return raw.slice(from, j + 1); };
const fnSrc = (n) => braceBody(raw.indexOf("function " + n));
const ING = arrAt("const ING_FLAT = [");
const ALLERGEN_MAP = arrAt("const ALLERGEN_MAP = [");
const detectAllergens = new Function("ALLERGEN_MAP", fnSrc("_allergenHit") + "\n" + fnSrc("detectAllergens") + "\nreturn detectAllergens;")(ALLERGEN_MAP);

// ── New registry rows (ids continue from 370) — per 100 g raw / as sold ──────
const NEW_ING = [
  // USDA FDC "Sausage, turkey, fresh, raw".
  { id: 371, name: "Turkey Breakfast Sausage (raw)", cat: "Protein & Meat", kcal: 155, p: 16.6, c: 1.5, f: 9.3 },
  // USDA FDC "Chorizo, pork and beef" (cured Spanish-style).
  { id: 372, name: "Chorizo (cured)", cat: "Protein & Meat", kcal: 455, p: 24.1, c: 1.9, f: 38.3 },
  // Manufacturer declarations for arborio cluster at 350–360 kcal.
  { id: 373, name: "Arborio Rice (dry)", cat: "Grains & Carbs", kcal: 355, p: 6.9, c: 78, f: 0.6 },
  // Ready-to-use chicken stock (carton), not bone broth (id 207 is 2.3 g protein).
  { id: 374, name: "Chicken Stock (ready-to-use)", cat: "Liquids", kcal: 5, p: 0.6, c: 0.5, f: 0.1 },
  // McCance & Widdowson "Cream, single" (18% fat).
  { id: 375, name: "Single Cream (18% fat)", cat: "Dairy", kcal: 193, p: 2.6, c: 3.9, f: 19 },
];
const ALL = [...ING, ...NEW_ING]; const byId = new Map(ALL.map(i => [i.id, i]));

const RECIPES = [
{ category: "salad", id: "m125", name: "🥗 Crispy Chicken Caesar Salad",
  subtitle: "Air fryer · 30 min", badge: "💨 Air Fryer", carb: "🍞 Sourdough", portions: 1,
  items: [
    ["chick",  "Chicken breast (raw)",            170, "g",  "Protein",    1],
    ["panko",  "Panko breadcrumbs",               7.5, "g",  "Carbs",     79],
    ["parmc",  "Parmesan (grated, for coating)",    6, "g",  "Dairy",     46],
    ["egg",    "Large eggs (beaten, for dipping)",0.25,"whole","Protein",  40],
    ["papri",  "Paprika",                         0.5, "g",  "Spices",   221],
    ["garpow", "Garlic powder",                   0.5, "g",  "Spices",   224],
    ["spray",  "Cooking spray (light)",             1, "g",  "Fats",     172],
    ["romain", "Romaine lettuce (chopped)",       100, "g",  "Vegetables",112],
    ["cucum",  "Cucumber (sliced)",                75, "g",  "Vegetables",111],
    ["chtom",  "Cherry tomatoes (halved)",       37.5, "g",  "Vegetables",110],
    ["sourdo", "Sourdough (cubed, toasted for croutons)", 15, "g", "Carbs", 327],
    ["parms",  "Parmesan (shaved)",               7.5, "g",  "Dairy",     46],
    ["greekyo","Greek yogurt (0% fat)",            45, "g",  "Dairy",     47],
    ["lemon",  "Lemon juice",                       4, "ml", "Condiments",150],
    ["dijon",  "Dijon mustard",                  1.25, "g",  "Condiments",184],
    ["worces", "Worcestershire sauce",           1.25, "ml", "Sauces",    185],
    ["garlic", "Garlic (grated)",                0.75, "g",  "Aromatics", 108],
  ],
  steps: [
    "Slice the chicken breast into two thin cutlets so it cooks through before the crust burns.",
    "Set up two bowls: beaten egg in one; panko, grated parmesan, paprika and garlic powder in the other.",
    "Dip each cutlet in egg, then press firmly into the crumb. Press — don't dust. Loose crumb falls off in the air fryer.",
    "Spray lightly and air-fry at 200°C for 10–12 min, turning once, until golden and 74°C inside. Cool before slicing so the crust stays on.",
    "Toast the sourdough cubes in the air fryer for the last 3–4 min for croutons.",
    "Whisk the yogurt, lemon, Dijon, Worcestershire and garlic with a pinch of salt and pepper. Thin with a teaspoon of water if it won't pour.",
    "Box the romaine, cucumber and tomatoes; add the sliced chicken on top; shaved parmesan over.",
    "💡 Keep the dressing and croutons in separate pots. Dress a Caesar the night before and you have soup by lunch.",
    "💡 The post said 43 g protein. 170 g of breast alone is 38 g — with the parmesan and yogurt it is 54. Trust the weights, not the caption.",
  ] },

{ category: "main", id: "m126", name: "🥘 Chorizo & Chicken One-Pot Rice",
  subtitle: "Stovetop · 35 min", badge: "🍳 Stovetop", carb: "🍚 Rice", portions: 1,
  items: [
    ["chick",  "Chicken breast (diced)",         133, "g",  "Protein",      1],
    ["choriz", "Chorizo (sliced)",                25, "g",  "Protein",    372],
    ["arbor",  "Arborio rice (dry)",              50, "g",  "Carbs",      373],
    ["stock",  "Chicken stock",                  200, "ml", "Liquids",    374],
    ["onion",  "Onion (finely diced)",            50, "g",  "Vegetables", 106],
    ["carrot", "Carrot (finely diced)",           33, "g",  "Vegetables", 117],
    ["celery", "Celery (finely diced)",           13, "g",  "Vegetables", 118],
    ["garlic", "Garlic (chopped)",                 2, "g",  "Aromatics",  108],
    ["oliveo", "Olive oil (extra virgin)",       4.7, "ml", "Fats",       160],
    ["smpapr", "Smoked paprika",                 0.5, "g",  "Spices",     238],
    ["spin",   "Baby spinach",                    20, "g",  "Vegetables", 121],
    ["blkpep", "Black pepper",                   0.3, "g",  "Spices",     226],
  ],
  steps: [
    "Heat the oil in a wide pan with a lid. Sweat the onion, carrot and celery with a pinch of salt for 3 min until the onion turns translucent, then add the garlic.",
    "Add the chorizo and cook 2 min until the fat starts to run orange. That fat is the seasoning for the whole pot — no need for more oil.",
    "Add the diced chicken and turn it in the chorizo fat until sealed on the outside, about 2 min. It finishes cooking under the lid with the rice — check a piece is white through (74°C) before boxing.",
    "Stir in the smoked paprika, pepper and the rice; toast the rice for 1 min, unrinsed, so it keeps its starch.",
    "Pour in the stock, scrape the base, bring to a simmer, cover, and leave on the lowest heat for 15 min. Do not stir — that is what makes a risotto gluey.",
    "Check the rice; if still firm, lid back on for 5 min. Then turn the heat up, add the spinach, lid on 60 s, stir through and cook 1 min more.",
    "Taste for salt (the chorizo and stock carry plenty) and box.",
    "💡 As posted this was two chorizo and no chicken: 44 g fat and 26 g protein a serving. One chorizo for flavour, chicken for the protein, and it becomes a real meal-prep main.",
    "💡 Reheat with a splash of water; the rice tightens in the fridge.",
  ] },

{ category: "breakfast", id: "bf42", name: "🌯 Turkey Sausage Breakfast Burrito Bowls",
  subtitle: "Oven + stovetop · 30 min", badge: "🌬️ Oven", carb: "🥔 Baby Potatoes", portions: 1,
  items: [
    ["eggs",   "Large eggs",                        2, "whole","Protein",   40],
    ["tsaus",  "Turkey breakfast sausage",         57, "g",  "Protein",    371],
    ["potato", "Baby potatoes (cubed)",           113, "g",  "Carbs",       69],
    ["blkbn",  "Black beans (drained)",            42, "g",  "Legumes",     94],
    ["redpep", "Red bell pepper (diced)",         37, "g",  "Vegetables", 104],
    ["grnpep", "Green bell pepper (diced)",       30, "g",  "Vegetables", 105],
    ["onion",  "Onion (diced)",                    19, "g",  "Vegetables", 106],
    ["chedrf", "Cheddar (reduced-fat, shredded)",  14, "g",  "Dairy",      344],
    ["pico",   "Pico de gallo",                    30, "g",  "Sauces",     205],
    ["oliveo", "Olive oil",                       3.5, "ml", "Fats",       160],
    ["smpapr", "Smoked paprika",                  0.5, "g",  "Spices",     238],
    ["garpow", "Garlic powder",                   0.5, "g",  "Spices",     224],
  ],
  steps: [
    "Toss the cubed potatoes with the oil, smoked paprika, garlic powder, salt and pepper. Roast at 220°C for 20–25 min until the edges crisp.",
    "Brown the turkey sausage in a dry non-stick pan, breaking it up, until no pink remains (74°C — it is raw poultry, not cured). Push to one side; soften the peppers and onion in the same pan for 3 min.",
    "Scramble the eggs gently and stop while they still look slightly wet — they finish cooking in the box and again when you reheat. Fully set now means rubber later.",
    "Warm the black beans through with the vegetables.",
    "Layer: potatoes, then sausage, eggs, beans and peppers. Cheddar over the top while it's warm.",
    "💡 Pico in a separate pot; it waters everything down if it sits.",
    "💡 Built with reduced-fat cheddar and one tablespoon of oil per four bowls, this is 510 kcal and 23 g fat. The post's version was 550 / 28 — not the 450 / 17 it claimed.",
  ] },

{ category: "main", id: "m127", name: "🐟 Honey Garlic Salmon Tray Bake",
  subtitle: "Oven · 30 min", badge: "🌬️ Oven", carb: "🥔 Baby Potatoes", portions: 1,
  items: [
    ["salmon", "Salmon fillet (raw)",             150, "g",  "Protein",     20],
    ["potato", "Baby potatoes (halved)",          200, "g",  "Carbs",       69],
    ["aspar",  "Asparagus (trimmed)",             150, "g",  "Vegetables", 114],
    ["honey",  "Honey",                            10, "g",  "Condiments", 195],
    ["soy",    "Soy sauce (low sodium)",           10, "ml", "Sauces",     180],
    ["garlic", "Garlic (grated)",                   3, "g",  "Aromatics",  108],
    ["oliveo", "Olive oil",                         5, "ml", "Fats",       160],
    ["lemon",  "Lemon (juice + wedges)",           10, "ml", "Condiments", 150],
    ["chilfl", "Chili flakes",                    0.3, "g",  "Spices",     227],
  ],
  steps: [
    "Toss the halved potatoes in the oil with salt and pepper and roast at 200°C for 15 min before anything else goes on the tray. Salmon and potatoes do not finish at the same time.",
    "Mix the honey, soy, garlic and chili flakes. Brush half over the salmon.",
    "Push the potatoes to one side, add the asparagus and the salmon skin-side down. Roast 10–12 min until the salmon flakes but is still pink in the centre.",
    "Brush the rest of the glaze over in the last 2 min so it sets sticky rather than burns.",
    "Squeeze the lemon over everything as it comes out.",
    "💡 150 g of salmon, not 180: the post's 520 kcal was really 609. At 150 g it lands close to where they said it would, with 38 g protein.",
    "💡 Reheat gently — 60% power — or cover and eat cold on the salad side of the box. Salmon blasted in a microwave goes chalky.",
  ] },

{ category: "main", id: "m128", name: "🧆 Greek Turkey Meatballs & Tzatziki Rice Bowl",
  subtitle: "Oven · 35 min", badge: "🌬️ Oven", carb: "🍚 Brown Rice", portions: 1,
  items: [
    ["turkey", "Ground turkey (93% lean, raw)",  150, "g",  "Protein",      5],
    ["panko",  "Panko breadcrumbs",               10, "g",  "Carbs",       79],
    ["garlic", "Garlic (minced)",                1.5, "g",  "Aromatics",  108],
    ["parsle", "Parsley (chopped)",                3, "g",  "Herbs",      229],
    ["oregan", "Oregano (dried)",                0.5, "g",  "Spices",     223],
    ["cumin",  "Cumin (ground)",                 0.3, "g",  "Spices",     222],
    ["oliveo", "Olive oil",                        3, "ml", "Fats",       160],
    ["brice",  "Brown rice (dry)",                50, "g",  "Carbs",       62],
    ["greekyo","Greek yogurt (0% fat)",            75, "g",  "Dairy",       47],
    ["cucum",  "Cucumber (grated, squeezed)",      50, "g",  "Vegetables", 111],
    ["dill",   "Dill (fresh)",                      1, "g",  "Herbs",      233],
    ["lemon",  "Lemon juice",                     2.5, "ml", "Condiments", 150],
    ["chtom",  "Cherry tomatoes (halved)",         50, "g",  "Vegetables", 110],
  ],
  steps: [
    "Cook the brown rice and let it steam dry with the lid off.",
    "Mix the turkey with the panko, garlic, parsley, oregano, cumin, ¼ tsp salt and plenty of pepper. Work it just until it holds — overworking makes meatballs bouncy.",
    "Roll into 5–6 balls per serving with wet hands, brush with the oil, and bake at 200°C for 18–20 min until 74°C inside and browned on top.",
    "Grate the cucumber, salt it, and squeeze it dry in your fist — this is the whole difference between tzatziki and yogurt soup. Stir into the yogurt with the dill and lemon.",
    "Rice in the box, meatballs on top, tomatoes alongside.",
    "💡 Tzatziki in its own pot; the meatballs reheat, it doesn't.",
    "💡 The book's version was 113 g of turkey and 'a side of veg or rice'. 150 g and the rice built in makes it a complete 42 g-protein main.",
  ] },

{ category: "main", id: "m129", name: "🥬 Spinach & Feta Stuffed Chicken with Roast Sweet Potato",
  subtitle: "Oven · 40 min", badge: "🌬️ Oven", carb: "🍠 Sweet Potato", portions: 1,
  items: [
    ["chick",  "Chicken breast (large)",          180, "g",  "Protein",      1],
    ["spin",   "Baby spinach (chopped)",           40, "g",  "Vegetables", 121],
    ["feta",   "Feta (crumbled)",                  20, "g",  "Dairy",       53],
    ["garlic", "Garlic (minced)",                 1.5, "g",  "Aromatics",  108],
    ["oregan", "Oregano (dried)",                 0.5, "g",  "Spices",     223],
    ["oliveo", "Olive oil",                         5, "ml", "Fats",       160],
    ["swpot",  "Sweet potato (cubed)",            150, "g",  "Carbs",       68],
    ["brocc",  "Broccoli florets",                100, "g",  "Vegetables", 100],
    ["lemon",  "Lemon juice",                       5, "ml", "Condiments", 150],
    ["blkpep", "Black pepper",                    0.3, "g",  "Spices",     226],
  ],
  steps: [
    "Toss the sweet potato in half the oil with salt and roast at 200°C; it needs 30 min, the chicken 25–30, so they go in together after the sweet potato has had a 5-min head start.",
    "Wilt the spinach with the garlic in a dry pan for 1–2 min, squeeze out the water, and mix with the feta, oregano and pepper.",
    "Cut a deep pocket along the thick side of the breast without going through. Pack the filling in and close with two toothpicks.",
    "Rub with the rest of the oil, season the outside, and bake 25–30 min until 74°C at the thickest point — a stuffed 180 g breast takes longer than a plain one. Rest 5 min before slicing or the filling walks out.",
    "Add the broccoli to the tray for the last 10 min.",
    "Lemon over the lot; toothpicks out before boxing.",
    "💡 Squeezing the spinach dry is not optional — wet spinach steams the pocket open and the feta leaks.",
  ] },

{ category: "main", id: "m130", name: "🍅 Creamy Tuscan Chicken & Rice",
  subtitle: "Stovetop · 30 min", badge: "🍳 Stovetop", carb: "🍚 Brown Rice", portions: 1,
  items: [
    ["chick",  "Chicken breast (raw)",            170, "g",  "Protein",      1],
    ["oliveo", "Olive oil",                         5, "ml", "Fats",       160],
    ["garlic", "Garlic (minced)",                   3, "g",  "Aromatics",  108],
    ["chtom",  "Cherry tomatoes (halved)",         60, "g",  "Vegetables", 110],
    ["sdtom",  "Sun-dried tomatoes (chopped)",     10, "g",  "Vegetables", 133],
    ["spin",   "Baby spinach",                     40, "g",  "Vegetables", 121],
    ["cream",  "Single cream (18%)",               30, "ml", "Dairy",      375],
    ["stock",  "Chicken stock",                    50, "ml", "Liquids",    374],
    ["parm",   "Parmesan (grated)",                 6, "g",  "Dairy",       46],
    ["brice",  "Brown rice (dry)",                 50, "g",  "Carbs",       62],
    ["itherb", "Italian herbs / oregano",         0.5, "g",  "Spices",     223],
  ],
  steps: [
    "Cook the brown rice.",
    "Butterfly the chicken into two thin pieces, season, and sear in the oil over medium-high for 4–5 min a side until golden and cooked through. Set aside.",
    "Same pan: garlic 30 s, then cherry and sun-dried tomatoes for 2 min until they start to collapse.",
    "Add the stock to lift the browned bits, then the cream and herbs. Simmer 2 min — it should coat a spoon, not pool.",
    "Stir in the spinach until it wilts, then the parmesan. Return the chicken and turn it in the sauce.",
    "Rice in the box, chicken and sauce over.",
    "💡 Stock plus a little single cream gives the same finish as ¼ cup of double cream at a third of the fat. The book's 'light cream or coconut milk' is where its 20 g fat came from.",
    "💡 The sauce thickens cold; loosen with a splash of water when reheating.",
  ] },
];

// ── Compute + emit (identical to build-2026-09-05) ───────────────────────────
const round1 = n => Math.round(n * 10) / 10; const out = []; const macroLines = [];
for (const r of RECIPES) {
  let kcal = 0, p = 0, c = 0, f = 0; const batchItems = [];
  for (const [suffix, label, qty, unit, cat, ingId] of r.items) {
    const ing = byId.get(ingId); if (!ing) throw new Error(`${r.id}: unknown ingId ${ingId} for "${label}"`);
    const grams = unit === "whole" ? qty * (ing.unitG || 0) : qty;
    if (unit === "whole" && !ing.unitG) throw new Error(`${r.id}: "${label}" whole without unitG`);
    kcal += ing.kcal * grams / 100; p += ing.p * grams / 100; c += ing.c * grams / 100; f += ing.f * grams / 100;
    const key = `${r.id}_${suffix}`; batchItems.push({ key, label, qty, unit, cat, ingId });
    macroLines.push(`    "${key}": { kcal: ${ing.kcal}, p: ${ing.p}, c: ${ing.c}, f: ${ing.f}${ing.unitG ? `, unitG: ${ing.unitG}` : ""} },`);
  }
  const n = r.portions; const perPortion = { kcal: Math.round(kcal / n), protein: round1(p / n), carbs: round1(c / n), fat: round1(f / n) };
  const atwater = perPortion.protein * 4 + perPortion.carbs * 4 + perPortion.fat * 9; const drift = Math.abs(atwater - perPortion.kcal) / perPortion.kcal;
  const allergens = detectAllergens({ batchItems, steps: r.steps, subtitle: r.subtitle }).map(a => a.name).sort();
  out.push({ ...r, items: undefined, perPortion, allergens, batchItems });
  console.log(`${r.id.padEnd(6)} ${String(perPortion.kcal).padStart(4)} kcal ${String(perPortion.protein).padStart(5)}P ${String(perPortion.carbs).padStart(5)}C ${String(perPortion.fat).padStart(5)}F  ${allergens.join(", ") || "(none)"}${drift > 0.08 ? `  ⚠ ATWATER ${(drift*100).toFixed(1)}%` : ""}`);
}
const esc = s => JSON.stringify(s);
const recipeBlocks = out.map(r => `    {
        category: ${esc(r.category)},
        id: ${esc(r.id)},
        name: ${esc(r.name)},
        subtitle: ${esc(r.subtitle)},
        badge: ${esc(r.badge)},
        carb: ${esc(r.carb)},
        portions: ${r.portions},
        perPortion: { kcal: ${r.perPortion.kcal}, protein: ${r.perPortion.protein}, carbs: ${r.perPortion.carbs}, fat: ${r.perPortion.fat} },
        allergens: [${r.allergens.map(esc).join(", ")}],
        batchItems: [
${r.batchItems.map(i => `            { key: ${esc(i.key)}, label: ${esc(i.label)}, qty: ${i.qty}, unit: ${esc(i.unit)}, cat: ${esc(i.cat)}, ingId: ${i.ingId} },`).join("\n")}
        ],
        steps: [
${r.steps.map(s => `            ${esc(s)},`).join("\n")}
        ],
    },`).join("\n");
const ingBlock = NEW_ING.map(i => `    { id: ${i.id}, name: ${esc(i.name)}, cat: ${esc(i.cat)}, kcal: ${i.kcal}, p: ${i.p}, c: ${i.c}, f: ${i.f}${i.unitG ? `, unitG: ${i.unitG}` : ""} },`).join("\n");
if (process.argv.includes("--emit")) {
  console.log("\n═══ ING_FLAT ═══\n" + ingBlock + "\n\n═══ INGREDIENT_MACROS ═══\n" + macroLines.join("\n") + "\n\n═══ PENDING_RECIPES ═══\n" + recipeBlocks + "\n\n═══ RECIPE_TIER_PENDING ═══\n    " + out.map(r => esc(r.id)).join(", ") + ",");
}
