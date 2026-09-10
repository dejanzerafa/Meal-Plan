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
export const DEFERS = /(?:per|to|under|following)\s+(?:just\s+)?(?:the\s+)?(?:packet|package)|according to (?:the )?(?:packet|package)|packet (?:time|instructions)|package (?:time|directions)|to your liking|to your preference/i;
// "al dente" is a doneness, and a cook knows what it means — it was missing,
// so a step that gave a perfectly good cue was reported as unanswerable.
export const DONENESS_CUE = /\buntil\b|\bto your\b|\d+\s*°C|no (?:longer )?pink|golden|tender|crisp|set\b|wilted|softened|fragrant|charred|opaque|shreds?|al dente/i;
export const CARB = /rice|pasta|potato|quinoa|couscous|bread|tortilla|wrap|noodle|oats|barley|farro|bulgur|gnocchi|polenta|pita|bagel|falafel/i;
// The house doneness temperature. USDA and Health Canada give 74°C (165°F)
// instantaneous for poultry; the UK FSA writes it as 70°C for 2 min, 75°C for
// 30 s, 80°C for 6 s. 75°C satisfies the FSA table directly and clears USDA
// outright, so the whole library quotes one number. Researched 2026-09-08.
export const HOUSE_TEMP = 75;
export const ANY_DONENESS_TEMP = /\b(7[45]|8[02])\s*°\s*C\b|\b16[5-9]\s*°\s*F\b/;

// ── Technique vocabulary ────────────────────────────────────────────────────
// A "single layer" or "pat dry" sentence about CHILLING or FREEZING is storage
// advice, not browning advice. Three desserts were flagged during the 2026-09-10
// audit purely for saying how to store them.
export const STORAGE_SENTENCE = /\b(chill|freeze|frozen|store|storing|airtight|fridge|keep|keeps|lid|tub|box|bag)\b/i;
export const PASTA = /\b(pasta|spaghetti|penne|fusilli|linguine|orzo|macaroni|rigatoni|farfalle)\b/i;
// Japanese and Chinese noodles are salted in manufacture and are conventionally
// boiled in UNSALTED water. That convention is correct; do not "fix" it.
export const PRESALTED_NOODLE = /\b(udon|ramen|somen|soba|rice noodle|vermicelli)\b/i;
export const LONG_GRAIN = /\b(basmati|jasmine|long.grain|long grain)\b/i;
export const GROUND_SPICE = /\b(cumin|ground coriander|paprika|turmeric|curry powder|garam masala|chill?i powder)\b/i;
export const THIN_LIQUID = /\b(stock|broth|water|tomatoes|coconut milk|passata)\b/i;

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
      // The mince word has to be on the MEAT's own label. Testing the whole
      // ingredient list meant "Lean beef tenderloin" + "Coriander (ground)"
      // counted as minced beef, and so did "Braising beef" + "Garlic (minced)".
      // Both got a cooked-through cue they did not need, on a step that was not
      // even cooking meat.
      const isMince = (r.batchItems || []).some(i =>
        /\b(beef|lamb|pork)\b/i.test(i.label || "") && /\b(mince[d]?|ground)\b/i.test(i.label || ""));
      if (!isMince) return null;
      const T = (r.steps || []).join(" ");
      return /(7[0-9]|8\d)\s*°C|no (?:longer )?pink|right through|cooked through|fully browned|until browned/i.test(T)
        ? null : "minced red meat with no cooked-through cue";
    },
  },
  {
    id: "reheat-doneness", severity: "safety",
    why: "'Reheat in the microwave' with no time and no doneness is a guess, not an instruction.",
    check(r) {
      // Scoped to the sentence that says "reheat". Testing the whole recipe
      // meant a poultry doneness cue elsewhere ("reads 75°C") satisfied the
      // reheat rule, so "Reheat in the microwave." full stop passed on every
      // chicken recipe in the library. Caught by test-recipe-rules.mjs.
      // Only an instruction counts. "add the syrup after reheating" and "stir in
      // water when reheating" are asides about something else — the gerund is
      // the tell, and matching /reheat/ loosely flagged four of them.
      const withReheat = (r.steps || []).flatMap(x => String(x).split(/(?<=[.!?])\s+/))
        .filter(x => /\breheat\b/i.test(x)
                  && !/\b(after|when|before|while|during|than)\s+reheat/i.test(x)
                  // "No reheating needed; eat cold" is the opposite of a reheat
                  // instruction, and appending a doneness to it produced
                  // "eat cold or at room temperature, until steaming hot".
                  && !/\bno\b[^.]{0,20}\breheat/i.test(x));
      if (!withReheat.length) return null;
      const answered = withReheat.some(x =>
        /(steaming hot|piping hot|hot (?:all the way )?through|through(?:out)?|75\s*°C|until hot)/i.test(x)
        // "60–70% microwave power" and "60-second bursts" are answers. The
        // first draft of this pattern demanded "power" immediately after the %
        // and no hyphen before "second", so it called both of them unanswered.
        || /\d+\s*W\b/i.test(x)
        || /\d+\s*(?:[–-]\s*\d+\s*)?%[^.]{0,20}\bpower\b/i.test(x)
        || /\d+\s*[-–]?\s*(?:min|sec)/i.test(x));
      return answered ? null : "reheat advice with neither a time nor a doneness";
    },
  },
  {
    id: "cold-marinade", severity: "safety",
    why: "Hours of marinating at room temperature is a bacterial incubator.",
    check(r) {
      // Scoped to the marinating step. Against the whole recipe, a "refrigerate
      // within an hour" rice note counted as refrigerating the marinade.
      const steps = (r.steps || []).map(String).filter(x => /\bmarinate\b/i.test(x));
      if (!steps.length) return null;
      const long = steps.some(x => /\b(overnight|\d+\s*h(?:ours?|rs?)?)\b/i.test(x));
      const cold = steps.some(x => /fridge|refrigerat|chill|cold/i.test(x));
      return long && !cold ? "marinates for hours with no mention of the fridge" : null;
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
      if (!ovenVerb && !airFry) return null;
      // The temperature has to be on the oven step or a preheat — a poultry
      // doneness reading of 75°C somewhere else is not an oven setting, and
      // testing the whole method let "Roast the chicken 25 min" pass on it.
      // "air fryer basket" — \b after "fry" does not match "fryer", so the step
      // that carried the temperature was not recognised as an oven step at all.
      const oven = B.filter(x => /\b(bake|roast|oven|air[- ]?fry\w*|preheat)/i.test(x) && !/dutch oven|instant pot/i.test(x));
      const hasTemp = oven.some(x => /\d+\s*°C/.test(String(x).replace(/(?:reads?|internal(?:ly)?|core|thickest part|centre)[^.]{0,30}?\d+\s*°C/gi, " ")));
      return hasTemp ? null : "an oven or air-fryer step with no temperature";
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
  //
  // There was a `light-main-guidance` rule here, requiring every main under
  // 300 kcal or 200 g to carry a 🍽️ or 💪 note explaining how to complete the
  // plate. It was retired on 2026-09-10 along with the 43 notes that satisfied
  // it, and the reason is worth keeping:
  //
  // The rule and the notes were written together, so the rule could only ever
  // report success — it was measuring whether the notes existed, not whether
  // the library was any good. What it produced was 195 of 401 recipes carrying
  // more note text than method text, and a paragraph on the card telling the
  // cook that the recipe they had just chosen "sits below what a main should
  // carry". The protein and calorie numbers are already on every card, and the
  // protein filter chips already let someone avoid a light main.
  //
  // If light mains become a real problem, the fix belongs in the filters or in
  // the recipes themselves — not in a rule that is satisfied by adding text.
  {
    id: "badge-matches-method", severity: "wrong",
    why: "The badge is a filter. A yogurt bowl badged Stovetop tells someone to heat something they never heat, and hides no-cook recipes from the people looking for them. Melting chocolate in a microwave is still fair to call no-cook; needing a hob, an oven or a blender is not.",
    check(r) {
      const body = bodyOf(r).join(" ");
      const b = r.badge || "";
      // "brown rice" is not the verb "brown", and "browned butter" is not a
      // cooking step. Same class of bug as "ground coriander" counting as mince.
      const HOB = /\b(saut[ée]|sear|simmer|boil|stir[- ]?fry|pan[- ]?fry|griddle|poach|blanch|braise|scramble|wilt|fry)\b|\bbrown\b(?!\s+(?:rice|sugar|bread|butter))/i;
      if (/Blender/i.test(b) && !/\bblend/i.test(body)) return "badged Blender but nothing is blended";
      if (/Oven/i.test(b) && !/\b(oven|bake|roast|grill)\b/i.test(body)) return "badged Oven but nothing goes in an oven";
      if (/Air Fryer/i.test(b) && !/air[- ]?fry/i.test(body)) return "badged Air Fryer but nothing is air-fried";
      if (/Stovetop/i.test(b) && !HOB.test(body) && !/\b(cook|heat|warm|toast)\b/i.test(body))
        return "badged Stovetop but nothing is cooked";
      // For No-Cook the bar is wider than the hob: steaming, baking or roasting
      // anything disqualifies it too. Toasting, melting and warming do not —
      // those need a toaster or 20 seconds in a microwave, not cooking.
      if (/No[- ]?Cook/i.test(b)) {
        const cooks = bodyOf(r).some(x => {
          const t = String(x);
          if (/\b(toast|melt|warm|thaw|defrost)\b/i.test(t) && !HOB.test(t)) return false;
          return HOB.test(t) || /\b(cook|steam|bake|roast|grill|air[- ]?fry)\b/i.test(t);
        });
        if (cooks) return "badged No-Cook but the method cooks something";
      }
      return null;
    },
  },
  {
    id: "subtitle-matches-badge", severity: "quality",
    why: "The subtitle repeats the method in words. 'Stovetop · 8 hr' on overnight oats is the same lie as the badge, in a place the user reads first.",
    check(r) {
      const sub = String(r.subtitle || ""), b = r.badge || "";
      if (/No[- ]?Cook/i.test(b) && /\b(stovetop|oven|blender|air fryer)\b/i.test(sub))
        return `badge is No-Cook but the subtitle says "${sub.split("·")[0].trim()}"`;
      if (/Stovetop/i.test(b) && /\bno[- ]?cook\b/i.test(sub))
        return `badge is Stovetop but the subtitle says no-cook`;
      return null;
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

  // ── Technique — the recipe is accurate, but the dish will not work ─────────
  //
  // Added 2026-09-10 after a full technique audit of all 401 recipes. Rules were
  // researched from Serious Eats / Kenji López-Alt, America's Test Kitchen,
  // Harold McGee's On Food and Cooking, USDA FSIS, the UK FSA and Harvard's
  // Nutrition Source, then VALIDATED against the real library before being
  // trusted. Six of the first 87 findings were false positives, and the only way
  // that surfaced was reading each flagged recipe in full.
  //
  // The lookalike clauses below matter more than the detect patterns. Every one
  // of those six was a rule firing on text that merely looked like the error.
  //
  // Three researched rules were deliberately NOT encoded because their evidence
  // is contested: resting meat (the juice-loss measurement replicates, the
  // sensory benefit does not), charring meat (HCAs form, but NCI states the
  // human cancer link is not established) and smoke points (oxidative stability
  // predicts heated performance better, so EVOO must not be flagged).
  //
  // A fourth, `no-acid-to-finish`, was implemented, ran at 21 findings and was
  // retired on review: it traced to chef consensus rather than a measurement,
  // and could not tell "no acid" from "acid, added early".
  {
    id: "pasta-water-salted", severity: "technique",
    why: "Pasta absorbs its cooking water, so salt there seasons the pasta itself. Salt only in the sauce leaves bland pasta under a seasoned coating. About 10 g per litre.",
    check(r) {
      const ing = (r.batchItems || []).map(i => i.label || "").join(" ");
      if (!PASTA.test(ing)) return null;
      const T = bodyOf(r).join(" ");
      if (!/\b(cook|boil)\b[^]{0,60}\b(pasta|spaghetti|penne|orzo|macaroni|noodles|rigatoni)\b/i.test(T)) return null;
      if (PRESALTED_NOODLE.test(ing + T)) return null;   // salted in manufacture
      return /salt(ed)?\s+(the\s+)?water|water[^]{0,30}salt|season the water/i.test(T)
        ? null : "boils pasta without salting the water";
    },
  },
  {
    id: "long-grain-rice-rinsed", severity: "technique",
    why: "Milling leaves loose surface starch; unrinsed basmati and jasmine cook gummy rather than separate. NOT an arsenic measure — rinsing removes only ~10%, and risotto/paella rice must NOT be rinsed.",
    check(r) {
      const ing = (r.batchItems || []).map(i => i.label || "").join(" ");
      if (!LONG_GRAIN.test(ing)) return null;
      if (/\bcooked\b/i.test(ing.match(/[^|]*(?:basmati|jasmine|long.grain)[^|]*/i)?.[0] || "")) return null; // bought pre-cooked
      const T = bodyOf(r).join(" ");
      if (!/\brice\b/i.test(T) || !/\b(cook|boil|simmer|steam)\b/i.test(T)) return null;
      return /rins|wash|runs clear/i.test(T) ? null : "cooks long-grain rice without rinsing it";
    },
  },
  {
    id: "spices-bloomed-in-fat", severity: "technique",
    why: "Most of the aroma in ground cumin, paprika, turmeric and curry powder is fat-soluble. Tipped into stock or coconut milk they stay raw and dusty; 30–60 s in hot fat extracts them. The tarka principle.",
    check(r) {
      for (const s of bodyOf(r)) {
        const l = s.toLowerCase();
        if (!GROUND_SPICE.test(l) || !THIN_LIQUID.test(l)) continue;
        if (/until fragrant|bloom|toast|in the oil|in the fat|30 seconds|1 minute/.test(l)) continue;
        // A cold mix has no fat stage to bloom in, and a slow cooker has no
        // frying stage at all — hol6's cumin goes into a cold salsa and m50 is
        // a slow cooker. Neither is fixable and neither is wrong.
        if (/\b(slow cooker|cold|chilled|dip|dressing|salsa|whisk|mix with)\b/.test(l)) continue;
        if (!bodyOf(r).some(x => /\b(heat|saut[ée]|fry|oil|butter|ghee)\b/i.test(x))) continue;
        return `ground spices go straight into liquid: "${s.slice(0, 70)}"`;
      }
      return null;
    },
  },
  {
    id: "blanched-greens-shocked", severity: "technique",
    why: "Held hot, blanched greens carry on cooking and their chlorophyll degrades to olive-brown pheophytin. Iced water stops both. Irrelevant when they go straight into a hot pan.",
    check(r) {
      const T = bodyOf(r).join(" ");
      const s = bodyOf(r).find(x => /blanch/i.test(x) && /green bean|broccoli|asparagus|peas|spinach|kale|chard|mangetout|sugar snap/i.test(x));
      if (!s) return null;
      if (/ice bath|iced water|cold water|refresh|shock|plunge/i.test(T)) return null;
      if (/\b(wok|stir.fry|return to the pan)\b/i.test(T)) return null;   // finishes in the pan
      return "blanches greens with no cold-water shock";
    },
  },
  {
    id: "onion-before-garlic", severity: "technique",
    why: "Garlic scorches and turns acrid in 30–60 s at sauté heat; onion needs 5–8 min. Added together you get burnt garlic or raw onion.",
    check(r) {
      for (const s of bodyOf(r)) {
        const l = s.toLowerCase();
        if (!/\bgarlic\b/.test(l)) continue;
        if (/garlic powder|onion powder|granulated garlic/.test(l)) continue;   // not fresh alliums
        if (!/\b(diced|chopped|sliced|minced|fresh)\s*(onion|shallot|leek)/.test(l)) continue;
        // NO trailing \b. "sauté" ends in a non-word character, so \b after it
        // requires a boundary that never exists before a space — the rule could
        // not fire on any sautéing step at all. Same shape as the "fryer" bug
        // that hid 12 safety findings in the 2026-09-08 audit.
        if (!/\b(cook|saut[ée]|fry|brown)/.test(l)) continue;
        if (/\b(stock|broth|water|slow cooker|pressure)\b/.test(l)) continue;   // no scorch risk in liquid
        // Only a SIMULTANEOUS addition is the error. hol4 says "sauté onion
        // 3 min until softened, then garlic 1 min" and v5 puts them in separate
        // sentences — both are correctly staged and were flagged by a first
        // draft of this rule that merely found the two words in one step.
        const oi = l.search(/\b(onion|shallot|leek)/), gi = l.indexOf("garlic");
        if (oi < 0 || gi < 0) continue;
        const between = l.slice(Math.min(oi, gi), Math.max(oi, gi));
        if (/[.;]|\bthen\b|\bafter\b|\bonce\b|\bnext\b|\bremove\b|min/.test(between)) continue;
        if (!/\b(and|,)\b/.test(between)) continue;
        return `onion and garlic go in together: "${s.slice(0, 70)}"`;
      }
      return null;
    },
  },
  {
    id: "technique-not-buried-in-a-note", severity: "technique",
    why: "The tips block is collapsed behind STORAGE & TIPS, so a tip is no longer read in passing. 'Salt the courgette noodles and pat dry' decides whether the dish works — skip it and the garlic butter is watery. The test: if skipping the line makes the dish fail, it is a step, not a tip.",
    check(r) {
      const noteText = notesOf(r).join(" ").split(/(?<=\.)\s+/)
        .filter(x => !STORAGE_SENTENCE.test(x)).join(" ").toLowerCase();
      const body = bodyOf(r).join(" ").toLowerCase();
      const browns = /\b(brown|sear|fry|saut[ée]|roast|bake|air.?fry|griddle|char)\b/i.test(body);
      // The body pattern is deliberately LOOSER than the note pattern. Matching
      // them made already-fixed recipes keep firing: "pat .{0,12}dry" caught the
      // tip but not the promoted step "Pat the surface completely dry".
      const CRIT = [
        [/press(ing)? the tofu/, /press[^.]{0,25}tofu/, "press the tofu"],
        [/pat [^.]{0,14}dry|blot [^.]{0,14}dry/, /\bpat\b[^.]{0,40}\bdry\b|\bblot\b/, "pat dry"],
        // "single layer" only counts when the recipe actually browns or roasts.
        // ds20 lays banana slices on a rice cake in a single layer — assembly,
        // not browning, and step 2 already says to lay them over the top.
        [browns ? /in batches|do not crowd|single layer/ : /(?!)/, /in batches|do not crowd|single layer|without crowding/, "cook in a single layer"],
        [/against the grain/, /against the grain/, "slice against the grain"],
      ];
      for (const [inNote, inBody, label] of CRIT)
        if (inNote.test(noteText) && !inBody.test(body)) return `"${label}" appears only in a tip, not in the method`;
      return null;
    },
  },
  {
    id: "no-kitchen-myths", severity: "technique",
    why: "Eleven pieces of received wisdom are false or overstated. Repeating one in a method teaches it. Searing does not seal juices (Liebig, 1847, disproved); ~40% of alcohol remains after 15 min simmering (USDA retention factors); oil in pasta water floats, then makes sauce slide off; salt SOFTENS beans, acid is what keeps them firm; the FSA withdrew the potato-fridge advice.",
    check(r) {
      const T = (r.steps || []).join(" ");
      const MYTHS = [
        [/seal(s|ing)? in the juices|lock in the juices|seal the meat/i, "searing seals in the juices"],
        [/alcohol (will )?(cook|burn)s? off|alcohol evaporates completely/i, "the alcohol all cooks off"],
        [/add(ing)? (a splash of )?oil to the (pasta )?water/i, "oil in the pasta water"],
        [/(do not|don't) salt the beans until|salt(ing)? beans early/i, "salt toughens beans"],
        [/never (wash|rinse) mushrooms|mushrooms are sponges/i, "never wash mushrooms"],
        [/juices (can )?redistribute|juices to (flow|move) back/i, "resting redistributes the juices"],
        [/rinse the rice to remove[^.]{0,15}arsenic/i, "rinsing removes the arsenic"],
        [/salt (helps|makes) the water boil (faster|quicker)/i, "salt makes water boil faster"],
        [/never (use|cook with) (extra.virgin )?olive oil/i, "never cook with olive oil"],
        [/(do not|don't) (store|keep) potatoes in the (fridge|refrigerator)/i, "potatoes must not go in the fridge"],
      ];
      for (const [re, name] of MYTHS) if (re.test(T)) return `repeats the myth "${name}"`;
      return null;
    },
  },
];

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
