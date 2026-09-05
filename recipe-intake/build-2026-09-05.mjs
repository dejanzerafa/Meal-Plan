#!/usr/bin/env node
// build-2026-09-05.mjs
//
// Generates the six recipes approved from the 2026-09-05 intake, plus the six
// new ingredient registry entries they need.
//
// Everything is computed BOTTOM-UP from ING_FLAT:
//   - perPortion is summed from the batchItems, never transcribed from the post
//   - INGREDIENT_MACROS entries are emitted FROM the ING_FLAT row for the same
//     ingId, so the two stores cannot disagree (which is the whole point of
//     scripts/check-ingredients.mjs)
//   - allergens come from the app's own detectAllergens, not a hand-written list
//
// Every source post's own macro claim was checked against this and 8 of 9 were
// wrong; see recipe-intake/TRIAGE-2026-09-05.md. The computed values win.
//
// Run: node recipe-intake/build-2026-09-05.mjs

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(ROOT, "index.html"), "utf8");

// ── Pull ING_FLAT and the allergen detector out of the app ───────────────────
const arrAt = (mark) => {
  const a = raw.indexOf(mark);
  const s = raw.indexOf("[", a);
  let d = 0, b = s;
  for (; b < raw.length; b++) { if (raw[b] === "[") d++; else if (raw[b] === "]") { d--; if (!d) break; } }
  return eval(raw.slice(s, b + 1));
};
const braceBody = (from) => {
  let d = 0, j = raw.indexOf("{", from);
  for (; j < raw.length; j++) { if (raw[j] === "{") d++; else if (raw[j] === "}") { d--; if (!d) break; } }
  return raw.slice(from, j + 1);
};
const fnSrc = (n) => braceBody(raw.indexOf("function " + n));

const ING = arrAt("const ING_FLAT = [");
const ALLERGEN_MAP = arrAt("const ALLERGEN_MAP = [");
const detectAllergens = new Function("ALLERGEN_MAP",
  fnSrc("_allergenHit") + "\n" + fnSrc("detectAllergens") + "\nreturn detectAllergens;")(ALLERGEN_MAP);

// ─────────────────────────────────────────────────────────────────────────────
// NEW INGREDIENTS — ids continue from 364, the current maximum.
//
// Values per 100 g / 100 mL RAW or AS-SOLD, per the raw weight rule at the head
// of ING_FLAT. Sources named per row; nothing here is estimated from a recipe
// post, because the posts are what we are checking.
// ─────────────────────────────────────────────────────────────────────────────
const NEW_ING = [
  // Dry egg pasta with spinach. Between plain dry white pasta (371/13/74/1.5)
  // and dry egg noodles (384/14.2/71.3/4.4) — the spinach adds moisture and
  // very little else. Manufacturer declarations for tagliatelle secca agli
  // spinaci cluster at 355-362 kcal.
  { id: 365, name: "Spinach Tagliatelle (dry, egg)", cat: "Grains & Carbs", kcal: 358, p: 13, c: 69, f: 2.5 },

  // Weetabix Original, manufacturer declaration. One biscuit = 18.8 g, so
  // unitG lets the recipe read "2 biscuits" and still cost out correctly.
  { id: 366, name: "Weetabix (wheat biscuits)", cat: "Grains & Carbs", kcal: 362, p: 11.5, c: 68.4, f: 2, unitG: 18.8 },

  // USDA FoodData Central, "Crackers, graham, plain or honey".
  { id: 367, name: "Graham Crackers", cat: "Grains & Carbs", kcal: 423, p: 6.7, c: 77.7, f: 10.1 },

  // Coconut-flavoured high-protein DAIRY yogurt (not coconut-milk yogurt, which
  // is far higher fat and near-zero protein). Representative of the category;
  // the recipe states the assumption so a user with a different tub can adjust.
  { id: 368, name: "Coconut Protein Yogurt", cat: "Dairy & Eggs", kcal: 95, p: 10, c: 6, f: 3 },

  // Nonpareils / hundreds-and-thousands. Sugar plus a little vegetable fat.
  { id: 369, name: "Rainbow Sprinkles", cat: "Baking", kcal: 389, p: 0.2, c: 88, f: 4 },

  // Polyol-sweetened pancake syrup. Carbohydrate is largely non-glycaemic but
  // is declared as carbohydrate, so it is counted here rather than zeroed.
  { id: 370, name: "Maple Syrup (sugar-free)", cat: "Condiments", kcal: 30, p: 0, c: 12, f: 0 },
];

const ALL_ING = [...ING, ...NEW_ING];
const byId = new Map(ALL_ING.map(i => [i.id, i]));

// ─────────────────────────────────────────────────────────────────────────────
// RECIPES
//
// portions: mergeAllItems scales by (batchSize / recipe.portions), so
//   portions: 1  = author one serving, the app multiplies  → anything that
//                  scales linearly (bowls, pots, batter, individual bakes)
//   portions: N  = the quantities yield one tray of N       → tray bakes, which
//                  cannot be baked in fractional trays. Matches ds5, d5, d4.
// ─────────────────────────────────────────────────────────────────────────────
const RECIPES = [
{
  category: "main", id: "m124", name: "🍝 Spinach Tagliatelle Bolognese",
  subtitle: "Stovetop · 40 min", badge: "🍳 Stovetop", carb: "🍝 Pasta", portions: 1,
  items: [
    // Named as egg pasta deliberately. Dried tagliatelle is usually made with
    // egg, the 13 g protein figure assumes it, and "Eggs" is an EU FIC allergen
    // — leaving it ambiguous would under-declare, which is the one direction an
    // allergen list must never err in.
    ["tagli",  "Spinach tagliatelle (dry, egg pasta)", 80, "g", "Carbs",  365],
    ["beef",   "Beef mince (5% fat, raw)",     100,  "g",  "Protein",      6],
    ["passat", "Crushed tomatoes / passata",   125,  "g",  "Vegetables", 187],
    ["onion",  "Onion (diced)",                 38,  "g",  "Vegetables", 106],
    ["carrot", "Carrot (finely diced)",         30,  "g",  "Vegetables", 117],
    ["celery", "Celery (diced)",                20,  "g",  "Vegetables", 118],
    ["garlic", "Garlic (minced)",              2.5,  "g",  "Vegetables", 108],
    ["tompas", "Tomato paste",                   8,  "g",  "Condiments", 186],
    ["oliveo", "Olive oil (extra virgin)",     3.5,  "ml", "Fats",       160],
    ["oregan", "Oregano (dried)",             0.25,  "g",  "Spices",     223],
    ["basil",  "Basil (fresh, torn)",            2,  "g",  "Spices",     231],
    ["parsle", "Parsley (fresh, chopped)",       1,  "g",  "Spices",     229],
  ],
  steps: [
    "Heat the olive oil in a wide pan and soften the onion, carrot and celery over medium heat for 6–8 min. Do not rush this — the sweetness of the sauce comes from here, not from sugar.",
    "Add the garlic and cook 1 min only, until fragrant.",
    "Add the beef mince and brown it thoroughly, breaking it up as it goes. Let it catch slightly on the pan before stirring.",
    "Stir in the tomato paste and cook it out for a minute, then add the crushed tomatoes and oregano.",
    "Simmer uncovered 20–30 min until rich and thick. It should mound on a spoon, not run off it.",
    "Cook the tagliatelle until al dente, drain, and divide into containers.",
    "Spoon the bolognese over the pasta, finish with the torn basil and parsley.",
    "💡 Keep the pasta and sauce in separate compartments if you can. Reheated together from day one, the pasta keeps absorbing sauce and turns soft by day three.",
    "💡 A splash of the starchy pasta water stirred into the sauce helps it cling instead of sliding off.",
  ],
},
{
  category: "dessert", id: "ds8", name: "🍒 Protein Cherry Cheesecakes",
  subtitle: "No-bake · 20 min + chill", badge: "❄️ No Cook", carb: "🍒 Cherry", portions: 1,
  items: [
    ["greekyo", "Greek yogurt (0% fat)",       125, "g", "Dairy",      47],
    ["creaml",  "Cream cheese (light)",         25, "g", "Dairy",      54],
    ["creamff", "Cream cheese (fat-free)",      25, "g", "Dairy",     282],
    ["whey",    "Vanilla whey protein",         10, "g", "Protein",   210],
    ["graham",  "Graham crackers (crushed)",    18, "g", "Carbs",     367],
    ["butter",  "Butter (melted)",               3, "g", "Fats",      162],
    ["cherry",  "Cherries (frozen or fresh)", 62.5, "g", "Fruits",    156],
    ["honey",   "Honey",                         5, "g", "Condiments",195],
    ["vanill",  "Vanilla extract",            1.25, "g", "Baking",    252],
    ["cornst",  "Cornstarch",                    2, "g", "Baking",    265],
  ],
  steps: [
    "Mix the crushed graham crackers with the melted butter and press firmly into the base of a small container. Press harder than feels necessary — a loose base falls apart when you spoon into it.",
    "Whisk the Greek yogurt, both cream cheeses, protein powder, honey and vanilla until completely smooth.",
    "Spoon the filling over the base and level the top.",
    "Simmer the cherries with a splash of water until they soften and release their juice.",
    "Stir the cornstarch into a little cold water first, then add to the cherries and cook until glossy and thick. Adding dry cornstarch straight to hot fruit gives you lumps.",
    "Cool the cherry topping completely before it goes anywhere near the filling, or it will melt straight through.",
    "Spoon over and refrigerate at least 3 hours.",
    "💡 Half light and half fat-free cream cheese is deliberate. All fat-free tastes thin and chalky; all light doubles the fat for no extra protein.",
    "💡 Keeps 3–4 days. Add the cherry layer on the day if you want the base to stay crisp.",
  ],
},
{
  category: "breakfast", id: "bf40", name: "🧇 Birthday Cake Protein Waffles",
  subtitle: "Waffle iron · 20 min", badge: "🍳 Stovetop", carb: "🌾 Oats", portions: 1,
  items: [
    ["oatflo", "Oat flour",                  40,   "g",     "Carbs",      80],
    ["whey",   "Vanilla whey protein",       20,   "g",     "Protein",   210],
    ["greekyo","Greek yogurt (0% fat)",      62.5, "g",     "Dairy",      47],
    ["eggs",   "Large eggs",                 0.5,  "whole", "Protein",    40],
    ["milk",   "Skimmed milk",               45,   "ml",    "Dairy",      50],
    ["sprink", "Rainbow sprinkles",           5,   "g",     "Baking",    369],
    ["bakpow", "Baking powder",               2,   "g",     "Baking",    250],
    ["vanill", "Vanilla extract",          1.25,   "g",     "Baking",    252],
    // 1 g, not 1.25 g. At 1.25 the fat total landed on exactly 7.85, a float
    // rounding boundary where Math.round gives 7.9 and toFixed gives 7.8 — so
    // the declared value and any independent recheck disagreed by 0.1 g forever.
    // Nutritionally meaningless, but it makes every future audit report a false
    // mismatch on this recipe. One second of spray is ~1 g anyway.
    ["spray",  "Cooking spray (light)",       1,   "g",     "Fats",      172],
    ["sfmapl", "Sugar-free maple syrup",     20,   "ml",    "Condiments",370],
    ["brownsub","Brown sugar substitute",     3,   "g",     "Condiments",260],
  ],
  steps: [
    "Combine the oat flour, protein powder and baking powder.",
    "Whisk the egg, yogurt, milk and vanilla together separately.",
    "Fold the wet into the dry — stop as soon as it comes together. Overmixing develops the oat starch and gives you a dense, rubbery waffle.",
    "Gently mix in the sprinkles last. Stir them early and the colour bleeds grey through the whole batter.",
    "Cook in a preheated, sprayed waffle iron until golden and it releases cleanly. Lifting the lid early tears the waffle in half.",
    "Warm the sugar-free maple syrup with the brown sugar substitute and a pinch of salt for the butterscotch note.",
    "Cool completely before boxing — a warm waffle steams itself soggy in a sealed container.",
    "💡 Keep the syrup in a separate pot and add it after reheating, not before.",
    "💡 Freezes individually between parchment squares. Straight into the toaster from frozen.",
  ],
},
{
  category: "dessert", id: "d6", name: "🍎 Baked Apple & Blueberry Crumble",
  subtitle: "Oven · 40 min", badge: "🍳 Oven", carb: "🍎 Apple", portions: 1,
  items: [
    ["apple",  "Apples (diced)",           150,  "g", "Fruits",    141],
    ["bluebe", "Blueberries",               50,  "g", "Fruits",    143],
    ["oats",   "Rolled oats",               30,  "g", "Carbs",      64],
    ["whey",   "Vanilla whey protein",      10,  "g", "Protein",   210],
    ["almflo", "Almond flour",             7.5,  "g", "Fats",       81],
    ["butter", "Butter (melted)",         3.75,  "g", "Fats",      162],
    ["maple",  "Maple syrup",             12.5,  "g", "Condiments",196],
    ["cinnam", "Cinnamon (ground)",          1,  "g", "Spices",    220],
    ["lemon",  "Lemon juice",             1.25,  "ml","Condiments",150],
    ["cornst", "Cornstarch",               0.7,  "g", "Baking",    265],
  ],
  steps: [
    "Heat the oven to 190°C.",
    "Toss the apples and blueberries with the cinnamon, lemon juice and cornstarch. The cornstarch is what stops the fruit juice flooding the dish and steaming the topping.",
    "Tip the fruit into a small oven-safe dish.",
    "Combine the oats, protein powder and almond flour in a bowl.",
    "Rub through the melted butter and maple syrup until the mixture clumps. Stop while it is still uneven — the loose and clumped bits together are what gives you crumble rather than a lid.",
    "Scatter over the fruit and bake 25–30 min until golden and bubbling at the edges.",
    "Cool before covering and refrigerating.",
    "💡 Add the protein powder to the crumble, never to the fruit. Heated in liquid it goes grainy.",
    "💡 Serve with Greek yogurt for another 10 g of protein.",
  ],
},
{
  category: "breakfast", id: "bf41", name: "🥥 Bounty Overnight Weetabix",
  subtitle: "No-cook · 5 min + overnight", badge: "❄️ No Cook", carb: "🌾 Wholegrain", portions: 1,
  items: [
    ["weetab", "Weetabix",                        2, "whole", "Carbs",   366],
    ["cocoyo", "Coconut protein yogurt",        200, "g",     "Dairy",   368],
    ["almmil", "Unsweetened almond milk",        55, "ml",    "Dairy",    58],
    ["greekyo","Greek yogurt (0% fat)",          25, "g",     "Dairy",    47],
    ["cocflk", "Desiccated coconut (unsweetened)",10,"g",     "Fats",    178],
    ["dark",   "Dark chocolate 85%",             10, "g",     "Baking",  255],
    ["banana", "Banana (sliced)",                60, "g",     "Fruits",  140],
  ],
  steps: [
    "Crush the Weetabix into a container, pour over 50 ml of the almond milk and mix until fully combined. Press everything down firmly to create the base.",
    "Add the coconut protein yogurt and sprinkle over the desiccated coconut.",
    "Melt the dark chocolate, then stir it together with the Greek yogurt and the remaining 5 ml of almond milk until smooth.",
    "Spread the chocolate mixture evenly over the coconut layer.",
    "Top with the sliced banana, lid on, and refrigerate overnight — or at least 4 hours.",
    "Crack through the chocolate top and eat cold.",
    "💡 Macros assume a coconut-flavoured high-protein DAIRY yogurt at roughly 10 g protein per 100 g. A coconut-milk yogurt is a different food — far more fat, almost no protein — and will change this recipe substantially.",
    "💡 Let the melted chocolate cool for a minute before mixing it into the cold yogurt, or it seizes into flecks instead of a smooth layer.",
  ],
},
{
  category: "dessert", id: "ds9", name: "🥕 Protein Carrot Cake",
  subtitle: "Oven · 45 min · makes 9", badge: "🍰 Baked", carb: "🥕 Carrot", portions: 9,
  items: [
    ["oatflo",  "Oat flour",                 180, "g",     "Carbs",     80],
    ["whey",    "Vanilla whey protein",       60, "g",     "Protein",  210],
    ["eggs",    "Large eggs",                  2, "whole", "Protein",   40],
    ["greekyo", "Greek yogurt (0% fat)",     200, "g",     "Dairy",     47],
    ["carrot",  "Carrot (finely grated)",    200, "g",     "Vegetables",117],
    ["milk",    "Skimmed milk",               80, "ml",    "Dairy",     50],
    ["maple",   "Maple syrup",                40, "g",     "Condiments",196],
    ["walnut",  "Walnuts (chopped)",          30, "g",     "Fats",     164],
    ["cinnam",  "Cinnamon (ground)",           4, "g",     "Spices",   220],
    ["ginger",  "Ginger (ground)",             1, "g",     "Spices",   241],
    ["bakpow",  "Baking powder",               4, "g",     "Baking",   250],
    ["baksod",  "Baking soda",               2.3, "g",     "Baking",   251],
    ["fgreek",  "Greek yogurt (0%) — frosting",180,"g",    "Dairy",     47],
    ["fcream",  "Cream cheese (light) — frosting",100,"g", "Dairy",     54],
    ["fwhey",   "Vanilla whey protein — frosting",15,"g",  "Protein",  210],
    ["fsweet",  "Brown sugar substitute",      5, "g",     "Condiments",260],
  ],
  steps: [
    "Heat the oven to 175°C and line a square baking dish.",
    "Combine the oat flour, protein powder, cinnamon, ginger, baking powder and baking soda.",
    "Whisk the eggs, yogurt, milk and maple syrup together.",
    "Fold the wet and dry mixtures together until just combined.",
    "Add the grated carrot and walnuts and fold through.",
    "Transfer to the lined dish and bake 25–30 min, until a skewer comes out with a few moist crumbs. Protein bakes go dry fast — pull it while it looks barely done.",
    "Cool completely. Frosting a warm cake slides it straight off.",
    "Whisk the frosting yogurt, cream cheese, protein powder and sweetener until smooth, then spread over the cooled cake.",
    "Cut into nine squares and finish with a few extra walnuts.",
    "💡 Grate the carrot finely. Coarse shreds stay firm and make the crumb stringy.",
    "💡 Keeps 4 days refrigerated. The frosting is yogurt-based, so this does not sit out at room temperature.",
  ],
},
];

// ── Compute ──────────────────────────────────────────────────────────────────
const round1 = n => Math.round(n * 10) / 10;
const out = [];
const macroLines = [];

for (const r of RECIPES) {
  let kcal = 0, p = 0, c = 0, f = 0;
  const batchItems = [];
  for (const [suffix, label, qty, unit, cat, ingId] of r.items) {
    const ing = byId.get(ingId);
    if (!ing) throw new Error(`${r.id}: unknown ingId ${ingId} for "${label}"`);
    // "whole" units cost out via unitG; everything else is per 100 g / 100 mL.
    const grams = unit === "whole" ? qty * (ing.unitG || 0) : qty;
    if (unit === "whole" && !ing.unitG) throw new Error(`${r.id}: "${label}" uses unit "whole" but ingId ${ingId} has no unitG`);
    kcal += ing.kcal * grams / 100;
    p    += ing.p    * grams / 100;
    c    += ing.c    * grams / 100;
    f    += ing.f    * grams / 100;
    const key = `${r.id}_${suffix}`;
    batchItems.push({ key, label, qty, unit, cat, ingId });
    const md = { kcal: ing.kcal, p: ing.p, c: ing.c, f: ing.f };
    if (ing.unitG) md.unitG = ing.unitG;
    macroLines.push(`    "${key}": { kcal: ${md.kcal}, p: ${md.p}, c: ${md.c}, f: ${md.f}${md.unitG ? `, unitG: ${md.unitG}` : ""} },`);
  }
  const n = r.portions;
  const perPortion = { kcal: Math.round(kcal / n), protein: round1(p / n), carbs: round1(c / n), fat: round1(f / n) };

  // Atwater sanity — declared kcal must agree with its own macros within 8%.
  const atwater = perPortion.protein * 4 + perPortion.carbs * 4 + perPortion.fat * 9;
  const drift = Math.abs(atwater - perPortion.kcal) / perPortion.kcal;
  const flag = drift > 0.08 ? `  ⚠ ATWATER DRIFT ${(drift * 100).toFixed(1)}%` : "";

  const allergens = detectAllergens({ batchItems, steps: r.steps, subtitle: r.subtitle })
    .map(a => a.name).sort();

  out.push({ ...r, items: undefined, perPortion, allergens, batchItems });
  console.log(`${r.id.padEnd(6)} p=${String(n).padEnd(2)} ${String(perPortion.kcal).padStart(4)} kcal  ${String(perPortion.protein).padStart(5)}P ${String(perPortion.carbs).padStart(5)}C ${String(perPortion.fat).padStart(5)}F   ${allergens.join(", ") || "(none)"}${flag}`);
}

// ── Emit ─────────────────────────────────────────────────────────────────────
const esc = s => JSON.stringify(s);
const recipeBlocks = out.map(r => {
  const items = r.batchItems.map(i =>
    `            { key: ${esc(i.key)}, label: ${esc(i.label)}, qty: ${i.qty}, unit: ${esc(i.unit)}, cat: ${esc(i.cat)}, ingId: ${i.ingId} },`
  ).join("\n");
  const steps = r.steps.map(s => `            ${esc(s)},`).join("\n");
  return `    {
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
${items}
        ],
        steps: [
${steps}
        ],
    },`;
}).join("\n");

const ingBlock = NEW_ING.map(i =>
  `    { id: ${i.id}, name: ${esc(i.name)}, cat: ${esc(i.cat)}, kcal: ${i.kcal}, p: ${i.p}, c: ${i.c}, f: ${i.f}${i.unitG ? `, unitG: ${i.unitG}` : ""} },`
).join("\n");

console.log("\n\n═══════════ ING_FLAT ═══════════\n" + ingBlock);
console.log("\n\n═══════════ INGREDIENT_MACROS ═══════════\n" + macroLines.join("\n"));
console.log("\n\n═══════════ PENDING_RECIPES ═══════════\n" + recipeBlocks);
console.log("\n\n═══════════ RECIPE_TIER_PENDING ═══════════\n    " +
  out.map(r => esc(r.id)).join(", ") + ",");
