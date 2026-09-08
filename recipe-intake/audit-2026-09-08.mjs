#!/usr/bin/env node
// audit-2026-09-08.mjs — a fresh, independent pass over every recipe.
//
// This is not a re-run of the 07 audit's checks. Those are now assertions in
// scripts/test-regressions.mjs and pass by construction. This looks for the
// next layer: food safety beyond poultry, nutrition plausibility, whether a
// method can actually be followed, ingredient realism, and cross-recipe
// consistency.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("index.html", "utf8");
const slice = (s, o, c) => { const i = src.indexOf(s); const a = src.indexOf(o, i); const b = src.indexOf(c, a); return src.slice(a, b + c.length); };
const IM = eval("(" + slice("const INGREDIENT_MACROS = {", "{", "\n};").replace(/\n};$/, "\n}") + ")");
const ING = eval(slice("const ING_FLAT", "[", "\n];").replace(/\n];$/, "\n]"));
const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
const PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
const ALL = [...RECIPES, ...PENDING];
const LIVE = new Set(RECIPES.map(r => r.id));
const ALLERGEN_MAP = eval(slice("const ALLERGEN_MAP", "[", "\n];").replace(/\n];$/, "\n]"));
const hitSrc = src.slice(src.indexOf("function _allergenHit"), src.indexOf("function detectAllergens"));
const _allergenHit = eval("(" + hitSrc.trim().replace(/;$/, "") + ")");

const F = {};                                  // finding key → [{id, detail}]
const flag = (key, r, detail) => { (F[key] = F[key] || []).push({ id: r.id, name: r.name, live: LIVE.has(r.id), detail }); };

const isTip = s => /^[\u{1F4A1}\u{1F7E1}\u{23F1}]/u.test(s);
const body = r => (r.steps || []).filter(s => !isTip(s));
const text = r => (r.steps || []).join(" ");
const gramsOf = it => { const md = IM[it.key] || {}; const u = String(it.unit || "g").toLowerCase(); return (u === "g" || u === "ml") ? it.qty : it.qty * (md.unitG || 0); };
const macrosOf = r => {
  let k = 0, p = 0, c = 0, f = 0;
  for (const it of r.batchItems || []) { const md = IM[it.key]; if (!md) continue; const g = gramsOf(it); if (g <= 0) continue;
    k += md.kcal / 100 * g; p += md.p / 100 * g; c += md.c / 100 * g; f += md.f / 100 * g; }
  const n = r.portions || 1;
  return { kcal: k / n, protein: p / n, carbs: c / n, fat: f / n, totalG: (r.batchItems || []).reduce((s, i) => s + gramsOf(i), 0) / n };
};

for (const r of ALL) {
  const B = body(r), T = text(r), M = macrosOf(r), pp = r.perPortion || {};
  const bodyText = B.join(" ");   // method only — tips are commentary, not instructions

  // ── A. Food safety beyond poultry ──────────────────────────────────────────
  const has = re => (r.batchItems || []).some(i => re.test(i.label || ""));
  if (has(/\b(pork|gammon|bacon \(raw\)|sausage)\b/i) && !/(7[1-9]|8\d)\s*°C/.test(T) && /\braw\b/i.test((r.batchItems || []).map(i => i.label).join(" ")))
    flag("pork with no doneness temperature", r, "raw pork/sausage and no core temperature in the method");
  if (has(/\b(beef|lamb|steak|mince)\b/i) && /\b(mince|ground)\b/i.test((r.batchItems || []).map(i => i.label).join(" ")) && !/(7[0-9]|8\d)\s*°C|cooked through|no longer pink|browned/i.test(T))
    flag("minced red meat with no doneness cue", r, "minced beef/lamb needs cooking right through, unlike a steak");
  // "rice wine vinegar" is not rice, and a bowl built on ready-cooked grain was
  // not cooled by this user — the note belongs on recipes that cook their own.
  const riceLabels = (r.batchItems || []).filter(i => /\brice\b/i.test(i.label || "")
    && !/rice (?:cake|paper|vinegar|wine|milk|flour|noodle)|\bcooked\b/i.test(i.label || ""));
  if (riceLabels.length && /\brice\b/i.test(T) && /\b(cook|boil|steam|simmer)\b/i.test(T)
      && /\b(overnight|meal prep|4 days|5 days|keeps? \d|container|portion)\b/i.test(T)
      && !/cool[^.]{0,40}\b(quickly|fast|within an hour)\b|within an hour|spores/i.test(T))
    flag("cooked rice stored without a rapid-cool note", r, "Bacillus cereus survives cooking and multiplies in rice left to cool slowly");
  if (has(/\begg\b|\beggs\b/i) && /\braw\b/i.test(T) && !/pasteuris|pasteuriz/i.test(T) && /\b(raw egg|uncooked egg)\b/i.test(T))
    flag("raw egg with no pasteurised note", r, "raw egg served without noting pasteurised eggs");
  if (/\bmarinate\b/i.test(T) && /\b(overnight|\d+\s*h(?:ours?|rs?)?)\b/i.test(T) && !/fridge|refrigerat|chill|cold/i.test(T))
    flag("long marinade with no refrigeration note", r, "marinating at room temperature");
  if (/\breheat/i.test(T) && !/(steaming hot|piping hot|hot (?:all the way )?through|through(?:out)?|75\s*°C|until hot)/i.test(T)
      && !/\d+\s*W\b|\d+\s*%\s*power|\d+\s*(?:min|sec)/i.test(T.slice(T.search(/\breheat/i))))
    flag("reheat advice with neither a time nor 'until hot through'", r, "no way to tell when it is safely reheated");

  // ── B. Nutrition plausibility ──────────────────────────────────────────────
  if (pp.kcal) {
    const atwater = pp.protein * 4 + pp.carbs * 4 + pp.fat * 9;
    const drift = Math.abs(atwater - pp.kcal) / pp.kcal;
    if (drift > 0.15) flag("kcal does not match its own macros", r, `${pp.kcal} kcal declared vs ${Math.round(atwater)} from 4/4/9 (${Math.round(drift * 100)}% out)`);
  }
  if (pp.fat != null && pp.kcal) {
    const fatPct = pp.fat * 9 / pp.kcal;
    if (fatPct > 0.55) flag("very high fat share", r, `${Math.round(fatPct * 100)}% of calories from fat`);
    if (fatPct < 0.05 && pp.kcal > 250) flag("almost no fat", r, `${Math.round(fatPct * 100)}% of calories from fat — poor satiety and fat-soluble vitamin uptake`);
  }
  if (pp.kcal > 900) flag("very large portion", r, `${pp.kcal} kcal per portion`);
  if (r.category === "main" && pp.kcal && pp.kcal < 300) flag("main course under 300 kcal", r, `${pp.kcal} kcal`);
  // "salad" doubles as the side/snack tab in this app, so only a main is
  // expected to fill a plate.
  if (M.totalG && M.totalG < 200 && r.category === "main") flag("main course that barely fills a plate", r, `${Math.round(M.totalG)} g of food per portion`);
  if (M.totalG > 1200) flag("very large plate", r, `${Math.round(M.totalG)} g of food per portion`);
  // sodium-heavy building blocks with no seasoning caution
  const salty = (r.batchItems || []).filter(i => /soy sauce|tamari|teriyaki|hoisin|fish sauce|stock cube|knorr|bouillon|miso|kimchi|olives|feta|bacon|chorizo|pepperoni|deli|salami|capers|anchov/i.test(i.label || ""));
  if (salty.length >= 3) flag("three or more high-sodium ingredients", r, salty.map(i => i.label).join(", "));
  if (pp.carbs != null && pp.protein != null && r.category === "dessert" && pp.protein < 5 && pp.kcal > 200)
    flag("dessert with little protein", r, `${pp.protein} g protein at ${pp.kcal} kcal`);

  // ── C. Can the method be followed? ─────────────────────────────────────────
  // Match on stems, so "Lemons" finds "lemon juice", and let a collective noun
  // stand in for its category — "Slice veg" does cover the courgette.
  const lower = T.toLowerCase();
  const stem = w => w.replace(/(ies)$/, "y").replace(/(es|s)$/, "");
  // "Add all ingredients to the blender" covers everything by definition.
  const CATCH_ALL = /\ball (?:the )?ingredients\b|\beverything\b|\ball (?:the )?(?:fruit|veg|vegetables)\b/i.test(T);
  const COLLECTIVE = { Fruits: /\b(fruits?|berries|smoothie)\b/i, Vegetables: /\b(veg|vegetables|veggies|greens|salad)\b/i, Herbs: /\b(herbs?|seasoning|aromatics)\b/i,
                       Spices: /\b(spices?|seasoning|spice (?:blend|mix)|rub)\b/i, Aromatics: /\b(aromatics|veg|vegetables)\b/i,
                       Condiments: /\b(sauce|dressing|condiments?|marinade)\b/i, Sauces: /\b(sauce|dressing|marinade)\b/i };
  for (const it of r.batchItems || []) {
    // Keep what is inside the brackets: "Fat-free cheddar (shredded)" is used
    // by a step that says "shredded cheese", and stripping the parenthetical
    // hid that.
    const words = (it.label || "").toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 3 && !["and","the","raw","dry","for","cut","low","fat","non","new"].includes(w));
    // Match both ways: "blueberries" is satisfied by a method that says
    // "berries", and "Lemons" by one that says "lemon juice".
    const methodWords = lower.split(/[^a-z]+/).filter(w => w.length >= 4);
    if (CATCH_ALL) continue;
    const found = words.some(w => lower.includes(stem(w)) || methodWords.some(m => w.includes(m) && m.length >= 4));
    if (found) continue;
    if (COLLECTIVE[it.cat] && COLLECTIVE[it.cat].test(T)) continue;
    flag("ingredient never mentioned in the method", r, `${it.label} (${it.qty} ${it.unit}) — the user is told to buy it but not what to do with it`);
  }

  // The reverse of "bought but never used": the method calls for a FOOD the
  // recipe does not contain. bf58 was imported with page 48's method — its
  // ingredients are oats, almond milk and peanut butter while its steps say
  // toast, cottage cheese and strawberries. The source PDF itself is wrong.
  const FOODS = /\b(bread|toast|cottage cheese|strawberr\w+|blueberr\w+|raspberr\w+|banana|honey|oats?|rice|pasta|noodles?|quinoa|tortilla|potato\w*|chicken|beef|turkey|salmon|tuna|shrimp|prawns?|cod|tofu|egg|eggs|yogurt|yoghurt|avocado|spinach|broccoli|mushrooms?|cheese|feta|parmesan|mozzarella|chickpeas?|lentils?|beans?)\b/gi;
  const itemText = (r.batchItems || []).map(i => (i.label || "").toLowerCase()).join(" ");
  const strayFoods = [...new Set((bodyText.match(FOODS) || []).map(w => w.toLowerCase()))]
    .filter(w => !itemText.includes(w.replace(/(ies)$/, "y").replace(/(es|s)$/, ""))
              && !itemText.includes(w)
              && !new RegExp(`\\b${w.replace(/(ies)$/, "").replace(/s$/, "")}`).test(itemText));
  if (strayFoods.length >= 3)
    flag("the method calls for foods the recipe does not contain", r, `steps mention ${strayFoods.join(", ")} — none of which is an ingredient`);

  // The method names a cut the recipe does not contain. m40 buys
  // breast and its last step says "Portion thighs".
  // Only compare cuts within the same animal — "minced garlic" is not a cut of
  // chicken, and a fish fillet has nothing to say about a chicken breast.
  const CUTS = [["thigh", /\bthighs?\b/i, /chicken|turkey|duck/i], ["breast", /\bbreasts?\b/i, /chicken|turkey|duck/i],
                ["drumstick", /\bdrumsticks?\b/i, /chicken|turkey/i], ["wing", /\bwings?\b/i, /chicken|turkey/i],
                ["steak", /\bsteaks?\b/i, /beef|lamb/i]];
  const labels = (r.batchItems || []).map(i => i.label || "").join(" ").toLowerCase();
  const STEAK_CUTS = /tenderloin|sirloin|ribeye|rib-eye|fillet|striploin|rump|flank|skirt/i;
  for (const [cut, re, family] of CUTS)
    if (re.test(bodyText) && family.test(labels) && !labels.includes(cut)
        && !(cut === "steak" && STEAK_CUTS.test(labels)))
      flag("method names a cut the recipe does not use", r, `steps say "${cut}" but the ingredients are: ${(r.batchItems || []).filter(i => family.test(i.label || "")).map(i => i.label).join(", ")}`);
  if (B.length < 3 && r.category !== "preworkout") flag("method under three steps", r, `${B.length} step(s)`);
  if (B.some(s => s.length > 320)) flag("a step over 320 characters", r, `longest ${Math.max(...B.map(s => s.length))} chars — hard to follow on a phone mid-cook`);
  if (!/\b(portion|divide|distribute|split|container|serve|box|jar|store|among them|each (?:bowl|plate|wrap|tortilla|jar))\b/i.test(T) && (r.portions || 1) > 2)
    flag("batch recipe with no portioning step", r, `${r.portions} portions and no instruction to divide them`);
  // Body only, and a real oven verb — "Dutch oven" and "Instant Pot" are
  // stovetop kit, and a reheating tip that mentions an air fryer is not the
  // recipe's cooking method.
  // "the beef roast" is a noun; only an imperative counts as an oven step.
  const ovenVerb = B.flatMap(x => x.split(/(?<=[.!?])\s+|,\s+(?=then\b)/))
    .some(x => /^(?:then\s+|now\s+|next,?\s+|meanwhile,?\s+)?(bake|roast)\b/i.test(x.trim())
            && !/dutch oven|instant pot/i.test(x));
  if (ovenVerb && !/\d+\s*°C/.test(bodyText)) flag("oven recipe with no temperature", r, "says bake/roast but never gives a temperature");
  if (/\bair[- ]?fry/i.test(bodyText) && !/\d+\s*°C/.test(bodyText)) flag("air-fryer recipe with no temperature", r, "no air-fryer temperature");
  // "25–30 minutes" and "3 hours" must match too — \b after a bare "min"/"hour"
  // rejects the plural, which is how a first draft of this check reported 216
  // false positives.
  const TIMED = /\d+\s*(?:min(?:ute)?s?|h(?:ou)?rs?|sec(?:ond)?s?)\b|overnight/i;
  // Only where timing changes the outcome. A parfait does not need "layer for
  // 30 seconds"; a pan of mince does need to know it is 6-8 minutes, and the
  // subtitle already carries the total time for every recipe.
  // Sentence-level and imperative-only. "Serve on toast" and "Portion the
  // stir-fry" are not cooking instructions, and matching the bare verb
  // anywhere in the step flagged both.
  const COOK_IMPERATIVE = /^(?:then\s+|now\s+|next,?\s+|meanwhile,?\s+|carefully\s+|gently\s+|lightly\s+)?(cook|fry|saut[ée]|sear|brown|grill|bake|roast|boil|simmer|steam|poach|toast|air[- ]?fry|blanch|braise|scramble|griddle)\b/i;
  const sentences = s => s.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
  // Cooking-ness is judged per sentence, but the ANSWER may live anywhere in
  // the step — "Brown beef mince. Cook it right through until 75°C." is
  // answered, even though the first sentence alone is not.
  const cookingSteps = B.filter(x => sentences(x).some(y => COOK_IMPERATIVE.test(y)));
  // A step is answerable if it gives a time, defers to the packet, or names a
  // doneness the cook can see. "Brown the mince." is none of those.
  const DEFERS = /per (?:the )?(?:packet|package)|according to (?:the )?(?:packet|package)|packet instructions|package directions|to your liking|to your preference/i;
  const CUE = /\buntil\b|\bto your\b|\d+\s*°C|no (?:longer )?pink|golden|tender|crisp|set\b|wilted|softened|fragrant|charred|opaque|shreds?/i;
  const unanswerable = cookingSteps.filter(x => !TIMED.test(x) && !DEFERS.test(x) && !CUE.test(x));
  if (unanswerable.length)
    flag("a cooking step with no time and no doneness cue", r, unanswerable.map(s => `"${s.slice(0, 70)}"`).join("; "));

  // ── D. Data integrity ──────────────────────────────────────────────────────
  for (const it of r.batchItems || []) {
    if (!IM[it.key]) flag("ingredient with no macro row", r, it.key);
    if (!it.ingId) flag("ingredient with no registry id", r, it.label);
    const g = gramsOf(it);
    if (g > 0 && g / (r.portions || 1) > 600 && !/water|broth|stock|milk|passata|tomatoes/i.test(it.label || ""))
      flag("implausible quantity", r, `${it.label}: ${Math.round(g / (r.portions || 1))} g per portion`);
    const SEASONING = ["Spices", "Herbs", "Baking", "Aromatics", "Condiments"].includes(it.cat)
      || /salt|pepper|spice|powder|zest|chilli|chili|cinnamon|nutmeg|vanilla|herb|seasoning|paprika|cumin|turmeric|thyme|oregano|dill|basil|parsley|rosemary|soda|extract|yeast/i.test(it.label || "");
    if (g > 0 && g / (r.portions || 1) < 0.3 && !SEASONING)
      flag("quantity too small to weigh", r, `${it.label}: ${(g / (r.portions || 1)).toFixed(2)} g per portion`);
  }
  const keys = (r.batchItems || []).map(i => i.key);
  if (new Set(keys).size !== keys.length) flag("duplicate ingredient key", r, keys.filter((k, i) => keys.indexOf(k) !== i).join(", "));
  const ids = (r.batchItems || []).map(i => i.ingId).filter(Boolean);
  // Two rows CAN share a registry food on purpose — dark and Japanese soy
  // sauce, cottage cheese blended into a sauce and more on top, ice and water.
  // Only an identical label twice is a mistake.
  const labelPairs = (r.batchItems || []).map(i => `${i.ingId}|${(i.label || "").toLowerCase().trim()}`);
  const dupLabels = labelPairs.filter((k, i) => labelPairs.indexOf(k) !== i);
  if (dupLabels.length) flag("the same ingredient row listed twice", r, [...new Set(dupLabels)].join(", "));
  if (!r.badge) flag("no cooking-method badge", r, "the badge filter cannot see it");
  if (!r.carb) flag("no carb tag", r, "the carb filter cannot see it");
  if (!(r.portions > 0)) flag("no portion count", r, String(r.portions));

  // ── E. Allergens ───────────────────────────────────────────────────────────
  const allergenText = [(r.batchItems || []).map(i => i.label || "").join(" "), T, r.subtitle || ""].join(" ");
  const detected = ALLERGEN_MAP.filter(a => _allergenHit(allergenText, a)).map(a => a.name);
  if (r.allergens) {
    const missing = detected.filter(a => !r.allergens.includes(a));
    const extra = r.allergens.filter(a => !detected.includes(a));
    if (missing.length) flag("declared allergens miss one the ingredients imply", r, `missing: ${missing.join(", ")}`);
    if (extra.length) flag("declares an allergen nothing in the recipe contains", r, `extra: ${extra.join(", ")}`);
  } else if (detected.length) {
    flag("no allergens field (admin release panel only)", r, `the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: ${detected.join(", ")}`);
  }
}

// ── F. Cross-recipe consistency ──────────────────────────────────────────────
const byName = {};
for (const r of ALL) {
  const norm = r.name.replace(/^\P{L}+/u, "").toLowerCase().replace(/[^a-z ]/g, "").trim();
  (byName[norm] = byName[norm] || []).push(r);
}
const dupNames = Object.entries(byName).filter(([, v]) => v.length > 1);

// the same food described with different macros
const foodMacros = {};
for (const r of ALL) for (const it of r.batchItems || []) {
  const md = IM[it.key]; if (!md || !it.ingId) continue;
  const k = it.ingId;
  (foodMacros[k] = foodMacros[k] || []).push({ id: r.id, kcal: md.kcal, p: md.p, label: it.label });
}
// 20 vs 20.4 g of protein in the same salmon is rounding, not a data conflict.
// Report only where the numbers genuinely disagree.
const foodDrift = Object.entries(foodMacros).filter(([, v]) => {
  const kc = v.map(x => x.kcal), pr = v.map(x => x.p);
  const spread = a => (Math.max(...a) - Math.min(...a)) / (Math.max(...a) || 1);
  return spread(kc) > 0.02 || spread(pr) > 0.02;
});

// the same registry food under different labels
const labelDrift = Object.entries(foodMacros)
  .map(([id, v]) => [id, [...new Set(v.map(x => x.label))]])
  .filter(([, labels]) => labels.length > 3);

// ── G. The two macro banks must agree on protein, fat and carbs too ─────────
// check-ingredients compares the two registries on CALORIES ONLY, at a 15%
// tolerance. Whole-wheat pasta is 348 kcal in one and 354 in the other — 1.7%,
// a pass — while its protein reads 14 g against 20 g, a 43% disagreement that
// nothing has ever looked at. The recipe card's macros come from one bank and
// the ingredients tab and shopping list from the other, so the app can quote a
// user two different protein numbers for the same food.
const bankDrift = [];
for (const r of ALL) for (const it of r.batchItems || []) {
  const k = IM[it.key], f = ING.find(x => x.id === it.ingId);
  if (!k || !f) continue;
  for (const [field, kk, fk] of [["protein", "p", "p"], ["carbs", "c", "c"], ["fat", "f", "f"]]) {
    const a = k[kk], b = f[fk];
    if (a == null || b == null) continue;
    const base = Math.max(a, b);
    if (base >= 3 && Math.abs(a - b) / base > 0.15)
      bankDrift.push({ id: r.id, key: it.key, label: it.label, food: f.name, field, recipe: a, registry: b });
  }
}
const bankByFood = {};
for (const d of bankDrift) (bankByFood[`${d.food}|${d.field}`] = bankByFood[`${d.food}|${d.field}`] || []).push(d);

// ── Report ───────────────────────────────────────────────────────────────────
const SEVERITY = {
  "cooked rice stored without a rapid-cool note": "safety",
  "minced red meat with no doneness cue": "safety",
  "long marinade with no refrigeration note": "safety",
  "reheat advice with neither a time nor 'until hot through'": "safety",
  "pork with no doneness temperature": "safety",
  "raw egg with no pasteurised note": "safety",
  "method names a cut the recipe does not use": "wrong",
  "ingredient never mentioned in the method": "wrong",
  "oven recipe with no temperature": "wrong",
  "air-fryer recipe with no temperature": "wrong",
  "method with no timing at all": "wrong",
  "implausible quantity": "wrong",
  "same registry ingredient listed twice": "wrong",
  "method under three steps": "quality",
  "a step over 320 characters": "quality",
  "batch recipe with no portioning step": "quality",
  "main course under 300 kcal": "nutrition",
  "main course that barely fills a plate": "nutrition",
  "very high fat share": "nutrition",
  "almost no fat": "nutrition",
  "very large portion": "nutrition",
  "very large plate": "nutrition",
  "dessert with little protein": "nutrition",
  "three or more high-sodium ingredients": "nutrition",
  "quantity too small to weigh": "quality",
  "no allergens field (admin release panel only)": "cosmetic",
};
const order = Object.entries(F).sort((a, b) => {
  const rank = k => ["safety", "wrong", "nutrition", "quality", "cosmetic"].indexOf(SEVERITY[k] || "quality");
  return rank(a[0]) - rank(b[0]) || b[1].length - a[1].length;
});
let md = `# Full recipe audit — ${new Date().toISOString().slice(0, 10)}\n\n`;
md += `Every recipe in the app: **${ALL.length}** (${RECIPES.length} live, ${PENDING.length} staged). `;
md += `This is a fresh pass, not a re-run — the 2026-09-07 findings are now assertions in the regression suite and pass by construction. `;
md += `\`*\` marks a staged recipe.\n\n`;
md += `Nothing here has been changed.\n\n## Summary\n\n| Finding | Recipes |\n|---|---|\n`;
for (const [k, v] of order) md += `| ${k} | ${v.length} |\n`;
md += `| duplicate recipe names | ${dupNames.length} |\n| same food, different macros between recipes | ${foodDrift.length} |\n`;
md += `| the two macro banks disagree on protein/carbs/fat | ${Object.keys(bankByFood).length} foods |\n`;
md += `\n**Total findings: ${order.reduce((a, [, v]) => a + v.length, 0)}** across ${new Set(order.flatMap(([, v]) => v.map(x => x.id))).size} recipes.\n`;

md += `\nSeverity: **safety** first, then **wrong** (the recipe misstates itself), **nutrition**, **quality**, **cosmetic**.\n`;

if (Object.keys(bankByFood).length) {
  md += `\n## The two macro banks disagree (${Object.keys(bankByFood).length} foods) — severity: wrong\n\n`;
  md += `\`INGREDIENT_MACROS\` drives the recipe card; \`ING_FLAT\` drives the ingredients tab and shopping list. \`check-ingredients.mjs\` compares them on calories only, at a 15% tolerance, so these never surfaced.\n\n`;
  for (const [k, v] of Object.entries(bankByFood)) {
    const [food, field] = k.split("|");
    md += `- **${food}** — ${field}: recipe card says ${[...new Set(v.map(d => d.recipe))].join("/")} g, registry says ${v[0].registry} g · ${v.length} use(s): ${[...new Set(v.map(d => d.id))].slice(0, 8).join(", ")}${v.length > 8 ? " …" : ""}\n`;
  }
}

for (const [k, v] of order) {
  md += `\n## ${k} (${v.length}) — severity: ${SEVERITY[k] || "quality"}\n\n`;
  for (const x of v) md += `- \`${x.id}\`${x.live ? "" : "*"} ${x.name} — ${x.detail}\n`;
}
if (dupNames.length) {
  md += `\n## duplicate recipe names (${dupNames.length})\n\n`;
  for (const [n, v] of dupNames) md += `- "${n}" — ${v.map(r => r.id + (LIVE.has(r.id) ? "" : "*")).join(", ")}\n`;
}
if (foodDrift.length) {
  md += `\n## same registry food, different macros (${foodDrift.length})\n\n`;
  for (const [id, v] of foodDrift) {
    const name = (ING.find(x => x.id === +id) || {}).name || id;
    const variants = [...new Set(v.map(x => `${x.kcal} kcal / ${x.p} g protein (${x.id})`))];
    md += `- **${name}** — ${variants.join(" · ")}\n`;
  }
}
if (labelDrift.length) {
  md += `\n## one food, many labels (${labelDrift.length})\n\n`;
  for (const [id, labels] of labelDrift) {
    const name = (ING.find(x => x.id === +id) || {}).name || id;
    md += `- **${name}** — ${labels.map(l => `"${l}"`).join(", ")}\n`;
  }
}
const clean = ALL.filter(r => !order.some(([, v]) => v.some(x => x.id === r.id)));
md += `\n## No findings (${clean.length})\n\n${clean.map(r => "`" + r.id + "`").join(" ")}\n`;
writeFileSync("recipe-intake/AUDIT-FULL-2026-09-08.md", md);
console.log(`${ALL.length} recipes audited`);
for (const [k, v] of order) console.log(`  ${String(v.length).padStart(4)}  ${k}`);
console.log(`  ${String(dupNames.length).padStart(4)}  duplicate recipe names`);
console.log(`  ${String(foodDrift.length).padStart(4)}  same food, different macros`);
console.log(`\n  clean: ${clean.length}`);
