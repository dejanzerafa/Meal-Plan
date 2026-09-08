# Recipe intake — how a new recipe gets into the app

Written 2026-09-08, after two full audits of all 401 recipes. Every rule below
exists because something went wrong without it.

The short version: **nothing reaches a user until it passes
`scripts/check-recipe-quality.mjs`, and nothing goes live until Dejan releases
it from the Recipes tab.**

---

## The standing rules

These are set by Dejan and do not change without him saying so.

1. **Every new recipe lands in `PENDING_RECIPES`, held.** Never in `RECIPES`,
   never released. Releasing is a decision made in the app's admin Recipes tab,
   one recipe at a time.
2. **No existing recipe is edited without review.** Not the macros, not the
   steps, not the tips. If an audit says an existing recipe is wrong, it goes in
   a report and waits.
3. **Review before integration, not after.** A new batch is read and decided on
   — keep, drop, replace — before it is written into `index.html`.
4. **Grams and millilitres only.** No cups, no cans, no slices. The macros are
   computed from grams, so anything else is a guess.
5. **Every ingredient maps to an `ING_FLAT` row.** If nothing fits, ask before
   inventing one — a near-miss row is how the two macro banks drifted apart.
6. **Format differences are not duplicates.** A bowl and a salad of the same
   ingredients are two recipes. A second copy of the same dish is not.
7. **The library launches as it is.** New recipes are added in milestone drops
   (200 / 250 / 300) with the copy counts updated everywhere at the same time.

---

## The pipeline

```
source (PDF, screenshots, text)
   │
   ├─ 1. parse        →  recipe-intake/cookbook-YYYY-MM-DD.json
   ├─ 2. map          →  every ingredient to an ING_FLAT id
   ├─ 3. build        →  recipe-intake/build-YYYY-MM-DD.json
   ├─ 4. VALIDATE     →  node scripts/check-recipe-quality.mjs build-….json
   ├─ 5. REVIEW       →  Dejan reads the batch and decides
   ├─ 6. insert       →  into PENDING_RECIPES, status held
   ├─ 7. verify       →  check-ingredients + test-regressions + smoke
   └─ 8. release      →  Dejan, from the app's Recipes tab
```

Steps 4 and 5 are the ones that get skipped under time pressure. They are the
two that matter.

### 1. Parse

Whatever the source is, get to one JSON object per recipe with: title,
servings, ingredient lines as written, method lines as written, and any claimed
macros. Keep the raw lines — you will need them when the parse turns out to be
wrong.

Two things the cookbook PDF taught us:

- It is **two columns**, and steps get cut at the column edge. `"Preheat your
  grill or grill pan to"` is a complete step as far as the parser is concerned.
- **Page 49 carried page 48's method.** The source itself was wrong, and the
  import was faithful. bf58 shipped as "Peanut Butter Banana Overnight Oats"
  with a method for cottage cheese on toast. The `no-stray-foods` rule exists to
  catch exactly this.

### 2. Map every ingredient

`recipe-intake/ingmap.py` does the first pass by regex. Check it, because the
order of the patterns decides the answer: "vanilla protein powder" matched
"vanilla extract" for a while, and "tuna in water" matched "water".

For each ingredient you need:

- an `ING_FLAT` id — the shared registry row, which drives the ingredients tab
  and the shopping list
- an `INGREDIENT_MACROS` key — per-recipe, which drives the card

**These two must agree exactly.** `check-ingredients.mjs` enforces it on every
nutrient now; it used to compare calories only, at 15%, which let whole-wheat
pasta read 348 kcal in one bank and 354 in the other while its protein read
14 g against 20 g.

If a recipe genuinely uses a different product — high-protein legume pasta
rather than wholewheat — **add a registry row for it** rather than pointing at
the nearest one. That is what keeps the shopping list honest about what to buy.

### 3. Build

Produce recipe objects in the shape below. Per-portion macros are computed from
the ingredient rows, never copied from the source: published macros in recipe
books are frequently wrong, and `check-ingredients.mjs` will fail the build if
the card and the ingredients disagree by more than 7%.

### 4. Validate — the gate

```bash
node scripts/check-recipe-quality.mjs recipe-intake/build-YYYY-MM-DD.json
```

Runs every rule in `scripts/lib/recipe-rules.mjs` — the same rules the
regression suite asserts and CI gates on. Exit code 1 on any finding.

`--severity safety` narrows it to the findings that could make someone ill.

### 5. Review

Produce a review file for Dejan: every recipe, its macros, its duplicates
against the existing library, and anything the validator flagged. Wait.

### 6. Insert

Into `PENDING_RECIPES`. Set the tier list (`RECIPE_TIER_PENDING`), and leave the
release row `held`. Bump `CACHE_NAME` in `sw.js` — an unbumped service worker
means no installed app ever sees the change.

### 7. Verify

```bash
node scripts/check-ingredients.mjs        # both registries agree, macros reconcile
node scripts/check-recipe-quality.mjs     # every content rule
node scripts/test-regressions.mjs         # the full suite (CI runs it in 4 timezones)
node scripts/dev/smoke-runtime.mjs        # the whole app in jsdom, zero console errors
```

### 8. Release

Dejan, in the app: Admin → Recipes → per recipe, choose the tier and release.
New releases show a 🔥 NEW badge for 60 days.

---

## The recipe shape

```js
{
    category: "main",              // main | salad | breakfast | dessert | smoothie | preworkout
    id: "m192",                    // unique; scripts/next-recipe-ids.mjs tells you the next free one
    name: "🍗 Something Specific", // MUST start with an emoji
    subtitle: "Chicken · rice · greens · ~35 min",   // MUST carry a time, or say "overnight"
    badge: "🍳 Stovetop",          // must be one the badge filter knows
    carb: "🍚 Rice",               // must be one the carb filter knows
    portions: 4,
    perPortion: {kcal: 520, protein: 42.1, carbs: 55.3, fat: 12.4},   // computed, not copied
    allergens: ["Gluten / Wheat", "Dairy"],   // from the detectAllergens vocabulary
    batchItems: [
        { key: "m192_chicken", label: "Chicken breast (raw)", qty: 600, unit: "g",
          cat: "Protein", ingId: 1, role: "protein", share: 1 },
        // unit is g, ml or whole. Nothing else.
        // key must exist in INGREDIENT_MACROS with macros identical to ingId's row.
    ],
    steps: [
        "Every cooking step needs a time, a doneness cue, or 'per the packet'.",
        "Cook the chicken until the thickest part reads 75°C.",
        "Divide equally into 4 portions — weigh the batch rather than splitting by eye.",
        "💡 Storage and technique tips go last, prefixed with a note emoji.",
    ],
}
```

### Note prefixes

A line starting with one of these is a **note**, not a step: it is not numbered,
not counted in "N/N done", and not read by `detectAllergens`.

| Prefix | Used for |
|---|---|
| 💡 | storage and technique |
| 🟡 | nutrient pairing (turmeric + black pepper) |
| 🔬 | leucine / protein-quality notes |
| ⚡ | fuelling and timing around training |
| 💪 | protein suggestions ("add 150 g Greek yogurt") |
| 🍽️ | serving suggestions ("add 150 g rice to complete the plate") |
| ⏱️ | timing notes |
| 😴 | pre-sleep / casein notes |

Adding a new prefix means editing **three** places, and the regression suite
checks they agree: `NOTE_RE` in `scripts/lib/recipe-rules.mjs`, and both
`isNote` definitions in `index.html` (the step/tip split and `detectAllergens`).

A note may suggest food the recipe does not contain — that is what a suggestion
is. That is also why `detectAllergens` skips them: a 💪 note offering Greek
yogurt made dairy-free recipes declare Dairy.

---

## The rules, and what each one is for

`scripts/lib/recipe-rules.mjs` carries the full reasoning inline. In short:

**Safety** — poultry states 75°C; the house temperature is 75°C everywhere; a
ready-cooked-chicken recipe never tells you to cook it; rice cooked in the
recipe carries the rapid-cool note (Bacillus cereus survives cooking, and slow
cooling is the classic meal-prep poisoning); minced red meat says cooked
through; reheating gives a time or a doneness; marinades over an hour name the
fridge.

**The recipe must not misstate itself** — every cooking step is answerable;
every bought ingredient is used; no method calls for food the recipe does not
contain; the named cut matches the ingredient; oven and air-fryer steps give a
temperature; measures are metric; quantities are weighable; no duplicate
ingredient rows; no PDF fragments.

**Nutrition** — light mains carry serving guidance rather than pretending 200
kcal is dinner; no main is fat-dominant and short on protein; calories follow
from the macros.

**Presentation** — batches say how to divide; methods have at least three steps
and none over 320 characters; subtitles carry a time; names start with an emoji;
every recipe has an allergens field.

---

## Scripts

| Script | What it does |
|---|---|
| `scripts/lib/recipe-rules.mjs` | the rules, once — imported by everything below |
| `scripts/check-recipe-quality.mjs` | the gate: whole library, or one batch file |
| `scripts/check-ingredients.mjs` | both macro banks agree; every card reconciles with its ingredients |
| `scripts/next-recipe-ids.mjs` | the next free id per category, and duplicate-id detection |
| `scripts/test-regressions.mjs` | the full suite, one assertion per rule |
| `scripts/dev/smoke-runtime.mjs` | loads the app in jsdom and fails on any console error |
| `recipe-intake/audit-2026-09-08.mjs` | the exploratory audit that found this round |

Fixers are dated and kept for the record: `fix-2026-09-07.mjs`,
`fix-doneness-2026-09-08.mjs`, `fix-safety-2026-09-08.mjs`,
`fix-methods-2026-09-08.mjs`, `fix-nutrition-2026-09-08.mjs`,
`fix-macro-banks-2026-09-08.mjs`, `fix-shares-2026-09-08.mjs`. Each writes a
report next to itself. They are not meant to be re-run.

---

## Two failure modes worth knowing about

**Writing to the wrong recipe.** The applier anchored recipe blocks on
`"\n    {"`, but two recipes in `index.html` open at column zero. Their edits
landed in the *previous* recipe. Any script that edits a recipe block in place
must refuse a block containing more than one `id:`, and you should diff every
field against the pre-edit file afterwards.

**A check that is wrong in the reassuring direction.** A first draft of the
timing audit reported 216 recipes because `\b` after a bare `min` rejects
"minutes". Another flagged 57 recipes for naming a cut they do not use, because
"minced garlic" matched "mince". Both would have wasted a day of edits on
recipes that were fine. Validate a new check against a handful of real recipes,
by hand, before acting on its output.
