# SoulGainz — New Recipe Template & Integration Guide

When you have a new recipe idea, paste it using the format below.
I'll handle: ingredient ID lookup, macro research, ING_FLAT + INGREDIENT_MACROS entry creation,
batchItems wiring, recipe insertion, and git commit. You just run `git push`.

---

## How to Submit a New Recipe

Paste your idea like this:

```
RECIPE IDEA
-----------
Name: Strawberry Vanilla Protein Oats
Category: breakfast          ← breakfast | main | preworkout | dessert
Cooking method: No cook
Time: 4 min
Portions: 1                  ← how many servings this makes

Ingredients (per portion):
- Rolled oats         50g
- Whey protein        1 scoop
- Skimmed milk        60mL
- Greek yogurt 0%     50g
- Strawberries        80g
- Honey               5g

Macros (per portion — if you have them):
Cal: 390  Protein: 38g  Carbs: 48g  Fat: 5g

Notes / tips (optional):
Great cold as overnight oats. Add strawberries fresh.
```

That's it. I do the rest.

---

## What I Check & Do Automatically

### Step 1 — Ingredient Check Against ING_FLAT
For every ingredient in your recipe:
- Search `ING_FLAT` in `index.html` by name match
- If found → use existing `ingId`, confirm macros match
- If NOT found → assign next available `ingId`, research macros
  (USDA / manufacturer label / standard food database)
- Add new ingredient to `ING_FLAT` with full entry:
  ```js
  {id:300, name:"Strawberries", cat:"Fruits", kcal:32, p:0.7, c:7.7, f:0.3}
  // unitG only needed for whole-unit items (eggs, biscuits, cans, etc.)
  ```

### Step 2 — INGREDIENT_MACROS Entry
Add a `"recipeId_key": {kcal, p, c, f}` entry for every batchItem key
so per-ingredient macro rows display correctly in the recipe card.

### Step 3 — Build batchItems
Convert your ingredients into the batchItems format with correct:
- `key` (unique: `recipeId_shortname`)
- `cat` (must be a valid category — see table below)
- `role` + `share` OR `role: "fixed"` + `baseQty`
- `ingId` linked to ING_FLAT

### Step 4 — Insert Recipe
Add to `index.html` in the right category block with the next
available `bf` / `mf` / `pre` / `d` ID.

### Step 5 — Commit
Single commit with message describing what was added.

---

## Valid Categories (`cat` field)

| cat value    | Use for                                      | Icon |
|--------------|----------------------------------------------|------|
| `Protein`    | Meat, fish, eggs, protein powder, turkey     | 🥩   |
| `Carbs`      | Rice, oats, bread, pasta, fruit, biscuits    | 🌾   |
| `Dairy`      | Milk, yogurt, cheese, cottage cheese         | 🧀   |
| `Vegetables` | All veg — tomato, spinach, broccoli          | 🥦   |
| `Fruits`     | Banana, berries, mango, apple                | 🍓   |
| `Aromatics`  | Garlic, onion, spices, cinnamon, herbs       | 🧄   |
| `Sauces`     | Oil drizzles, soy sauce, condiments, cocoa   | 🍶   |
| `Liquids`    | Water, broth, almond milk, espresso          | 💧   |
| `Fats`       | Olive oil, butter, peanut butter, nuts       | 🫒   |

> ⚠️ Never use: `"Snacks"`, `"Spices"`, `"Supplements"`, `"Fat"` (singular),
> or any other value — they are silently ignored by the display engine.

---

## Valid Roles (`role` field)

| role      | When to use                                              | Companion field |
|-----------|----------------------------------------------------------|-----------------|
| `protein` | Main protein source (meat, whey, eggs, yogurt)           | `share: 0.0–1.0` |
| `carbs`   | Main carb source (oats, rice, bread, fruit)              | `share: 0.0–1.0` |
| `fat`     | Main fat source (oil, cheese, chocolate, nut butter)     | `share: 0.0–1.0` |
| `veg`     | Vegetables (constant qty regardless of scaling)          | `baseQty: Xg`   |
| `fixed`   | Spices, water, condiments — constant qty                 | `baseQty: Xg`   |

**Share values:** fraction of that macro role's total budget this ingredient covers.
Must sum to ~1.0 across all items sharing the same role in a recipe.
Example: if whey covers 80% of protein and yogurt covers 20% → `share: 0.818` and `share: 0.182`.

---

## Valid Units (`unit` field)

| unit     | Use for                                      |
|----------|----------------------------------------------|
| `"g"`    | All gram-measured items (oats, meat, veg)    |
| `"mL"`   | All liquid items (milk, water, oil)          |
| `"whole"`| Items sold/used as whole units (eggs, cans, full bagels) — requires `unitG` in ING_FLAT |

> ⚠️ Never use: `"pc"`, `"piece"`, `"scoop"`, `"tbsp"`, `"tsp"`, or any other string.
> Use `"g"` with the gram equivalent instead (e.g. 1 scoop = 30g → `qty: 30, unit: "g"`).

---

## Recipe ID Naming

| Category    | Format  | Current next available |
|-------------|---------|------------------------|
| Breakfast   | `bf16`  | bf16                   |
| Main (lunch/dinner) | `m##` | check index.html |
| Pre-workout | `pre##` | check index.html       |
| Dessert     | `d##`   | check index.html       |

---

## Badge Values

| badge value     | Meaning                              |
|-----------------|--------------------------------------|
| `"🍳 Stovetop"` | Cooked on hob / pan                  |
| `"🍳 NC"`       | No-cook (oats, smoothies, assembly)  |
| `"❄️ No Cook"`  | No-cook (yogurt bowls, cold prep)    |
| `"🌬️ Oven"`    | Oven-baked                           |
| `"🥘 Crockpot"` | Slow cooker                          |

---

## Common Ingredient IDs (Quick Reference)

| ingId | Ingredient                    |
|-------|-------------------------------|
| 40    | Eggs (large, whole)           |
| 41    | Egg whites                    |
| 42    | Cottage cheese (fat-free)     |
| 43    | Cottage cheese (low-fat)      |
| 47    | Greek yogurt 0% fat           |
| 48    | Greek yogurt (full fat)       |
| 49    | Milk (whole, 3.5%)            |
| 50    | Milk (skim / 0%)              |
| 60    | Jasmine rice (uncooked)       |
| 64    | Oats (rolled, dry)            |
| 71    | Wholegrain bread (slice)      |
| 80    | Oat flour                     |
| 110   | Cherry tomatoes               |
| 117   | Carrot                        |
| 140   | Banana                        |
| 143   | Blueberries                   |
| 153   | Mixed berries (frozen)        |
| 160   | Cooking oil                   |
| 162   | Salted butter                 |
| 166   | Peanut butter                 |
| 167   | Almond butter                 |
| 169   | Chia seeds                    |
| 210   | Whey protein powder (30g/scoop) |
| 220   | Cinnamon (ground)             |
| 254   | Cocoa powder                  |
| 255   | Dark chocolate (for drizzle)  |
| 293   | Everything bagel (whole grain)|
| 294   | Pepper jack cheese (slices)   |
| 298   | Dark chocolate 72% (Godiva)   |
| 299   | Lotus Biscoff biscuit (7.5g)  |

> Full list: search `ING_FLAT` in `index.html` — 299 entries as of last update.

---

## For New Ingredients — What to Tell Me

If your recipe uses an ingredient not in the list above, just name it naturally.
I'll look it up. If I can't find reliable macros, I'll ask you for:

```
New ingredient needed:
- Name: [as it appears on the product label]
- Brand (if specific): [e.g. Godiva, Baladna, ON]
- Serving size / unit weight: [e.g. 1 biscuit = 7.5g]
- Per 100g macros: kcal, protein, carbs, fat
```

If you have the nutrition label photo or product URL, even better — paste it in.

---

## Full batchItem Template (copy & expand)

```js
{
    id: "bf16", category: "breakfast",
    name: "🥣 Recipe Name Here", subtitle: "No cook · 4 min",
    badge: "🍳 NC", carb: "🌾 Oats", portions: 1,
    perPortion: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    batchItems: [
        { key: "bf16_oats",  label: "Rolled oats",             qty: 50,  unit: "g",  cat: "Carbs",    ingId: 64,  role: "carbs",   share: 0.8   },
        { key: "bf16_whey",  label: "Whey protein (1 scoop)",  qty: 30,  unit: "g",  cat: "Protein",  ingId: 210, role: "protein", share: 0.8   },
        { key: "bf16_milk",  label: "Skimmed milk",            qty: 60,  unit: "mL", cat: "Dairy",    ingId: 50,  role: "fixed",   baseQty: 60  },
        { key: "bf16_yog",   label: "Greek yogurt 0%",         qty: 50,  unit: "g",  cat: "Dairy",    ingId: 47,  role: "protein", share: 0.2   },
        { key: "bf16_XXX",   label: "New ingredient",          qty: 0,   unit: "g",  cat: "Fruits",   ingId: 300, role: "carbs",   share: 0.2   },
        { key: "bf16_cinn",  label: "Cinnamon",                qty: 2,   unit: "g",  cat: "Aromatics",ingId: 220, role: "fixed",   baseQty: 2   },
    ],
    steps: [
        "Step 1.",
        "Step 2.",
        "Step 3.",
    ],
    note: "One-line tip or meal prep note.",
},
```

---

*Last updated: 2026-05-31 — 15 breakfast recipes (bf1–bf15), 299 ingredients in ING_FLAT*
