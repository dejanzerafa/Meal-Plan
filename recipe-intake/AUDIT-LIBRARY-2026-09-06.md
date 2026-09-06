# Recipe audit — every recipe, macros and construction

Date: 2026-09-06 · 227 recipes in the app (161 live, 56 staged, 10 SoulFood occasion) plus the 262 candidates reviewed this week.

**Macros are verified, not just read.** `scripts/check-ingredients.mjs` recomputes every live and staged recipe from its ingredient weights against the registry and fails the build on any disagreement — it passes today, so no recipe's stated calories or macros contradict its own ingredients. This audit therefore asks the next question: are the numbers *right for the person eating them*.

## Standards

- Protein per meal: mains ≥ 30 g (≈0.4 g/kg dose, leucine threshold); breakfast ≥ 25 g; 'protein' desserts ≥ 10 g; pre-workout carb-led by design (15–25 g protein optional).
- Energy: mains 330–800 kcal (above 800 is a bulk portion and should be marked as such); breakfast ≤ 750; desserts ≤ 400.
- Fat: ≤ 35 g or ≤ 45 % of energy in a main; ≤ 12 g pre-workout.
- Vegetables: ≥ 50 g in a main. The app has no fibre field, so vegetable weight in the box is the proxy (target: two portions a day from mains).
- Construction: ≥ 3 steps, a storage/reheat tip, ≥ 250 g plate weight for mains. Allergens are computed at runtime by `detectAllergens`, so they are not stored on the recipe and were not audited here.

## Summary

| Category | n | Median kcal | Median P | Median veg g | Nutrition flags | Tip missing |
|---|---|---|---|---|---|---|
| main | 147 | 571 | 52 | 100 | 40 | 47 |
| salad | 6 | 464 | 50 | 114 | 1 | 1 |
| breakfast | 42 | 526 | 47 | 0 | 6 | 15 |
| preworkout | 8 | 303 | 11 | 0 | 0 | 6 |
| dessert | 14 | 247 | 16 | 0 | 3 | 10 |
| smoothie | 10 | 491 | 40 | 0 | 0 | 10 |

**50 of 227 recipes have a nutrition flag; 89 have no storage/reheat tip.** Flag counts: tip 89, veg 25, energy 19, protein 12, density 3, portion 2, fat 2.

### What the numbers say as a coach

1. **Protein is the library's strength.** Median main is 53 g, median breakfast 50 g. Only 12 recipes fall under their protein target and most are desserts, pre-workouts (carb-led on purpose) or the two light salads.
2. **Vegetables are the weakness.** 25 mains carry fewer than 50 g of vegetables in the box. For fat-loss users that is the single biggest lever: adding 100–150 g of green veg to those boxes raises satiety and fibre for ~30 kcal. This is the improvement I'd make across the board rather than any macro change.
3. **A cluster of 800+ kcal mains** (Marry Me Chicken, Chipotle bowls, KFC Mac, Honey Soy bowl, Thai Basil Beef …) are excellent bulk meals but oversized for someone on 1,800 kcal. They don't need changing — the app scales portions to the user's targets — but they should carry a 'training-day / bulk' marker so a cutting user picks them knowingly.
4. **Fat is well controlled**: only 2 recipes exceed the fat limit, all salmon/avocado dishes where the fat is the point.
5. **Construction**: 89 recipes have no 💡 storage/reheat line. Every recipe added since August has one; the older library doesn't. Worth a batch pass — it is the most-asked question in meal prep.

## Every flagged recipe, with the fix

### Main — 40 of 147

| Recipe | kcal · P · C · F | Veg g | Flag → fix |
|---|---|---|---|
| hol5 🌙 Spiced Lamb & Lentil Rice (Mujadara-Style) *(staged)* | 697 · 36.1P · 82.5C · 25.1F | 0 | **veg**: 0 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much<br>**density**: 5.2 g protein per 100 kcal — low for a fat-loss main (target ≥ 7) |
| m06 🍗 Honey Chipotle Chicken Bowl | 812 · 89P · 82.3C · 13F | 80 | **energy**: 812 kcal — a third of a 2,400 kcal day in one box; fine for a bulk, mark it or trim the carb/cheese by ~112 kcal for the fat-loss user |
| m07 🍗 Chipotle Chicken Bowl | 828 · 88.8P · 82.4C · 15F | 53 | **energy**: 828 kcal — a third of a 2,400 kcal day in one box; fine for a bulk, mark it or trim the carb/cheese by ~128 kcal for the fat-loss user |
| m100 🌮 Chicken Burrito Bowl *(staged)* | 426 · 40.1P · 53.5C · 5F | 30 | **veg**: 30 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m102 🧀 Buffalo Chicken Mac & Cheese *(staged)* | 506 · 53.5P · 60.3C · 4.7F | 0 | **veg**: 0 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m103 🍝 Creamy Pesto Pasta *(staged)* | 376 · 27.1P · 52.1C · 6.4F | 15 | **protein**: 27.1 g protein — under the ~30 g per-meal dose that maximises muscle protein synthesis (≈0.4 g/kg); add ~50 g lean protein<br>**veg**: 15 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much<br>**portion**: 169 g plate weight — small; satiety tracks volume |
| m105 🐟 BBQ Salmon with Mango Avocado Salsa *(staged)* | 603 · 33.1P · 60.3C · 25F | 20 | **veg**: 20 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much<br>**density**: 5.5 g protein per 100 kcal — low for a fat-loss main (target ≥ 7) |
| m106 🥟 Creamy Chicken & Gnocchi *(staged)* | 561 · 51.8P · 63.9C · 9.5F | 40 | **veg**: 40 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m107 🥜 Caramelised Beef & Peanut Noodles *(staged)* | 655 · 48.4P · 57C · 27.1F | 15 | **veg**: 15 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m108 🌶️ Crispy Gochujang Chicken *(staged)* | 595 · 47.5P · 72.7C · 10.9F | 12 | **veg**: 12 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m109 🍛 Yellow Curry Meatballs *(staged)* | 638 · 44.2P · 61.3C · 23.4F | 0 | **veg**: 0 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m11 🍗 Green Pepper & Onion Pasta | 736 · 62.3P · 77.6C · 17.9F | 34 | **veg**: 34 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m112 🍅 Chicken Parm with Spicy Honey *(staged)* | 464 · 53P · 35.1C · 12F | 0 | **veg**: 0 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m117 🥩 Balsamic Braised Beef & Butter Bean Mash *(staged)* | 547 · 50P · 46.4C · 18.1F | 0 | **veg**: 0 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m12 🍗 Chicken Bacon Mac | 720 · 63.9P · 80.4C · 13.7F | 43 | **veg**: 43 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m122 🥩 Cottage Cheese Alfredo Steak Rigatoni *(staged)* | 685 · 60.4P · 53C · 23.6F | 0 | **veg**: 0 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m13 🥩 Beef Mince & Rice Bowl | 772 · 67.4P · 79.1C · 20.4F | 43 | **veg**: 43 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m14 🍗 Chicken Alfredo Red Sauce | 809 · 68.3P · 97.2C · 18.1F | 420 | **energy**: 809 kcal — a third of a 2,400 kcal day in one box; fine for a bulk, mark it or trim the carb/cheese by ~109 kcal for the fat-loss user |
| m18 🍗 Chicken with Mustard & Coffee Sauce | 228 · 37.9P · 6.3C · 4.7F | 25 | **energy**: 228 kcal — light for a main; pair with a carb side or bump the carb to 60 g dry<br>**veg**: 25 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m19 🥑 Salmon & Avocado Burrito | 756 · 51.2P · 51.5C · 36.9F | 38 | **fat**: 36.9 g fat (44% of energy) — swap the fattiest item for a leaner cut / halve the oil<br>**veg**: 38 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m20 🍋 Juicy Garlic Lemon Chicken | 308 · 52.5P · 5.6C · 6.8F | 0 | **energy**: 308 kcal — light for a main; pair with a carb side or bump the carb to 60 g dry<br>**veg**: 0 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m21 🍗 Crispy Chicken Nuggets | 316 · 28.7P · 16C · 14.9F | 0 | **protein**: 28.7 g protein — under the ~30 g per-meal dose that maximises muscle protein synthesis (≈0.4 g/kg); add ~50 g lean protein<br>**energy**: 316 kcal — light for a main; pair with a carb side or bump the carb to 60 g dry<br>**veg**: 0 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much<br>**portion**: 191 g plate weight — small; satiety tracks volume |
| m25 🍗 High-Protein KFC Mac & Cheese | 898 · 75.9P · 105.2C · 18.9F | 280 | **energy**: 898 kcal — a third of a 2,400 kcal day in one box; fine for a bulk, mark it or trim the carb/cheese by ~198 kcal for the fat-loss user |
| m27 🥚 Sweet Potato Veggie Egg Bake | 343 · 28.2P · 28C · 13.1F | 125 | **protein**: 28.2 g protein — under the ~30 g per-meal dose that maximises muscle protein synthesis (≈0.4 g/kg); add ~50 g lean protein |
| m28 🥩 Cheeseburger Burritos | 563 · 48.7P · 42.6C · 21.8F | 31 | **veg**: 31 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m36 🐟 Tuna & Chickpea Power Bowl | 225 · 24.4P · 25.7C · 3.4F | 171 | **protein**: 24.4 g protein — under the ~30 g per-meal dose that maximises muscle protein synthesis (≈0.4 g/kg); add ~50 g lean protein<br>**energy**: 225 kcal — light for a main; pair with a carb side or bump the carb to 60 g dry |
| m39 🦃 Ground Turkey Taco Bowl | 821 · 65P · 80.9C · 26F | 121 | **energy**: 821 kcal — a third of a 2,400 kcal day in one box; fine for a bulk, mark it or trim the carb/cheese by ~121 kcal for the fat-loss user |
| m43 🥚 Egg White Frittata & Roasted Potatoes | 318 · 33.5P · 25.4C · 8.6F | 79 | **energy**: 318 kcal — light for a main; pair with a carb side or bump the carb to 60 g dry |
| m49 🦐 Prawn & Avocado Rice Bowl | 635 · 58P · 76.4C · 13.3F | 0 | **veg**: 0 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m62 🐟 Salmon, Avocado & Spinach Bowl | 538 · 46.6P · 10.8C · 33.5F | 160 | **fat**: 33.5 g fat (56% of energy) — swap the fattiest item for a leaner cut / halve the oil |
| m69 🎃 Roasted Pumpkin Power Bowl | 724 · 43.3P · 91.4C · 24F | 40 | **veg**: 40 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much<br>**density**: 6.0 g protein per 100 kcal — low for a fat-loss main (target ≥ 7) |
| m74 🍯 Honey Soy Glazed Chicken Bowl | 816 · 59.3P · 99.9C · 19.6F | 79 | **energy**: 816 kcal — a third of a 2,400 kcal day in one box; fine for a bulk, mark it or trim the carb/cheese by ~116 kcal for the fat-loss user |
| m75 🥩 Spicy Thai Basil Beef Bowl | 805.6 · 67.1P · 84.9C · 21.5F | 100 | **energy**: 805.6 kcal — a third of a 2,400 kcal day in one box; fine for a bulk, mark it or trim the carb/cheese by ~105.60000000000002 kcal for the fat-loss user |
| m82 🥚 Chicken & Egg Toast Stack | 617 · 55.4P · 46.9C · 22.2F | 20 | **veg**: 20 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m86 🥩 High Protein Creamy Beef Pasta | 584 · 60.8P · 55.1C · 13.4F | 30 | **veg**: 30 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| m94 🍚 Crispy Garlic Chicken & Fried Rice *(staged)* | 506 · 40.8P · 56.2C · 11.3F | 10 | **veg**: 10 g vegetables in the box — add 100–150 g green veg (fibre, potassium, volume); doesn't change the macros much |
| sn2 🥟 Steamed Chicken Power Bao | 804 · 65.3P · 79.8C · 26.9F | 80 | **energy**: 804 kcal — a third of a 2,400 kcal day in one box; fine for a bulk, mark it or trim the carb/cheese by ~104 kcal for the fat-loss user |
| sn4 🥒 Zesty Pickle & Veggie Board | 222 · 23.1P · 31.4C · 1.1F | 340 | **protein**: 23.1 g protein — under the ~30 g per-meal dose that maximises muscle protein synthesis (≈0.4 g/kg); add ~50 g lean protein<br>**energy**: 222 kcal — light for a main; pair with a carb side or bump the carb to 60 g dry |
| v11 🥜 Cold Peanut Noodle Slaw *(staged)* | 356 · 21.2P · 53.1C · 9.6F | 100 | **protein**: 21.2 g protein — under the ~30 g per-meal dose that maximises muscle protein synthesis (≈0.4 g/kg); add ~50 g lean protein |
| v3 🌿 Chickpea & Roasted Veggie Couscous | 450 · 28.9P · 72.5C · 5.4F | 272 | **protein**: 28.9 g protein — under the ~30 g per-meal dose that maximises muscle protein synthesis (≈0.4 g/kg); add ~50 g lean protein |

### Salad — 1 of 6

| Recipe | kcal · P · C · F | Veg g | Flag → fix |
|---|---|---|---|
| sn6 🍗 Minced Chicken Thai Herb Salad | 296 · 48.1P · 12C · 5.6F | 190 | **energy**: 296 kcal — light for a main; pair with a carb side or bump the carb to 60 g dry |

### Breakfast — 6 of 42

| Recipe | kcal · P · C · F | Veg g | Flag → fix |
|---|---|---|---|
| bf16 🍌 Banana Egg Caramel Stack | 787 · 64.9P · 81.6C · 22.8F | 0 | **energy**: 787 kcal — very large breakfast; note it as a training-day option |
| bf34 🍌 Banana Bread Baked Oats | 278 · 23P · 39.7C · 3.9F | 0 | **protein**: 23 g protein — breakfast is where most people under-eat protein; target ≥ 25 g (≈ +100 g Greek yogurt or 3 egg whites) |
| bf38 🥕 Carrot Cake Baked Oats *(staged)* | 516 · 23.9P · 71.5C · 16.8F | 70 | **protein**: 23.9 g protein — breakfast is where most people under-eat protein; target ≥ 25 g (≈ +100 g Greek yogurt or 3 egg whites) |
| bf39 🫐 Wild Blueberry Vanilla Kefir Bowl *(staged)* | 383 · 21.6P · 61.7C · 5.7F | 0 | **protein**: 21.6 g protein — breakfast is where most people under-eat protein; target ≥ 25 g (≈ +100 g Greek yogurt or 3 egg whites) |
| bf8 🫙 Greek Yogurt Protein Bowl | 245 · 23.7P · 19.8C · 8.8F | 0 | **protein**: 23.7 g protein — breakfast is where most people under-eat protein; target ≥ 25 g (≈ +100 g Greek yogurt or 3 egg whites) |
| bf9 🥚 High-Protein Breakfast | 852 · 98P · 72C · 17.6F | 150 | **energy**: 852 kcal — very large breakfast; note it as a training-day option |

### Dessert — 3 of 14

| Recipe | kcal · P · C · F | Veg g | Flag → fix |
|---|---|---|---|
| bf3 🥕 Carrot Protein Pancakes | 456 · 52P · 37.6C · 10.4F | 100 | **energy**: 456 kcal — dessert portion; keep ≤ 350 |
| ds7 🍫 Frozen Banana Snickers Bar *(staged)* | 284 · 7.5P · 24.3C · 19.3F | 0 | **protein**: 7.5 g protein — sold as a protein dessert; needs ≥ 10 g (add 15 g whey or 60 g Greek yogurt) or be labelled a treat |
| sn5 🍉 Watermelon Feta & Edamame Bowl | 401 · 35P · 41.1C · 12F | 80 | **energy**: 401 kcal — dessert portion; keep ≤ 350 |

## Recipes with no storage/reheat tip (batch fix)

m40, m37, m04, v3, m31, m21, m43, m35, m46, v4, m52, m53, m56, m57, m59, m62, m25, m20, m44, v1, m41, m19, m34, m24, m27, m47, m36, v9, v5, v7, m42, bf4, bf8, bf10, bf11, bf13, bf14, bf15, d5, ds2, d4, d1, pw2, pw6, pw3, pw5, pw1, sm1, sm2, sm3, sm4, sm5, sm6, sm7, sm8, sm9, sn3, sn4, sn5, sn7, bf17, bf18, bf19, bf22, bf24, bf32, m68, m69, m74, m78, m79, ds3, ds4, sn9, pw7, ds5, ds6, bf34, m109, m113, m120, m122, m123, ds7, hol10, hol3, hol8, hol1, hol7

## This week's candidates (262)

Instagram (12): computed from weights — 4 built, 8 duplicates of existing recipes (see TRIAGE-2026-09-06.md).
Cookbook (250): screened by an ingredient parser (±15 %) — median protein 11 g breakfast / 18 g lunch / 25 g dinner / 8 g snacks / 4 g smoothies. 117 of 250 have calorie claims off by ≥ 25 % from their own ingredients. Only the 3 built (turkey meatballs, stuffed chicken, Tuscan chicken) and ~30 dinners reach 30 g protein, and every one of those needed a bigger portion to get there. Full per-recipe comparison, with keep / replace / both controls, is in REVIEW-2026-09-06.html.
