# Recipe Audit Standard

**This is the standard. Every recipe audit — now and in future, for existing
recipes and new ones — is done to this depth. No sampling, no spot checks.
Every recipe, every step, every time.**

Set 24 August 2026.

---

## Why this exists

The app's core claim is *"macros verified to the gram."* That is a promise about
data, not a slogan. A wrong number is a product failure. A wrong allergen is a
safety failure.

Previous audits checked macros only, and passed. A deeper pass then found six
ingredients pointing at the wrong food, two contributing zero, and 35 recipes
whose stated macros contradicted their own ingredient list. Those had all been
"verified" before. Checking one dimension well is not the same as checking the
recipe.

---

## The five steps

Run all five, in order, for every recipe. A recipe is not audited until all five
pass or every failure is written down.

### Step 1 — Title and subtitle vs ingredients

Read the name and subtitle. Do they describe the food that is actually listed?

- Every ingredient named in the title or subtitle must appear in `batchItems`.
- Every headline ingredient in `batchItems` should be reflected in the copy.
- Specific claims must be true. If the subtitle says *jasmine rice* and the
  ingredient is *wholegrain brown rice*, that is a failure — they cook
  differently, taste different and carry different fibre.
- Quantity words must hold: "loaded with", "double", "extra" imply a leading
  amount, not a garnish.

### Step 2 — Ingredients and their macros

For every item in `batchItems`:

- **`key` resolves** in `INGREDIENT_MACROS`. A missing key contributes **zero**
  and can still pass the coverage gate, silently understating the recipe.
- **`ingId` resolves** in the `ING_FLAT` / `ING_MAP` bank.
- **The two banks agree.** They are read by different screens. Where they
  disagree, the recipe card and the ingredients tab show different numbers, and
  the shopping list can merge unrelated foods. Check the ingId points at the
  food the label names — not merely at *something*.
- **The macros are right for that food**, per 100 g / 100 mL, against a
  recognised reference (USDA FoodData Central, McCance & Widdowson, or the
  manufacturer's published panel for a named brand). Cite which.
- **Raw vs cooked is consistent** with how the quantity is stated. Raw chicken
  is ~120 kcal/100 g; cooked is ~165. Dry rice ~360; cooked ~130.
- **`unitG` exists and is plausible** for any countable unit (`whole`, `slices`,
  `cans`, `tsp`, `tbsp`). Without it the quantity is read as grams.
- **`cat` is right** — it drives the shopping-list grouping.
- **`role` and `share` are sane** where present.
- **Atwater sanity**: 4·protein + 4·carbs + 9·fat should land near the stated
  kcal. Gaps are legitimate for high-fibre and polyol foods (cacao, tempeh,
  fruit) — say so explicitly rather than "fixing" them.

Then: **bottom-up total vs declared `perPortion`**, divided by `portions`.
Anything over 7% on any macro is a failure. State which side is wrong and why.

### Step 3 — Method vs ingredients

Read `steps` against `batchItems`:

- Every ingredient is used in a step. An unused ingredient is either dead weight
  in the shopping list or a missing instruction.
- Every ingredient named in a step exists in `batchItems`.
- The `badge` (Stovetop / Oven / Air Fryer / Instant Pot) matches what the steps
  actually do.
- Temperatures, times and sequence are plausible and safe — poultry cooked
  through, no raw egg unless intended and flagged, rice liquid ratios workable.
- The method suits the stated `portions`. A 7-portion batch cannot be made in
  one small pan.
- Batch-cook logic holds: what is cooked ahead, what is assembled fresh, how it
  is stored and reheated.

### Step 4 — Allergens and dietary info

**This is the safety step. A false negative here can hurt someone.**

- Check against the **EU FIC 14**: cereals containing gluten, crustaceans, eggs,
  fish, peanuts, soybeans, milk, tree nuts, celery, mustard, sesame, sulphur
  dioxide/sulphites, lupin, molluscs.
- **Detection is substring-based on labels, so it fails in both directions.**
  Verify by reading the ingredient, not by trusting the match:
  - *False negatives — the dangerous kind.* A composite ingredient whose name
    does not contain the trigger word: brioche (milk, egg, gluten), pesto (nuts,
    dairy), stock cubes (celery, gluten), soy sauce (wheat), curry paste
    (shellfish), Worcestershire (fish).
  - *False positives.* "Eggplant" flags egg. "Butternut" flags nuts. "Coconut
    milk" and "almond milk" flag dairy — and simultaneously deny the recipe its
    legitimate Dairy-Free tag.
- Dietary tags (`getDietaryTags`) must be right in the negative direction too: a
  genuinely gluten-free recipe should carry the badge.
- Confirm any claim the copy makes — vegan, vegetarian, high-protein,
  low-carb — against the ingredients.
- Add a `note` where a recipe needs one: pre-workout timing, casein before
  sleep, leucine for plant protein, a bulk-calorie warning.

### Step 5 — Record the verdict

Per recipe: **PASS**, or every failure with severity, the measured numbers, and
the most likely cause. Distinguish *the data is wrong* from *the code reads the
data wrongly* — they have different fixes.

---

## Rules for doing it

1. **Compute, don't eyeball.** Extract the data and the app's own functions into
   a Node harness and run them. Report measured numbers.
2. **Cite the source** for any macro you assert or change.
3. **Say when you are unsure.** "I cannot tell which of these two figures is
   authoritative" is a valid and useful finding. Inventing a number is not.
4. **Never guess a macro to make a check pass.** If a recipe cannot be
   reconciled, it needs re-measuring, not re-typing.
5. **Preserve legitimate discrepancies.** Fibre-discounted energy is not an
   error. Document it so the next audit does not "fix" it.
6. **Re-run the whole suite after any change.** A fix to one ingredient moves
   every recipe that uses it.

## Release gate

No recipe ships until all five steps pass. Specifically, a recipe may not be
released while any ingredient lacks an `INGREDIENT_MACROS` entry — without one
there is no bottom-up verification, and the "verified to the gram" claim is
unbacked for that recipe.
