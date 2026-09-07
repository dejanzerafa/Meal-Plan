# Pre-build check — 195 approved recipes (2026-09-07)

Your decisions: 147 add · 42 add alongside ours · 6 replace ours · 43 keep ours · 24 skip.
Nothing is built yet. Three things need your call before I build.

---

## 1. Duplicates inside the approved batch

You compared each candidate to the *library*, but several candidates duplicate *each other*. Building both would put two near-identical recipes in the app. My recommendation in bold; say otherwise and I'll follow it.

| Group | Candidates | Recommendation |
|---|---|---|
| Chocolate mug cake | cb204 Chocolate Protein Mug Cake · cb196 Protein-Packed Chocolate Mug Cake | **Build cb204 only** (71 % same ingredients) |
| Mango turmeric smoothie | cb46 · cb239 Mango Turmeric Glow | **Build cb46 only** |
| Savory cottage cheese bowl | cb103 · cb174 — identical title, different toppings | **Build cb103**, rename cb174 "Cottage Cheese Bowl with Tomato & Cucumber" if you want both |
| Almond-butter overnight oats | cb19 Almond Butter · cb56 Banana Almond Butter · cb49 Peanut Butter Banana | **Build cb56 and cb49**; cb19 is cb56 without the banana |
| Strawberry cottage cheese | cb182 Bowl · cb48 Toast (80 % same) | **Build both** — different formats |
| Pineapple-ginger smoothie | cb256 Detox · cb220 Refresh | **Build cb220 only** |
| Strawberry-peach smoothie | cb219 Silk · cb259 Antioxidant | **Build cb219 only** |
| Tropical smoothies | cb260 Mango Pineapple · cb246 Pineapple Spinach · cb252 Mango Spinach | **Build cb252 only** (covers both) |
| Strawberry smoothies | cb250 Kiwi · cb243 Banana · cb267 Berry Banana | **Build cb250 and cb267**; cb243 is a subset of cb267 |
| Lentil shepherd's pie | cb130 Lentil & Sweet Potato · cb161 Lentil | **Build cb130 only** |
| Chia puddings | cb22 Coconut · cb215 Mango Coconut · cb186 Coconut & Blueberries · cb61 Peach | **Build cb215 and cb61**; cb22/cb186 are the plain base |
| Tuna-avocado cups | cb211 Mini Tuna Avocado Cups · cb188 Avocado Tuna Salad Cups | **Build cb188 only** |
| Thai peanut chicken | cb128 Rice Bowl · cb71 Bowl (+ ours sn6) | **Build cb128 only** |
| Blueberry smoothies | cb237 Lavender · cb262 Lemon | Build both — distinct flavours |

Net effect if you take every recommendation: **−13 → 182 recipes**.

## 2. The smoothies and juices

51 of the approved recipes are smoothies or juices from the cookbook. As written they average **4 g protein** ("Green Apple Celery Detox Juice" is 1 g). The app's existing smoothies are 40–70 g. Options:

- **A.** Build as written — honest to the book, but they will sit at the bottom of every protein sort and the app's audit will flag all 51.
- **B.** Build each with **30 g whey protein added** (vanilla, or chocolate where it fits) and a note that it's our addition — turns them into 25–35 g post-workout drinks. Macros computed accordingly.
- **C.** Build the juices as written in a new "Hydration" sub-label and add whey only to the smoothies.

I recommend **B** — it is what your users buy the app for.

## 3. New ingredient rows (rule 4)

1,215 ingredient lines parsed; 1,114 costed against the existing 337-row registry; the rest are garnishes/salt (zero-energy) or the 8 fragments below. **41 ingredients have no registry row** and need one. Values below are from USDA FoodData Central unless stated; approve the list or query any line.

| id | Ingredient | kcal / P / C / F per 100 g | Source |
|---|---|---|---|
| 371 | Turkey breakfast sausage (raw) | 155 / 16.6 / 1.5 / 9.3 | USDA |
| 372 | Chorizo (cured) | 455 / 24.1 / 1.9 / 38.3 | USDA |
| 373 | Arborio rice (dry) | 355 / 6.9 / 78 / 0.6 | manufacturer |
| 374 | Chicken stock (ready-to-use) | 5 / 0.6 / 0.5 / 0.1 | USDA |
| 375 | Single cream 18 % | 193 / 2.6 / 3.9 / 19 | McCance & Widdowson |
| 376 | Cayenne pepper | 318 / 12 / 57 / 17 | USDA |
| 377 | Chili powder (blend) | 282 / 13.5 / 50 / 14.3 | USDA |
| 378 | Pecans | 691 / 9.2 / 13.9 / 72 | USDA |
| 379 | Hemp seeds (hulled) | 553 / 31.6 / 8.7 / 48.8 | USDA |
| 380 | Goat cheese (soft) | 264 / 18.5 / 0 / 21.1 | USDA |
| 381 | Halloumi | 321 / 22 / 2.2 / 25 | McCance & Widdowson |
| 382 | Coconut yogurt (plain) | 140 / 1.2 / 9.5 / 10.5 | manufacturer |
| 383 | Poppy seeds | 525 / 18 / 28.1 / 41.6 | USDA |
| 384 | Basil pesto | 418 / 4.2 / 6.1 / 42 | USDA |
| 385 | Salsa (jarred) | 36 / 1.5 / 7 / 0.2 | USDA |
| 386 | Farro (dry) | 340 / 12.7 / 71 / 2 | USDA |
| 387 | Pearl barley (dry) | 352 / 9.9 / 77.7 / 1.2 | USDA |
| 388 | Millet (dry) | 378 / 11 / 72.9 / 4.2 | USDA |
| 389 | Wild rice (dry) | 357 / 14.7 / 74.9 / 1.1 | USDA |
| 390 | Chickpea pasta (dry) | 340 / 20 / 57 / 4 | manufacturer (Banza) |
| 391 | Applesauce (unsweetened) | 42 / 0.2 / 11.3 / 0.1 | USDA |
| 392 | Grapes | 69 / 0.7 / 18.1 / 0.2 | USDA |
| 393 | Melon (honeydew / cantaloupe) | 35 / 0.7 / 8.6 / 0.2 | USDA |
| 394 | Snap / snow peas | 42 / 2.8 / 7.5 / 0.2 | USDA |
| 395 | Garden peas (frozen) | 77 / 5.2 / 13.6 / 0.4 | USDA |
| 396 | Mixed salad leaves | 20 / 1.8 / 3.2 / 0.3 | USDA |
| 397 | Red cabbage | 31 / 1.4 / 7.4 / 0.2 | USDA |
| 399 | Coconut cream | 330 / 3.6 / 6.7 / 34.7 | USDA |
| 400 | Oat milk (unsweetened) | 43 / 1 / 6.6 / 1.3 | manufacturer |
| 401 | Soy milk (unsweetened) | 33 / 3.3 / 0.8 / 1.8 | USDA |
| 402 | Nutritional yeast | 325 / 50 / 36 / 5 | manufacturer |
| 403 | Cardamom (ground) | 311 / 10.8 / 68.5 / 6.7 | USDA |
| 404 | Dried lavender (culinary) | 49 / 0 / 12 / 0 | manufacturer; ¼ tsp amounts |
| 405 | Cacao nibs | 464 / 14 / 33 / 43 | USDA |
| 406 | Dried cranberries (sweetened) | 308 / 0.2 / 82.8 / 1.1 | USDA |
| 407 | Ground chicken (lean, raw) | 143 / 17.4 / 0 / 8.1 | USDA |
| 408 | Lemon zest | 47 / 1.5 / 16 / 0.3 | USDA |
| 409 | Croutons (plain) | 407 / 11.9 / 73.5 / 6.6 | USDA |
| 410 | Orange juice (fresh) | 45 / 0.7 / 10.4 / 0.2 | USDA |
| 411 | Ice / water | 0 | — |

Mapping assumptions you should know (say if you want different defaults):
- "protein powder" / "chocolate protein" → **whey** (id 210) unless the recipe says plant-based.
- "cheese" / "shredded cheese" → **reduced-fat cheddar**; "cream" → single cream 18 %.
- "cooked quinoa / cooked rice" → the cooked-weight rows; dry grains → dry rows.
- US cups → grams per ingredient (a cup of oats 80 g, yogurt 245 g, spinach 30 g …); "1 avocado" 150 g, "1 egg" 60 g, "1 chicken breast" 170 g, "1 salmon fillet" 150 g. Every quantity in the app will be g or ml.
- Salt, pepper, "to taste" → not costed (zero energy), still listed.

Eight lines I could not parse and will drop as garnish unless you object: "for dairy-free)" (cb126), "hollow bee farm" (cb27 — brand name), "assorted fruit slices" (cb206), and five "for garnish" lines.

## 4. Old recipes

Every one of the 227 existing recipes was recomputed from its ingredient rows by `scripts/check-ingredients.mjs`: all reconcile with their stated macros. No discrepancies. (The audit's *nutritional* observations — low-veg mains, 800 kcal bulk portions — are unchanged and not applied without you.)

## What happens after you answer

Build every approved recipe per portion in metric, computed macros, allergens detected, methods converted to °C/grams, tips written per recipe, stage all into pending. Then a full guard run and a build report listing each recipe's final macros next to the source claim.
