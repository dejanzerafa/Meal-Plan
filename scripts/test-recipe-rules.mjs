#!/usr/bin/env node
// test-recipe-rules.mjs — every rule must fire on a recipe that breaks it.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
// ─────────────────────────────────────────────────────────────────────────────
// The library passing every rule proves nothing on its own: a rule with a typo
// in its regex also passes, silently, forever. Two drafts during the audit were
// wrong in exactly that direction — one reported 216 recipes as having no
// timing because `\b` after a bare "min" rejects "minutes", another flagged 57
// recipes for naming a cut they do not use because "minced garlic" matched
// "mince".
//
// So each rule gets two fixtures: one recipe that SHOULD trip it, and one that
// should not. A rule that cannot fire fails here, and a rule that fires on
// correct food fails here too.
//
// Run: node scripts/test-recipe-rules.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { checkRecipe, RULE_IDS } from "./lib/recipe-rules.mjs";
import { readRecipes, blockRange, editRecipe, verifyBlocks } from "./lib/recipe-file.mjs";

let pass = 0, fail = 0;
const t = (name, cond, detail) => {
  if (cond) { pass++; console.log("   PASS  " + name); }
  else { fail++; console.log("   FAIL  " + name + (detail ? "\n         " + detail : "")); }
};
const section = n => console.log("\n  " + n);

// A recipe that breaks nothing. Every fixture below is this, with one thing
// broken, so a fixture can only trip the rule it is aimed at.
const OK = () => ({
  category: "main", id: "t1", name: "🍗 Test Recipe",
  subtitle: "Chicken · rice · ~35 min", badge: "🍳 Stovetop", carb: "🍚 Rice", portions: 4,
  perPortion: { kcal: 520, protein: 42, carbs: 55, fat: 12 },
  allergens: [],
  batchItems: [
    { key: "t1_chicken", label: "Chicken breast (raw)", qty: 600, unit: "g", cat: "Protein", ingId: 1, role: "protein", share: 1 },
    { key: "t1_rice", label: "Brown rice (dry)", qty: 300, unit: "g", cat: "Carbs", ingId: 2, role: "carbs", share: 1 },
    { key: "t1_broccoli", label: "Broccoli", qty: 400, unit: "g", cat: "Vegetables", ingId: 3, role: "veg" },
  ],
  steps: [
    "Cook the brown rice for 35 min, then cool it quickly and refrigerate within an hour.",
    "Cook the chicken until the thickest part reads 75°C.",
    "Steam the broccoli for 5 min.",
    "Divide equally into 4 portions.",
    "💡 Keeps 4 days chilled; reheat until steaming hot all the way through.",
  ],
});
const IM = {
  t1_chicken: { kcal: 165, p: 31, c: 0, f: 3.6 },
  t1_rice: { kcal: 360, p: 7.5, c: 76, f: 2.7 },
  t1_broccoli: { kcal: 34, p: 2.8, c: 7, f: 0.4 },
  t1_onion: { kcal: 40, p: 1.1, c: 9.3, f: 0.1 },
  t1_garlic: { kcal: 149, p: 6.4, c: 33, f: 0.5 },
};
const ctx = { IM, ING: [] };
const fires = (recipe, ruleId) => checkRecipe(recipe, ctx).some(f => f.id === ruleId);
const clean = recipe => checkRecipe(recipe, ctx).map(f => f.id);

// ── The control ─────────────────────────────────────────────────────────────
section("The fixture itself must be clean, or every test below is meaningless");
t("a correct recipe trips no rule", clean(OK()).length === 0, clean(OK()).join(", "));

// ── One broken fixture per rule ─────────────────────────────────────────────
// [rule id, how to break it, and — where the distinction is subtle — something
//  similar that must NOT trip it]
const CASES = [
  ["poultry-doneness", r => { r.steps[1] = "Cook the chicken until golden."; },
    "a ready-cooked chicken salad", r => { r.batchItems[0].label = "Cooked chicken breast"; r.steps[1] = "Add the chicken."; }],
  ["poultry-doneness-house-temp", r => { r.steps[1] = "Cook the chicken to 74°C."; }],
  ["false-doneness-cue", r => { r.batchItems[0].label = "Rotisserie chicken (shredded)";
      r.steps[1] = "Toss the chicken through. Cook until the thickest part reads 75°C."; }],
  ["rice-rapid-cool", r => { r.steps[0] = "Cook the brown rice for 35 min."; },
    "rice wine vinegar is not rice", r => { r.batchItems[1].label = "Rice wine vinegar"; r.steps[0] = "Add the rice wine vinegar."; }],
  ["mince-cooked-through", r => { r.batchItems[0].label = "Beef mince (5% fat, raw)";
      r.steps[1] = "Brown the beef mince for 8 min."; }],
  ["reheat-doneness", r => { r.steps[4] = "💡 Reheat in the microwave."; }],
  ["cold-marinade", r => { r.steps.unshift("Marinate the chicken overnight."); }],
  ["cooking-step-answerable", r => { r.steps[0] = "Cook the brown rice. Cool it quickly, within an hour, and chill."; },
    "'per the packet' is an answer", r => { r.steps[0] = "Cook the rice per the packet. Cool it quickly within an hour."; }],
  ["ingredient-used", r => { r.steps[2] = "Season and serve."; }],
  ["no-stray-foods", r => { r.steps[0] = "Toast the bread, spread the cottage cheese, add the strawberries and honey."; }],
  ["correct-cut", r => { r.steps[3] = "Portion the thighs into containers."; },
    "tenderloin is a steak", r => { r.batchItems[0].label = "Lean beef tenderloin (raw)";
      r.steps[1] = "Sear the steak 3 min a side until medium-rare."; }],
  ["oven-temperature", r => { r.steps[1] = "Roast the chicken for 25 min, until the thickest part reads 75°C."; },
    "a Dutch oven is not an oven", r => { r.steps[1] = "Cook the chicken in a Dutch oven for 25 min, until it reads 75°C."; }],
  ["metric-units", r => { r.steps[2] = "Add 1 cup of stock and simmer 5 min."; },
    "lettuce cups are vessels", r => { r.steps[3] = "Divide into 4 portions and serve in lettuce cups."; }],
  ["weighable-quantities", r => { r.batchItems[1].unit = "cans"; }],
  ["no-duplicate-rows", r => { r.batchItems.push({ ...r.batchItems[2], key: "t1_broccoli2" }); },
    "two soy sauces on one registry row are deliberate",
    r => { r.batchItems.push({ key: "t1_soy2", label: "Dark soy sauce", qty: 30, unit: "ml", cat: "Sauces", ingId: 180 });
           r.batchItems.push({ key: "t1_soy3", label: "Japanese soy sauce", qty: 30, unit: "ml", cat: "Sauces", ingId: 180 });
           r.steps[2] = "Steam the broccoli 5 min, then stir in both soy sauces."; }],
  ["no-pdf-artefacts", r => { r.steps[2] = "Steam the broccoli for"; }],

  // ── Technique (added 2026-09-10) ──────────────────────────────────────────
  // Every lookalike below is a real recipe that a first draft of the rule
  // flagged wrongly. They are the point of this file.
  ["pasta-water-salted",
    r => { r.batchItems[1] = { key: "t1_pasta", label: "Pasta (dry)", qty: 300, unit: "g", cat: "Carbs", ingId: 2 };
           r.steps[0] = "Cook the pasta for 9 min until al dente, then drain."; },
    "udon is salted in manufacture and is boiled in unsalted water",
    r => { r.batchItems[1] = { key: "t1_udon", label: "Udon noodles (dry)", qty: 300, unit: "g", cat: "Carbs", ingId: 2 };
           r.steps[0] = "Cook the udon noodles for 9 min, then drain."; }],

  ["long-grain-rice-rinsed",
    r => { r.batchItems[1].label = "Basmati rice (dry)";
           r.steps[0] = "Cook the basmati rice for 12 min. Cool it quickly, within an hour, and chill."; },
    "pre-cooked basmati has nothing to rinse",
    r => { r.batchItems[1].label = "Cooked basmati rice";
           r.steps[0] = "Warm the cooked basmati rice through for 2 min."; }],

  ["spices-bloomed-in-fat",
    r => { r.steps[0] = "Heat the oil, then add the stock, the cumin and the paprika and simmer 10 min."; },
    "a cold dip has no fat stage to bloom in",
    r => { r.steps[0] = "Whisk the yogurt with the paprika and a splash of water into a cold dip."; }],

  ["blanched-greens-shocked",
    r => { r.steps[2] = "Blanch the broccoli for 3 min, then drain and set aside."; },
    "greens that finish in the wok do not need shocking",
    r => { r.steps[2] = "Blanch the broccoli 3 min, then toss it in the wok over high heat for 2 min."; }],

  ["onion-before-garlic",
    // Appended, not substituted: replacing step 0 orphaned whatever it used and
    // tripped ingredient-used instead, which would have proved nothing.
    r => { r.batchItems.push({ key: "t1_onion", label: "Onion (diced)", qty: 100, unit: "g", cat: "Aromatics", ingId: 8 },
                             { key: "t1_garlic", label: "Garlic (minced)", qty: 20, unit: "g", cat: "Aromatics", ingId: 9 });
           r.steps.splice(1, 0, "Saut\u00e9 the diced onion and garlic over medium heat for 8 min until soft."); },
    "onion first, then garlic, is the correct staging",
    r => { r.batchItems.push({ key: "t1_onion", label: "Onion (diced)", qty: 100, unit: "g", cat: "Aromatics", ingId: 8 },
                             { key: "t1_garlic", label: "Garlic (minced)", qty: 20, unit: "g", cat: "Aromatics", ingId: 9 });
           r.steps.splice(1, 0, "Saut\u00e9 the diced onion 5 min until softened, then add the garlic for 30\u201360 seconds."); }],

  ["technique-not-buried-in-a-note",
    r => { r.steps[1] = "Sear the chicken 4 min a side until it reads 75\u00b0C.";
           r.steps.push("\uD83D\uDCA1 Cook in batches in a single layer; a crowded pan steams the chicken grey."); },
    "a single layer for FREEZING is storage advice, not browning advice",
    r => { r.steps.push("\uD83D\uDCA1 Freeze in a single layer in a lidded tub for up to 3 months."); }],

  ["no-kitchen-myths",
    r => { r.steps[1] = "Sear the chicken hard to seal in the juices, until it reads 75\u00b0C."; },
    "searing for a crust is correct; only the sealing claim is a myth",
    r => { r.steps[1] = "Sear the chicken hard for a deep crust, until it reads 75\u00b0C."; }],
  ["badge-matches-method", r => { r.badge = "🥗 No-Cook"; },
    "melting chocolate in a microwave is still no-cook",
    r => { r.badge = "🥗 No-Cook"; r.steps = ["Melt the chocolate in the microwave in 20-second bursts.", "Spread it over and chill 15 min.", "Divide equally into 4 portions."]; }],
  ["subtitle-matches-badge", r => { r.badge = "🥗 No-Cook"; r.subtitle = "Stovetop · 20 min"; },
    "a No-Cook badge with a matching subtitle",
    r => { r.badge = "🥗 No-Cook"; r.subtitle = "No-cook · 10 min";
           r.steps = ["Spoon the yogurt into a bowl.", "Scatter the berries over.", "Divide equally into 4 portions."]; }],
  ["fat-dominant-main", r => { r.perPortion = { kcal: 400, protein: 12, carbs: 10, fat: 34 }; }],
  ["kcal-matches-macros", r => { r.perPortion.kcal = 900; }],
  ["batch-portioning", r => { r.steps[3] = "Eat."; }],
  ["method-depth", r => { r.steps = [r.steps[0], r.steps[1], r.steps[4]].slice(0, 2); }],
  ["subtitle-time", r => { r.subtitle = "Chicken · rice"; }],
  ["has-emoji", r => { r.name = "Test Recipe"; }],
  ["has-allergens-field", r => { delete r.allergens; }],
];

section("Every rule fires on a recipe that breaks it");
const covered = new Set();
for (const [id, breakIt] of CASES) {
  covered.add(id);
  const r = OK(); breakIt(r);
  t(`${id} fires`, fires(r, id), `broken fixture tripped: ${clean(r).join(", ") || "nothing"}`);
}

section("...and does not fire on the thing it is most likely to confuse");
for (const [id, , label, notBroken] of CASES) {
  if (!notBroken) continue;
  const r = OK(); notBroken(r);
  t(`${id} tolerates ${label}`, !fires(r, id), `tripped on: ${clean(r).join(", ")}`);
}

section("No rule is untested");
const missing = RULE_IDS.filter(id => !covered.has(id));
t(`all ${RULE_IDS.length} rules have a fixture`, missing.length === 0, missing.join(", "));

// ── The block editor ────────────────────────────────────────────────────────
section("The recipe block editor cannot write into a neighbouring recipe");
{
  const f = readRecipes();
  t("index.html parses to 401 recipes", f.ALL.length === 401, String(f.ALL.length));
  const bad = verifyBlocks(f.src);
  t("every recipe block resolves to exactly one recipe", bad.length === 0, bad.slice(0, 3).join(" | "));
  // sn2 and m78 open at column zero; anchoring only on "\n    {" swallowed the
  // previous recipe and wrote sn2's edits into sm9, and m78's into m76.
  for (const id of ["sn2", "m78"]) {
    let ok = false;
    try {
      const { block } = blockRange(f.src, id);
      ok = (block.match(/\bid:\s*"[a-z0-9_]+"/g) || []).length === 1 && block.includes(`id: "${id}"`);
    } catch (_) {}
    t(`${id} (opens at column 0) resolves to itself`, ok);
  }
  let threw = false;
  try { blockRange(f.src, "does-not-exist"); } catch { threw = true; }
  t("an unknown id throws rather than editing something else", threw);
  t("a no-op edit is byte-identical", editRecipe(f.src, "m40", b => b) === f.src);
}

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
