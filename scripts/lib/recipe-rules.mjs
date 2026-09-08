#!/usr/bin/env node
// recipe-rules.mjs — the one place every recipe rule lives.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS
// ─────────────────────────────────────────────────────────────────────────────
// Two audits (2026-09-07 and 2026-09-08) found the same class of problem over
// and over: a recipe that reads fine but cannot actually be cooked from, or that
// quietly misstates itself. "Cook brown rice." with no time. A wrap built from
// ready-cooked chicken telling you to cook it to 75°C. A method that belonged to
// a different recipe. An ingredient on the shopping list the method never uses.
//
// Each was fixed, and each fix was pinned by an assertion. The problem with that
// arrangement is that the RULES then lived in three places — the audit script,
// the regression suite, and the fixer — and they drifted apart within a day:
// the fixer skipped four recipes the assertion demanded, because the two
// predicates for "cooks its own rice" were subtly different.
//
// So the rules live here, once. The audit reports them, the regression suite
// asserts them, and any new batch of recipes is checked against them BEFORE it
// is merged. If you change a rule, you change it in one place and all three
// follow.
//
// Usage:
//   import { checkRecipe, checkLibrary, NOTE_RE, isNote } from "./lib/recipe-rules.mjs";
//   const findings = checkRecipe(recipe, { IM, ING });
// ─────────────────────────────────────────────────────────────────────────────

// ── What counts as a note rather than a step ────────────────────────────────
// 💡 storage/technique · 🟡 nutrient pairing · 🔬 leucine · ⚡ fuelling
// 💪 protein suggestion · 🍽️ serving suggestion · ⏱️ timing · 😴 pre-sleep
//
// The app only recognised 💡 for months, so the other 76 lines were numbered as
// steps and counted in "N/N done" — a 6-step recipe claimed 7 steps and would
// not tick complete. Add a new prefix here AND in index.html's isNote.
export const NOTE_RE = /^[\u{1F4A1}\u{1F7E1}\u{1F52C}\u{26A1}\u{1F4AA}\u{1F37D}\u{23F1}\u{1F634}]/u;
export const isNote = s => NOTE_RE.test(String(s));
export const bodyOf = r => (r.steps || []).filter(s => !isNote(s));
export const notesOf = r => (r.steps || []).filter(isNote);

// ── Shared vocabulary ───────────────────────────────────────────────────────
export const POULTRY = /\b(chicken|turkey|duck)\b/i;
// Poultry that is not a raw bird you have to cook.
export const NOT_RAW = /broth|stock|knorr|bouillon|smoked|deli|rotisserie|pre-?cooked|\bcooked\b|jerky|bacon/i;
export const COOK_IMPERATIVE = /^(?:then\s+|now\s+|next,?\s+|meanwhile,?\s+|carefully\s+|gently\s+|lightly\s+)?(cook|fry|saut[ée]|sear|brown|grill|bake|roast|boil|simmer|steam|poach|toast|air[- ]?fry|blanch|braise|scramble|griddle)\b/i;
export const TIMED = /\d+\s*(?:min(?:ute)?s?|h(?:ou)?rs?|sec(?:ond)?s?)\b|overnight/i;
export const DEFERS = /per (?:the )?(?:packet|package)|according to (?:the )?(?:packet|package)|packet instructions|package directions|to your liking|to your preference/i;
export const DONENESS_CUE = /\buntil\b|\bto your\b|\d+\s*°C|no (?:longer )?pink|golden|tender|crisp|set\b|wilted|softened|fragrant|charred|opaque|shreds?/i;
export const CARB = /rice|pasta|potato|quinoa|couscous|bread|tortilla|wrap|noodle|oats|barley|farro|bulgur|gnocchi|polenta|pita|bagel|falafel/i;
// The house doneness temperature. USDA and Health Canada give 74°C (165°F)
// instantaneous for poultry; the UK FSA writes it as 70°C for 2 min, 75°C for
// 30 s, 80°C for 6 s. 75°C satisfies the FSA table directly and clears USDA
// outright, so the whole library quotes one number. Researched 2026-09-08.
export const HOUSE_TEMP = 75;
export const ANY_DONENESS_TEMP = /\b(7[45]|8[02])\s*°\s*C\b|\b16[5-9]\s*°\s*F\b/;

const sentences = s => String(s).split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
const stem = w => w.replace(/(ies)$/, "y").replace(/(es|s)$/, "");

// ── The rules ───────────────────────────────────────────────────────────────
// Each returns a string (the finding) or null. `ctx` carries INGREDIENT_MACROS
// and ING_FLAT so quantity rules can convert to grams.
const RULES = [
  // ── Food safety ───────────────────────────────────────────────────────────
  {
    id: "poultry-doneness", severity: "safety",
    why: "Salmonella is the most heat-resistant pathogen in raw poultry. 75°C is an instant kill and satisfies both the USDA and UK standards.",
    check(r) {
      const raw = (r.batchItems || []).some(i => POULTRY.test(i.label || "") && !NOT_RAW.test(i.label || ""));
      if (!raw) return null;
      if ((r.steps || []).some(s => ANY_DONENESS_TEMP.test(s))) return null;
      return "cooks raw poultry but never states a doneness temperature";
    },
  },
  {
    id: "poultry-doneness-house-temp", severity: "safety",
    why: "One number across the library, so a user never sees two different 'safe' temperatures.",
    check(r) {
      const raw = (r.batchItems || []).some(i => POULTRY.test(i.label || "") && !NOT_RAW.test(i.label || ""));
      if (!raw) return null;
      const stale = (r.steps || []).some(s => /\b(74\s*°\s*C|165\s*°\s*F)\b/.test(s));
      return stale ? `quotes 74°C/165°F; the house standard is ${HOUSE_TEMP}°C` : null;
    },
  },
  {
    id: "false-doneness-cue", severity: "safety",
    why: "A wrap built from ready-cooked chicken telling you to cook it to temperature is nonsense, and it teaches the user to ignore the cue.",
    check(r) {
      const raw = (r.batchItems || []).some(i => POULTRY.test(i.label || "") && !NOT_RAW.test(i.label || ""));
      if (raw) return null;
      const cued = (r.steps || []).some(s => /(?:thickest part|centre of the thickest piece) reads 7[45]°C/.test(s));
      return cued ? "tells you to cook chicken that is already cooked" : null;
    },
  },
  {
    id: "rice-rapid-cool", severity: "safety",
    why: "Uncooked rice carries Bacillus cereus spores that SURVIVE cooking. Slow cooling lets them make a heat-stable toxin that reheating does not destroy — the classic meal-prep food poisoning.",
    check(r) {
      const ownRice = (r.batchItems || []).some(i => /\brice\b/i.test(i.label || "")
        && !/rice (?:cake|paper|vinegar|wine|milk|flour|noodle)|\bcooked\b/i.test(i.label || ""));
      if (!ownRice) return null;
      const T = (r.steps || []).join(" ");
      if (!/\brice\b/i.test(T) || !/\b(cook|boil|steam|simmer)\b/i.test(T)) return null;
      const noted = /cool[^.]{0,40}\b(quickly|fast|within an hour)\b|within an hour|spores/i.test(T);
      return noted ? null : "cooks its own rice with no rapid-cool note";
    },
  },
  {
    id: "mince-cooked-through", severity: "safety",
    why: "Whole muscle is sterile inside, which is why a steak can be rare. Mincing spreads surface bacteria right through the meat.",
    check(r) {
      const labels = (r.batchItems || []).map(i => i.label || "").join(" ");
      if (!/\b(beef|lamb|pork)\b/i.test(labels) || !/\b(mince|minced|ground)\b/i.test(labels)) return null;
      const T = (r.steps || []).join(" ");
      return /(7[0-9]|8\d)\s*°C|no (?:longer )?pink|right through|cooked through|fully browned|until browned/i.test(T)
        ? null : "minced red meat with no cooked-through cue";
    },
  },
  {
    id: "reheat-doneness", severity: "safety",
    why: "'Reheat in the microwave' with no time and no doneness is a guess, not an instruction.",
    check(r) {
      const T = (r.steps || []).join(" ");
      if (!/\breheat/i.test(T)) return null;
      const tail = T.slice(T.search(/\breheat/i));
      const ok = /(steaming hot|piping hot|hot (?:all the way )?through|through(?:out)?|75\s*°C|until hot)/i.test(T)
              || /\d+\s*W\b|\d+\s*%\s*power|\d+\s*(?:min|sec)/i.test(tail);
      return ok ? null : "reheat advice with neither a time nor a doneness";
    },
  },
  {
    id: "cold-marinade", severity: "safety",
    why: "Hours of marinating at room temperature is a bacterial incubator.",
    check(r) {
      const T = (r.steps || []).join(" ");
      return /\bmarinate\b/i.test(T) && /\b(overnight|\d+\s*h(?:ours?|rs?)?)\b/i.test(T) && !/fridge|refrigerat|chill|cold/i.test(T)
        ? "marinates for hours with no mention of the fridge" : null;
    },
  },

  // ── The recipe must not misstate itself ───────────────────────────────────
  {
    id: "cooking-step-answerable", severity: "wrong",
    why: "'Cook brown rice.' is not an instruction — brown rice is 35-40 min and white is 12, and a first-time cook cannot tell which.",
    check(r) {
      const bad = bodyOf(r).filter(s => sentences(s).some(x => COOK_IMPERATIVE.test(x))
        && !TIMED.test(s) && !DEFERS.test(s) && !DONENESS_CUE.test(s));
      return bad.length ? `${bad.length} cooking step(s) with no time, doneness or packet deferral: "${bad[0].slice(0, 60)}"` : null;
    },
  },
  {
    id: "ingredient-used", severity: "wrong",
    why: "The shopping list charges the user for it and the method never says what to do with it.",
    check(r) {
      const body = bodyOf(r).join(" ");
      const lower = body.toLowerCase();
      if (/\ball (?:the )?ingredients\b|\beverything\b|\ball (?:the )?(?:fruit|veg|vegetables)\b/.test(lower)) return null;
      const methodWords = lower.split(/[^a-z]+/).filter(w => w.length >= 4);
      const COLL = { Fruits: /\b(fruits?|berries|smoothie)\b/i, Vegetables: /\b(veg|vegetables|veggies|greens|salad)\b/i,
                     Herbs: /\b(herbs?|seasoning|aromatics)\b/i, Spices: /\b(spices?|seasoning|spice (?:blend|mix)|rub)\b/i,
                     Aromatics: /\b(aromatics|veg|vegetables)\b/i, Condiments: /\b(sauce|dressing|condiments?|marinade)\b/i,
                     Sauces: /\b(sauce|dressing|marinade)\b/i };
      const missing = (r.batchItems || []).filter(i => {
        const words = (i.label || "").toLowerCase().split(/[^a-z]+/)
          .filter(w => w.length >= 3 && !["and", "the", "raw", "dry", "for", "cut", "low", "fat", "non", "new"].includes(w));
        if (words.some(w => lower.includes(stem(w)) || methodWords.some(m => w.includes(m) && m.length >= 4))) return false;
        return !(COLL[i.cat] && COLL[i.cat].test(body));
      });
      return missing.length ? `bought but never used: ${missing.map(i => i.label).join(", ")}` : null;
    },
  },
  {
    id: "no-stray-foods", severity: "wrong",
    why: "bf58 was imported carrying page 48's method: its ingredients were oats and peanut butter while its steps called for toast, cottage cheese and strawberries.",
    check(r) {
      const FOODS = /\b(bread|toast|cottage cheese|strawberr\w+|blueberr\w+|raspberr\w+|banana|honey|oats?|rice|pasta|noodles?|quinoa|tortilla|potato\w*|chicken|beef|turkey|salmon|tuna|shrimp|prawns?|cod|tofu|eggs?|yogh?urt|avocado|spinach|broccoli|mushrooms?|cheese|feta|parmesan|mozzarella|chickpeas?|lentils?|beans?)\b/gi;
      const itemText = (r.batchItems || []).map(i => (i.label || "").toLowerCase()).join(" ");
      const stray = [...new Set((bodyOf(r).join(" ").match(FOODS) || []).map(w => w.toLowerCase()))]
        .filter(w => !itemText.includes(stem(w)) && !itemText.includes(w)
                  && !new RegExp(`\\b${w.replace(/(ies)$/, "").replace(/s$/, "")}`).test(itemText));
      return stray.length >= 3 ? `method calls for ${stray.join(", ")}, none of which is an ingredient` : null;
    },
  },
  {
    id: "correct-cut", severity: "wrong",
    why: "m40 bought breast and its last step said 'Portion thighs'.",
    check(r) {
      const CUTS = [["thigh", /\bthighs?\b/i, /chicken|turkey|duck/i], ["breast", /\bbreasts?\b/i, /chicken|turkey|duck/i],
                    ["drumstick", /\bdrumsticks?\b/i, /chicken|turkey/i], ["wing", /\bwings?\b/i, /chicken|turkey/i],
                    ["steak", /\bsteaks?\b/i, /beef|lamb/i]];
      const STEAK_CUTS = /tenderloin|sirloin|ribeye|rib-eye|fillet|striploin|rump|flank|skirt/i;
      const labels = (r.batchItems || []).map(i => i.label || "").join(" ").toLowerCase();
      const body = bodyOf(r).join(" ");
      for (const [cut, re, family] of CUTS)
        if (re.test(body) && family.test(labels) && !labels.includes(cut) && !(cut === "steak" && STEAK_CUTS.test(labels)))
          return `method says "${cut}" but the recipe contains ${(r.batchItems || []).filter(i => family.test(i.label || "")).map(i => i.label).join(", ")}`;
      return null;
    },
  },
  {
    id: "oven-temperature", severity: "wrong",
    why: "A Dutch oven is stovetop kit and 'the beef roast' is a noun, so only an imperative counts — but a real bake with no temperature is unusable.",
    check(r) {
      const B = bodyOf(r), body = B.join(" ");
      const ovenVerb = B.flatMap(x => x.split(/(?<=[.!?])\s+|,\s+(?=then\b)/))
        .some(x => /^(?:then\s+|now\s+|next,?\s+|meanwhile,?\s+)?(bake|roast)\b/i.test(x.trim()) && !/dutch oven|instant pot/i.test(x));
      const airFry = /\bair[- ]?fry/i.test(body);
      return (ovenVerb || airFry) && !/\d+\s*°C/.test(body) ? "an oven or air-fryer step with no temperature" : null;
    },
  },
  {
    id: "metric-units", severity: "wrong",
    why: "A kitchen-scale app that says '1 cup' cannot be followed. Vessels ('lettuce cups', 'muffin cups') are not measures.",
    check(r) {
      const US = /(?:\d|[½¼¾⅓⅔⅛]|\b(?:a|an|one|two|half)\s)\s*-?\s*(?:cups?|tbsps?|tablespoons?|tsps?|teaspoons?|ounces?|\boz\b|pounds?|\blbs?\b|inch(?:es)?)\b/i;
      const bad = (r.steps || []).some(s => US.test(String(s)
        .replace(/\b(?:lettuce|muffin|cucumber|paper|silicone|baking)\s+cups?\b/gi, "")
        .replace(/\d+\s*[×x]\s*\d+\s*inch\s*\(\d+[×x]\d+\s*cm\)/gi, "")));
      return bad ? "measures in cups / tbsp / tsp / oz / inches" : null;
    },
  },
  {
    id: "weighable-quantities", severity: "wrong",
    why: "'2 cans' and '10 slices' cannot be weighed, and the macros are computed from grams.",
    check(r) {
      const bad = (r.batchItems || []).filter(i => !["g", "ml", "mL", "whole"].includes(String(i.unit)));
      const zero = (r.batchItems || []).filter(i => !(i.qty > 0));
      if (bad.length) return `unit is not g/ml/whole: ${bad.map(i => `${i.key} (${i.unit})`).join(", ")}`;
      if (zero.length) return `zero quantity: ${zero.map(i => i.key).join(", ")}`;
      return null;
    },
  },
  {
    id: "no-duplicate-rows", severity: "wrong",
    why: "Two rows CAN share a registry food deliberately (dark and Japanese soy sauce). An identical label twice is a mistake — v5 listed 350 g and 200 g of the same cottage cheese.",
    check(r) {
      const pairs = (r.batchItems || []).map(i => `${i.ingId}|${(i.label || "").toLowerCase().trim()}`);
      const dup = [...new Set(pairs.filter((k, i) => pairs.indexOf(k) !== i))];
      return dup.length ? `the same ingredient row twice: ${dup.join(", ")}` : null;
    },
  },
  {
    id: "no-pdf-artefacts", severity: "wrong",
    why: "The cookbook is a two-column PDF; steps were cut at the column edge and one nutrition panel leaked into a method.",
    check(r) {
      const frag = [];
      const B = bodyOf(r);
      B.forEach((s, i) => { if (/^[a-z]/.test(s) || (i < B.length - 1 && !/[.!?:)”"]$/.test(s.trim()))) frag.push(i + 1); });
      if (frag.length) return `sentence fragments at step(s) ${frag.join(", ")}`;
      const junk = (r.steps || []).some(s => /N\s*u\s*t\s*r\s*i\s*t\s*i\s*o\s*n\s*a\s*l|^[\d.]+\s*m?g\s*$/.test(String(s).trim()));
      return junk ? "a PDF artefact survived into the method" : null;
    },
  },

  // ── Nutrition ─────────────────────────────────────────────────────────────
  {
    id: "light-main-guidance", severity: "nutrition",
    why: "A light main is fine; a light main with nothing telling the user how to complete the plate is the app quietly serving them 200 kcal for dinner.",
    check(r, ctx) {
      if (r.category !== "main" || !r.perPortion) return null;
      const plate = plateGrams(r, ctx);
      if (!(r.perPortion.kcal < 300 || plate < 200)) return null;
      const guided = (r.steps || []).some(s => isNote(s) && /plate it:|protein note:/i.test(s));
      return guided ? null : `${r.perPortion.kcal} kcal / ${Math.round(plate)} g with no serving guidance`;
    },
  },
  {
    id: "fat-dominant-main", severity: "nutrition",
    why: "69% of calories from fat is right for a tahini dip. A MAIN that is fat-dominant and short on protein will not keep anyone full.",
    check(r) {
      if (r.category !== "main" || !r.perPortion || !r.perPortion.kcal) return null;
      const pct = r.perPortion.fat * 9 / r.perPortion.kcal;
      return pct > 0.6 && (r.perPortion.protein ?? 0) < 25
        ? `${Math.round(pct * 100)}% of calories from fat at ${r.perPortion.protein} g protein` : null;
    },
  },
  {
    id: "kcal-matches-macros", severity: "nutrition",
    why: "A card whose calories do not follow from its own macros is arithmetic nobody can trust. Fibre-heavy fruit recipes drift a little, hence 15%.",
    check(r) {
      const pp = r.perPortion; if (!pp || !pp.kcal) return null;
      const atwater = pp.protein * 4 + pp.carbs * 4 + pp.fat * 9;
      const drift = Math.abs(atwater - pp.kcal) / pp.kcal;
      return drift > 0.15 ? `${pp.kcal} kcal declared vs ${Math.round(atwater)} from 4/4/9 (${Math.round(drift * 100)}% out)` : null;
    },
  },

  // ── Presentation ──────────────────────────────────────────────────────────
  {
    id: "batch-portioning", severity: "quality",
    why: "A tray of 8 brownies that never says to cut it into 8 gives the user no way to hit the macros on the card.",
    check(r) {
      if ((r.portions || 1) <= 2) return null;
      return /\b(portion|divide|distribute|split|container|serve|box|jar|store|among them|each (?:bowl|plate|wrap|tortilla|jar))\b/i.test((r.steps || []).join(" "))
        ? null : `${r.portions} portions and no instruction to divide them`;
    },
  },
  {
    id: "method-depth", severity: "quality",
    why: "'Mix dry; blend wet; fold' was the whole method for a ten-ingredient bake.",
    check(r) {
      if (r.category === "preworkout") return null;
      const n = bodyOf(r).length;
      if (n < 3) return `only ${n} method step(s)`;
      const long = bodyOf(r).find(s => s.length > 320);
      return long ? `a ${long.length}-character step — too long to follow on a phone mid-cook` : null;
    },
  },
  {
    id: "subtitle-time", severity: "quality",
    why: "The card shows the subtitle; without a duration the user cannot plan around it.",
    check(r) {
      return /\d+\s*(?:min|hr|hour|h\b)|overnight/i.test(r.subtitle || "") ? null : "subtitle carries no time";
    },
  },
  {
    id: "has-emoji", severity: "quality",
    why: "The grid looks broken without one.",
    check(r) { return /^\p{Extended_Pictographic}/u.test(r.name || "") ? null : "name does not start with an emoji"; },
  },
  {
    id: "has-allergens-field", severity: "quality",
    why: "The release panel shows a blank where the warning should be. The user-facing chips compute live, so this is admin-only — but a blank is still wrong.",
    check(r) { return Array.isArray(r.allergens) ? null : "no allergens field"; },
  },
];

function plateGrams(r, ctx) {
  const IM = (ctx && ctx.IM) || {};
  let g = 0;
  for (const i of r.batchItems || []) {
    const md = IM[i.key]; if (!md) continue;
    const u = String(i.unit || "g").toLowerCase();
    g += (u === "g" || u === "ml") ? i.qty : i.qty * (md.unitG || 0);
  }
  return g / (r.portions || 1);
}

export const RULE_IDS = RULES.map(r => r.id);

/** Findings for one recipe: [{ id, severity, message, why }] */
export function checkRecipe(recipe, ctx = {}) {
  const out = [];
  for (const rule of RULES) {
    let msg = null;
    try { msg = rule.check(recipe, ctx); }
    catch (e) { msg = `rule threw: ${e.message}`; }
    if (msg) out.push({ id: rule.id, severity: rule.severity, message: msg, why: rule.why });
  }
  return out;
}

/** Findings across a library: [{ recipe, findings }] for recipes with any. */
export function checkLibrary(recipes, ctx = {}) {
  return recipes
    .map(r => ({ recipe: r, findings: checkRecipe(r, ctx) }))
    .filter(x => x.findings.length);
}
