# SoulGainz — Recipe & Ingredient Standards
> Baseline: v16 · Last verified: 94 recipes, 269 ingredients, 650 macro entries, 734 batchItems all passing

Every new recipe, ingredient, or edit must conform to these rules.
Run `node validate.js` after any change to confirm nothing is broken.

---

## Adding a New Recipe

### Step 1 — Pick an ID
Use the **next sequential ID** for the category. Never reuse or skip.

| Category | Current max | Next to use |
|---|---|---|
| Main meals | `m51` | `m52`, `m53`, … |
| Holiday / seasonal | `hol10` | `hol11`, `hol12`, … |
| Breakfast | `b6` / `bf6` | `b7` / `bf7`, … |
| Dessert | `ds2` | `ds3`, … |
| Pre-workout | `pw6` | `pw7`, … |

### Step 2 — Required fields (every recipe must have all of these)

```js
{
  id: "m52",                    // unique, sequential (see table above)
  category: "main",             // main | breakfast | dessert | preworkout
  name: "🍗 Recipe Name",       // start with an emoji
  subtitle: "Short description · cook method · time",
  badge: "🍳 Stovetop",         // cooking method badge
  carb: "Rice",                 // primary carb source label
  portions: 7,                  // how many servings batchItems quantities make
  perPortion: {                 // must match bottom-up calculation (see Check 8)
    kcal: 600,
    protein: 50,
    carbs: 55,
    fat: 12.0
  },
  batchItems: [ /* see below */ ],
  steps: [ "Step 1...", "Step 2..." ],  // at least 3 steps
  note: "Optional chef note.",
}
```

### Step 3 — batchItem rules

Each ingredient entry:

```js
{ 
  key:   "m52_chicken",         // UNIQUE globally. Format: {recipeId}_{ingredient}
                                // Use UNDERSCORES (not hyphens) — e.g. m52_rice not m52-rice
  label: "Diced chicken breast",
  qty:   700,                   // total quantity for the whole batch (portions × per-day)
  unit:  "g",                   // g | mL | whole | tsp
  cat:   "Protein",             // Protein | Carbs | Vegetables | Dairy | Fats | Sauces | Aromatics
  ingId: 1,                     // REQUIRED — must match an id in ING_FLAT
  role:  "protein",             // protein | carbs | fat | veg | fixed
  share: 1,                     // 0–1, for macro-balancer (protein/carbs/fat roles)
}
```

**Key naming:** `{recipeId}_{shortName}` using underscores.
- ✅ `m52_chicken`, `m52_rice`, `m52_onion`
- ❌ `m52-chicken` (hyphens cause issues), `chicken_m52` (wrong order)

**For `unit: "whole"` items** — the INGREDIENT_MACROS entry MUST have `unitG` set.
Without it the ingredient will show zero macros in the UI.

### Step 4 — Add INGREDIENT_MACROS entries

Every batchItem key must have an entry. Format:

```js
// Gram-based (unit: "g" or "mL"):
"m52_chicken": { kcal: 110, p: 23.0, c: 0.0, f: 1.5 },

// Whole-unit (unit: "whole") — MUST include unitG:
"m52_egg": { kcal: 147, p: 13.0, c: 0.7, f: 10.0, unitG: 60 },
//                                                   ↑ grams per 1 unit
```

Values are **per 100g** (or per 100mL). Use ING_FLAT as the source of truth — copy the kcal/p/c/f from the matching ING_FLAT entry.

### Step 5 — Verify perPortion accuracy

perPortion must match a bottom-up calculation from batchItems. Use this formula:

```
perPortion.kcal = Σ (INGREDIENT_MACROS[key].kcal / 100 × qty_g) / portions
```

Tolerances allowed: ±60 kcal · ±10g protein · ±12g carbs · ±6g fat

`node validate.js` runs this automatically.

### Step 6 — Bump the service worker

After every change to index.html, increment both numbers in sw.js:

```js
// SW v116 → v117
const CACHE_NAME = 'meal-plan-v143';  // increment this number too
```

---

## Adding a New Ingredient to ING_FLAT

### When to add
Add a new ingredient only if no existing entry covers it adequately.
Check ING_FLAT first — there are 269 entries covering most common foods.

### Format

```js
{ id: 298, name: "Ingredient Name", cat: "Category", kcal: 100, p: 10.0, c: 5.0, f: 2.0 }
// For whole-unit items add:  unitG: 60  ← grams per 1 unit (goes in INGREDIENT_MACROS, not here)
```

**Next available id: 298**

Categories: `Meat & Fish` · `Dairy & Eggs` · `Grains & Carbs` · `Legumes & Beans` ·
`Vegetables` · `Fruits` · `Fats & Oils` · `Sauces & Condiments` · `Supplements` ·
`Baking` · `Beverages` · `Nuts & Seeds`

All values are **per 100g raw/dry** weight.

---

## The Validator

Run after any change:

```bash
node validate.js
```

What it checks:
1. No duplicate recipe IDs
2. All required fields present on every recipe
3. No duplicate batchItem keys across all recipes
4. All `ingId` values resolve in ING_FLAT
5. All batchItem keys exist in INGREDIENT_MACROS
6. All `unit=whole` items have `unitG > 0` in INGREDIENT_MACROS
7. Every batchItem will display macros in the UI
8. perPortion within tolerance of bottom-up calculation
9. ING_FLAT IDs are unique
10. Shows next safe IDs to use

A clean run looks like:
```
✅  All 94 recipe IDs unique
✅  All recipes have required fields
✅  All batchItem keys globally unique
...
✅  ALL CHECKS PASSED — safe to commit
```

Any ❌ must be fixed before committing. ⚠️ warnings are worth reviewing.

---

## Reset to Baseline

To restore the app to the verified baseline-v17 state:

```bash
cd "/Users/dejanzerafa/Desktop/Cowork/MEAL PREP APP"
git fetch --tags
git reset --hard baseline-v17
```
