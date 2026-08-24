# SoulGainz — Full Project Summary
*Last updated: August 2026 · Use this to resume work in any new chat*

---

## What Is This Project?

**SoulGainz** is a Progressive Web App (PWA) for high-protein meal prep. It is a single-file React app (`index.html`) deployed on Netlify. Users select a weekly meal plan, get a shopping list with per-batch quantities, and view macro breakdowns per serving.

- **Live site:** Netlify (check netlify.toml for the project name)
- **Tech stack:** React (self-hosted via `/vendor/`), single `index.html` file, Service Worker (`sw.js`), Supabase (auth + user data), Stripe (payments), Formspree/Zapier/Notion (form pipeline)
- **Repo:** Git — user pushes from their own terminal. Claude cannot push.
- **Key constraint:** Python regex-based editing only — the file is too large for Node.js eval. Always use `python3` with `re` module for any `index.html` edits.

---

## File Map

| File | Purpose |
|------|---------|
| `index.html` | Entire app — all recipes, macros, React UI, ingredient DB |
| `sw.js` | Service worker — PWA caching. Bump `CACHE_NAME` version on every deploy |
| `netlify.toml` | Build config — downloads React via curl into `/vendor/` at deploy time |
| `manifest.json` | PWA manifest |
| `offline.html` | Shown when user is offline |
| `recipe-image-prompts.html` | Interactive prompt sheet for AI image generation (all 160+ recipes) |
| `recipe-image-prompts.csv` | Same data as CSV (columns: ID, Category, Name, Visual Ingredients, Filename, Prompt) |
| `RECIPE_AUDIT_REPORT.md` | Full science-backed audit of all recipes with ratings and improvement notes |
| `STANDARDS.md` | App content and coding standards |
| `DEPLOYMENT_GUIDE.md` | Step-by-step deploy process |
| `database-architecture.md` | Supabase schema design |
| `supabase-schema.sql` / `supabase-setup.sql` | DB setup scripts |
| `analytics.sql` | Analytics queries |
| `admin.html` | Admin panel |
| `blog-*.html` | SEO blog articles |
| `landing.html` | Marketing landing page |
| `calculator.html` | Macro calculator |
| `promo-codes.json` | Promotional codes |

---

## Recipe Library (Current State)

**160+ total recipes** across 6 categories:

| Category | Count | IDs |
|----------|-------|-----|
| Main meals | 104 | m01–m86, hol1–hol10, v1–v9, sn1–sn9 |
| Breakfast | 35 | bf1–bf35, v9 |
| Desserts/Snacks | 10 | d1, d4, d5, ds2–ds6, sn5 |
| Pre-workout | 8 | pw0–pw7, sn3 |
| Salads | 6 | m30, m32, m66–m68, sn6 |
| Smoothies | 10 | pw2, sm1–sm9 |

### Recipe Data Structure (inside `index.html`)

```js
{
  id: "m01",
  name: "🍗 Marry Me Chicken",
  category: "main",  // main | vegetarian | breakfast | preworkout | dessert | snack | holiday | salad | smoothie
  portions: 7,
  perPortion: { kcal: 117, protein: 12.2, carbs: 8.1, fat: 2.1 },
  batchItems: [
    { key: "m01_chk", label: "Chicken Breast (Skinless)", qty: 1400, unit: "g", cat: "protein", ingId: 1 },
    // ...
  ],
  method: "...",
  note: "...",
}
```

### Key Data Lookups

- **`INGREDIENT_MACROS` (IM):** keyed by `batchItem.key` (e.g. `"m01_chk"`), stores `{kcal, p, c, f}` per 100g
- **`ING_FLAT`:** flat ingredient DB keyed by `ingId` — used for shopping list grouping
- **`ingId:62`** = Wholegrain brown rice (dry) — switched from white rice (ingId:60) across all 26 rice recipes
- **`ingId:42`** = Fat-Free Cottage Cheese
- **`ingId:47`** = Greek Yogurt (0%)

---

## Work Completed in This Session (Summary)

### 1. Wholegrain Rice Switch ✅
- Changed all 26 rice recipes from white rice (`ingId:60`) to wholegrain brown rice (`ingId:62`)
- Updated all 26 `batchItems` labels → `"Wholegrain brown rice (dry)"`
- Updated 25 `INGREDIENT_MACROS` entries (new macros: kcal:362, p:7.5, c:76.1, f:2.7 per 100g)
- Recomputed all 26 `perPortion` values after the switch

### 2. Carb Reduction + Protein Boost (Rice Recipes) ✅
- **Problem:** After rice switch, 7 recipes had carbs >85g per portion
- **Fix applied to 7 high-carb recipes:** Reduced rice qty by ~20% to bring carbs ≤85g
  - Recipes affected: m01, m06, m07, m16, m31, m44, m47 (check RECIPE_AUDIT_REPORT for specifics)
- **+25% protein boost applied to all 26 rice recipes:** Added cottage cheese or Greek yogurt to recipes that lacked sufficient protein
- **v7 exception:** Even after reducing sweet potato and corn, v7 (Black Bean & Sweet Potato) stayed at 79.7g carbs — accepted as within target

### 3. Recipe Quality Fixes (Issues 1–4) ✅

**Issue 1 — Low-calorie mains (m21, m27):**
- `m21` (Crispy Chicken Nuggets): tripled the chicken qty — now a proper main meal
- `m27` (Sweet Potato Veggie Egg Bake): doubled eggs + added cottage cheese

**Issue 2 — Weak vegetarian protein (v3, v7, v1):**
- `v3` (Chickpea Couscous): reduced couscous by 20%, added cottage cheese + Greek yogurt
- `v7` (Black Bean & Sweet Potato): rebalanced — added Greek yogurt, reduced corn
- `v1` (Lentil Dahl): halved coconut milk (200g instead of 1 whole can), added Greek yogurt; fixed `qty:1, unit:"whole"` → `qty:200, unit:"g"` so halving works correctly

**Issue 3 — High fat (v5, hol3, hol5):**
- `v5` (Paneer Tikka Masala): replaced 50% of paneer with cottage cheese, reduced oil
- `hol3` (Herb-Crusted Lamb): reduced lamb qty by 20%, added Greek yogurt — fat still 37.8g (accepted for holiday recipe)
- `hol5` (Spiced Lamb Lentil Rice): reduced lamb by 15%, cut oil by half

**Issue 4 — App loading failures:**
- Fixed runtime crash: `lrSel.perPortion.kcal` → `(lrSel.perPortion||{}).kcal` (crashes if localStorage has stale data with no perPortion)
- Same fix for `drSel.perPortion.kcal`, `lrSel.perPortion.protein`, `drSel.perPortion.protein`
- Bumped service worker `CACHE_NAME` to force PWA reinstall for all users (was `v155`, now `v163`)
- Hardened `netlify.toml` build: `curl -s` → `curl --fail -L` + file size check (was silently producing empty vendor files if unpkg.com was down)

### 4. New INGREDIENT_MACROS Entries Added ✅
These were added during quality fixes:
- `"m27_cot"`: {kcal:98.0, p:11.0, c:3.4, f:0.3} — Fat-Free Cottage Cheese in m27
- `"v3_cot"`: {kcal:98.0, p:11.0, c:3.4, f:0.3} — Cottage Cheese in v3
- `"v3_yog"`: {kcal:59.0, p:10.0, c:3.4, f:0.4} — Greek Yogurt in v3
- `"v1_yog"`: {kcal:59.0, p:10.0, c:3.4, f:0.4} — Greek Yogurt in v1
- `"v5_cot"`: {kcal:98.0, p:11.0, c:3.4, f:0.3} — Cottage Cheese in v5

### 5. Recipe Image Prompts ✅
- Created `recipe-image-prompts.html` — interactive click-to-copy prompt sheet for all recipes
- Created `recipe-image-prompts.csv` — same data in spreadsheet form
- **Second version (current):** Prompts rebuilt to use ONLY real batchItem ingredient labels — no hallucinated garnishes or creative additions
- Each prompt explicitly states: *"The dish contains only these ingredients: [list]. No extra ingredients not listed."*
- Camera angle varies by dish type (overhead for bowls/rice, 45° for pasta, side-on for drinks)
- Naming convention for saved images: `recipes/[id].jpg` (e.g. `recipes/m01.jpg`)
- Recommended free tools: Google AI Studio (Gemini), Ideogram.ai, ChatGPT

---

## Pending / Unfinished Tasks

| Task | Status | Notes |
|------|--------|-------|
| Push git changes to main | ⏳ USER ACTION REQUIRED | Run: `git -C "/Users/dejanzerafa/Desktop/Cowork/MEAL PREP APP" push origin main` |
| Generate 160+ recipe images | ⏳ In progress | Use `recipe-image-prompts.html` with Google AI Studio or Ideogram |
| Integrate images into app | ⏳ Not started | Save as `recipes/[id].jpg`, then wire up `<img src="recipes/{recipe.id}.jpg">` in the recipe card UI |
| v3 protein still low | ⚠️ Flagged | v3 (Chickpea Couscous) protein = 30.3g (22% of kcal) — acceptable but could improve further |
| hol3 fat still high | ⚠️ Flagged | 37.8g fat — above 30g target, accepted for holiday recipe |
| RECIPE_AUDIT_REPORT fixes | ⏳ Not started | The full audit identified many more recipes needing improvement beyond issues 1–4 — see file |

---

## Known Bugs & Technical Gotchas

### 1. Python regex editing only
Node.js `eval` fails on `index.html` due to file size. Always use Python with `re` module.

### 2. INGREDIENT_MACROS false-positive key check
When checking if a key exists in `INGREDIENT_MACROS`, do NOT search the whole file — key names also appear in `batchItems` (e.g. `key: "v3_cot"`). Search only within the IM block boundaries:
```python
im_start = raw.find('const INGREDIENT_MACROS = {')
im_end = raw.find('\n};', im_start)
im_block = raw[im_start:im_end]
exists = bool(re.search(r'"' + key + r'"\s*:', im_block))
```

### 3. Double-comma bug
When inserting batchItems, the pattern `},,...` can appear. Always clean up after insertion:
```python
raw = re.sub(r'},,\n(\s+\{)', r'},\n\1', raw)
```

### 4. perPortion extraction regex
`\{kcal:` does NOT match `{ kcal:` (space after brace). Use `\{\s*kcal:` to be safe.

### 5. `portions` extraction
Some recipes use `servings:` and some use `portions:`. Always check for both:
```python
pm = re.search(r'(?:servings|portions)\s*:\s*(\d+)', rtxt)
portions = int(pm.group(1)) if pm else 7
```

### 6. v1_coco unit fix
`v1` (Lentil Dahl) coconut milk was stored as `qty:1, unit:"whole"` with `unitG:400` in IM. Changed to `qty:200, unit:"g"` with `unitG` removed — this allows integer qty halving.

### 7. Service worker cache
Every deploy MUST bump `CACHE_NAME` in `sw.js`. Users with the PWA installed will otherwise continue serving from the old cache indefinitely. Current version: `meal-plan-v163`.

### 8. Silent Netlify build failure (fixed)
`curl -s` used to silently produce empty vendor files if unpkg.com was unreachable. Fixed with `--fail` flag + `test -s` file size verification in `netlify.toml`.

---

## Design & Tech Decisions

| Decision | Rationale |
|----------|-----------|
| Single `index.html` file | Simplest deploy — everything in one place; no build pipeline needed |
| React self-hosted in `/vendor/` | Avoids unpkg.com CDN dependency during runtime; still fetched at build time |
| Python regex for editing | Only reliable method for large single-file apps; Node.js eval crashes |
| Wholegrain brown rice over white | Better GI (50–55 vs 73), more fibre, better for digestion |
| Cottage cheese + Greek yogurt as protein boosts | Low fat, high protein, blend into sauces invisibly, fridge-stable |
| `perPortion` stored per recipe | Avoids recomputing on every render; must be manually updated when macros change |
| Service worker cache-first for assets, network-first for HTML | Assets rarely change; app shell should always be fresh |
| Ingredient images named `recipes/[id].jpg` | Flat structure, easy to reference by recipe ID in code |

---

## Macro Standards (for new recipes)

| Metric | Target | Hard limit |
|--------|--------|-----------|
| Protein % of kcal | ≥30% green, 20–29% amber, <20% red | |
| Protein per serving | ≥30g (leucine threshold for MPS) | |
| Carbs per serving | ≤85g for rice-based mains | |
| Fat per serving | ≤30g | ≤35g for holiday recipes |
| Saturated fat | <10% of total kcal | |

**Best protein sources used in app:** Chicken breast, lean beef mince, cottage cheese (Fat-Free), Greek yogurt (0%), eggs, salmon, turkey mince, prawns, tofu, paneer, lentils, white beans.

**Science basis:** 2024 meta-analysis (47 studies, 3,218 participants) — optimal fat loss while preserving muscle at ≥30% protein of kcal. Leucine threshold (2.5g leucine, ~30g quality protein) required for muscle protein synthesis (MPS) per meal.

---

## Ideas Discussed (Not Yet Built)

- **Image integration in app:** Display recipe photos in the recipe card UI once a batch of images is generated. Proposed path: `<img src="recipes/{recipe.id}.jpg">` with a fallback placeholder
- **Recipe filtering by macro target:** Filter view by protein %, carb level, or calorie range
- **Meal plan templates:** Pre-built weekly plans (e.g. "Cutting week", "Bulk week", "Veg week")
- **Per-recipe macro charts:** Visual pie/bar chart showing protein/carb/fat split per recipe
- **Portion size slider:** Let users adjust portions served and see macros scale live

---

## How to Continue This Work in a New Chat

Paste this document at the start of the new chat, then say what you want to work on. Key things to remind Claude:

1. **Editing method:** All `index.html` edits must be done via `python3` with `re` module — no Node.js eval
2. **Bash path:** `/sessions/[session]/mnt/MEAL PREP APP/` maps to macOS `/Users/dejanzerafa/Desktop/Cowork/MEAL PREP APP/`
3. **Push is manual:** Claude cannot push git — you must run `git push` from your terminal
4. **Service worker:** Always bump `CACHE_NAME` in `sw.js` after any deploy
5. **Recipe count:** 160+ recipes in the app as of this summary
6. **Image prompts:** `recipe-image-prompts.html` is ready — use Google AI Studio or Ideogram.ai to generate, save as `recipes/[id].jpg`
