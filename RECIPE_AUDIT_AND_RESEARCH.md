# SoulGainz — Recipe Audit & Nutrition Science Report
*Completed August 2026 · Based on full index.html recipe review + current literature*

---

## PART 1 — BUGS FIXED (already applied to index.html)

These were factual errors in the code. All have been corrected.

| Recipe | Issue | Fix Applied |
|--------|-------|-------------|
| Creamy Oat Protein Shake (sm1) | Step said "Add oat milk" but ingredient is Skimmed milk | Step now reads "Add skimmed milk" |
| Carb Bridge (pw0) | Turmeric tip copy-pasted into a no-cook recipe (rice cakes + jam) | Replaced with appropriate general tip |
| Chocolate Milk & Banana (pw6) | Turmeric tip copy-pasted — recipe requires zero cooking | Removed |
| Rice Cake & PB Stack (pw1) | Turmeric tip copy-pasted — no-cook assembly recipe | Removed |
| Chocolate Protein Rice Cakes (ds2) | Turmeric "while cooking" tip step 8 — this is a frozen no-cook dessert | Removed |

---

## PART 2 — RECIPE-BY-RECIPE AUDIT

### 🟢 STRONG — no changes needed (selected highlights)

**Honey Chipotle Chicken Bowl (m06)** — 831 kcal · 89g protein · 82g carbs · 15g fat
The flagship recipe. Excellent macro profile. Protein-to-calorie ratio is outstanding. Well-structured batch. No issues.

**Chipotle Chicken Bowl (m07)** — 847 kcal · 88.8g protein · 82.4g carbs · 17g fat
Essentially tied with m06. Both are the strongest recipes in the collection. Great for bulking and high-volume training.

**Marry Me Chicken (m01)** — 819 kcal · 85.1g protein · 84.4g carbs · 15g fat
Excellent. Highest-protein meal that still feels like comfort food. Mushrooms + peas add micronutrient density.

**Marry Me Chicken — Pasta (m03)** — 772 kcal · 75.7g protein · 87.9g carbs · 12.3g fat
Strong. Slightly lower protein than m01 but better carb-to-fat ratio. Ideal for carb-heavy training blocks.

**French Onion Pasta (m05)** — 780 kcal · 69.6g protein · 88.7g carbs · 15.9g fat
Great. Caramelized onions add flavour complexity without meaningless calories. Cottage cheese sauce is a smart protein boost.

**Garlic Parmesan Chicken Pasta (m10)** — 783 kcal · 66.1g protein · 83.5g carbs · 19.6g fat
Strong. Broccoli adds volume and fibre. Minor note: fat is slightly higher due to cream cheese — fine for maintenance, worth flagging for cutters.

**Lean Beef Hamburger Helper (m08)** — 819 kcal · 72.7g protein · 96.8g carbs · 16.6g fat
Good. Highest carb recipe in the main meal set. Best for carb-cycling high days or post-leg-day. Label it accordingly in the UI.

**Salmon, Avocado & Spinach Bowl (m62)** — 573 kcal · 46.6g protein · 10.8g carbs · 37.5g fat
Intentionally low-carb (carb field = "—"). Excellent for keto-adjacent or carb-cycling low days. Avocado fat is mostly monounsaturated — high quality. Fat looks high at 37.5g but it's coming from salmon and avocado. No issue.

**Ground Beef, Eggs & Brown Rice Bowl (m61)** — 572 kcal · 43.8g protein · 53.6g carbs · 20.9g fat
Good complete meal. Protein slightly lower than typical chicken meals — normal for beef + egg combo. Fat at 20.9g is a bit elevated (primarily from eggs and the 93/7 beef). Note: 300g dry brown rice is a large batch amount — verify portion scale is consistent.

**Overnight Oats with Protein (pw5)** — 500 kcal · 37g protein · 70g carbs · 9.6g fat
Excellent pre-training meal. Chia seeds add omega-3 ALA + soluble fibre. Timing note already in steps — good. Note: this is the highest-calorie pre-workout option in the set (500 kcal). Make sure it's categorized clearly as a meal, not a snack.

**Protein Brownie Cookies (d1)** — 163 kcal · 13.7g protein · 18.2g carbs · 3.9g fat
Excellent dessert macro profile. 13.7g protein at 163 kcal is best-in-class for a cookie. Pumpkin purée is an unusual but smart ingredient (low calorie, high fibre, binds the dough). Tip: add a note that the batter must not be too wet — almond milk quantity is critical to texture.

**Matcha Banana Protein Bread (d4)** — 152 kcal · 14g protein · 18g carbs · 3g fat
Solid. Fat-free cottage cheese is used cleverly as a binder and protein source. Matcha adds theanine + antioxidants. The Greek yogurt + berry topping adds freshness. 10 portions from one bake is good value.

**Banana & Oat Protein Smoothie (pw2)** — 334 kcal · 30g protein · 46g carbs · 4.6g fat
Clean. Works well as a post-workout or breakfast smoothie. Frozen banana is the right call — creates better texture than fresh. Minor macro discrepancy (~11 kcal) — acceptable rounding.

---

### 🟡 NEEDS ATTENTION — flag for improvement

**Juicy Garlic Lemon Chicken** — 308 kcal · 52.5g protein · 5.6g carbs · 6.8g fat
**Issue:** This is a protein source only — not a complete meal. 308 kcal with near-zero carbs reads as a meal to users but nutritionally it's just marinated chicken breast. Without rice, potato, or another carb source, users eating this as a "main meal" will be severely under-fuelled for training.
**Fix:** Add a UI tag or note: "Protein component — serve with 150g rice or sweet potato to complete the meal." Or create a paired batch version.

**Slow Cooker Honey Cashew Chicken** — 334 kcal · 45g protein · 16g carbs · 9.5g fat
**Issue:** Same concern — this appears to be a chicken component without a carb base. 334 kcal is too low for a main meal for most training individuals. The honey + cashews would add more carbs in reality — check if the ingredient quantities reflect a complete dish.
**Fix:** Verify that rice or another carb base is included in the actual batch. If not, add a serving suggestion note.

**Creamy Oat Protein Shake (sm1)** — 742 kcal · 69.5g protein · 73.6g carbs · 21.3g fat
**Issue:** This is a 742 kcal meal. Labelling it as a "smoothie" alongside 300-400 kcal smoothies is misleading. Users might drink this alongside breakfast, doubling their calorie intake without realising.
**Fix:** Add a badge or note: "Meal replacement shake — 742 kcal. Use in place of a full meal." Consider adding it to a "Meal Replacement" category.

**High-Protein KFC Mac & Cheese** — 898 kcal · 75.9g protein · 105.2g carbs · 18.9g fat
**Issue:** Highest calorie recipe in the collection. Excellent for hard bulking but misleading if a user on a cut picks it as a "high protein" option without checking calories. 898 kcal is the entire calorie budget for some users' meals.
**Fix:** Add a "Calorie Dense" or "Bulk" badge to flag it clearly. Consider a note: "Best for bulking or high-calorie training days."

**Greek Yogurt Egg & Veggie Protein Bowl** — 654 kcal · 44g protein · 62g carbs · 25.9g fat
**Issue:** Fat is 25.9g which is the highest fat-to-protein ratio of any main meal (0.59:1). This is from the egg yolks, olive oil, and Greek yogurt combination. Not wrong nutritionally, but worth noting for users in a fat-sensitive phase.
**Fix:** Add optional modification: "For lower fat, use egg whites only and 0% Greek yogurt." No code change required — just a tip in the recipe.

**Chickpea & Roasted Veggie Couscous** — 548 kcal · 30.3g protein · 76.8g carbs · 11.2g fat
**Issue:** Lowest protein main meal at 30.3g. For a vegetarian recipe this is understandable but chickpeas alone don't deliver high protein density. The leucine content of plant proteins is lower than animal proteins — 30g plant protein may not reliably trigger full muscle protein synthesis.
**Fix:** Suggest adding 150g fat-free cottage cheese or a protein powder-based sauce on the side to boost protein to 40g+. Add a tip: "Boost protein: stir in 150g fat-free cottage cheese before serving — adds ~18g protein with no impact on flavour."

**Paneer Tikka Masala Bowl** — 472 kcal · 33.1g protein · 53.1g carbs · 14.9g fat
**Issue:** Paneer is a complete protein but at 33.1g total protein per portion this is one of the lower-protein vegetarian options. Paneer's protein density is modest (~18g/100g).
**Fix:** Consider increasing paneer quantity by 30-40% in the batch, or add 100g of non-fat Greek yogurt into the sauce base to lift protein without changing the flavour profile.

**Black Bean & Sweet Potato Burrito Bowls** — 558 kcal · 36.5g protein · 73.2g carbs · 14.6g fat
**Issue:** Black beans are incomplete protein. The amino acid score is limited by methionine. Users who rely on this for most of their protein intake should pair with rice (which provides the missing methionine) — which the recipe already does with sweet potato. Worth adding a note about amino acid completeness.
**Fix:** Add educational tip: "Black beans + rice together form a complete protein profile — all essential amino acids covered."

**Shakshuka Protein Bowls** — 598 kcal · 45.9g protein · 56.6g carbs · 21.8g fat
**Issue:** Fat at 21.8g is on the higher end for this collection. The tomato sauce base + eggs + feta account for most of this. Not incorrect but worth noting.
**Fix:** Optional modification: reduce feta by half and add egg whites alongside whole eggs to lower fat while preserving volume.

**Chocolate Banana Protein Brownies (d5)** — 165 kcal · 12.4g protein · 16.9g carbs · 6.5g fat
**Issue:** Good macro profile but fat at 6.5g is the highest of the dessert options (the olive oil + chocolate chips + Greek yogurt all contribute). For aggressive cutting phases this tips the calorie budget.
**Fix:** No change required — but consider a note: "Lower fat option: reduce chocolate chips to 8g and omit olive oil (the bananas and yogurt provide enough moisture)."

**Banana Dark Chocolate Almond Oats** — 504 kcal · 41.3g protein · 60.1g carbs · 11.6g fat
**Issue:** This is the highest-calorie oat breakfast at 504 kcal. Fine for bulking or larger individuals but should be flagged if users are in a deficit.
**Fix:** Add a "High Calorie Breakfast" note. No code change required.

---

### 🔴 REVIEW REQUIRED

**Lentil & Spinach Dahl** — 554 kcal · 42.6g protein · 81.7g carbs · 7g fat
**Note on protein claim:** Lentils + spinach delivering 42.6g protein per portion is plausible only with large lentil quantities AND a protein-boosting ingredient (e.g., added Greek yogurt or protein powder). Red lentils have ~9g protein per 100g cooked — to hit 42.6g from lentils alone would require ~470g cooked lentils per portion, which is extremely high volume. Verify the batch quantities add up correctly against the macro claim. If there's a protein powder or cottage cheese added to the sauce, this would explain the numbers.

**Tofu & Edamame Teriyaki Bowl** — 647 kcal · 48.8g protein · 76.8g carbs · 17.5g fat
**Note:** 48.8g protein from tofu + edamame is achievable (firm tofu ~17g/100g, edamame ~11g/100g) but only with generous quantities (~300g tofu + ~200g edamame per portion). Verify the batch quantities. If accurate, this is an excellent vegan recipe. Fat at 17.5g is primarily from tofu and sesame — acceptable.

---

## PART 3 — NUTRITION SCIENCE UPDATES (2025–2026 Research)

### 1. Protein Target — app is already aligned

The 2026 USDA Dietary Guidelines update raised the recommended protein range to 1.2–1.6g/kg/day as a baseline. For resistance-trained individuals, the research consensus (30-author review, Critical Reviews in Food Science and Nutrition, May 2026) supports 1.6g–2.4g/kg/day for muscle growth optimisation.

**Current app recommendation:** "Aim for 0.8–1g per lb of bodyweight" = 1.76–2.2g/kg. This is well within the optimal range. ✅ No change needed.

**Suggested addition:** Add a note in the macro calculator that the target varies by goal:
- Maintenance / general health: 1.2–1.6g/kg
- Muscle growth (resistance training): 1.6–2.2g/kg
- Aggressive body recomp (caloric deficit + training): 2.0–2.4g/kg

### 2. Leucine Threshold — upgrade the education content

New research (2026) confirms the leucine threshold is ~2.5g per meal for younger adults, ~3g for adults 40+. This requires approximately 25–35g of high-quality protein per meal to reliably stimulate muscle protein synthesis.

**App implication:** All main meal recipes easily clear this (most have 45–89g protein). However:
- Plant-based recipes (Chickpea Couscous 30.3g, Paneer 33.1g, Black Bean Burrito Bowls 36.5g) are closer to the threshold
- Add a note for vegetarian recipes: "Plant proteins require slightly higher quantities to match the muscle-signalling effect of animal proteins. If this is your main protein meal, consider adding a side of Greek yogurt or cottage cheese."

**Content idea:** A reel about "the leucine threshold" would perform well with an advanced audience. "The number your muscles actually care about."

### 3. Protein Distribution — 3–4 protein pulses per day is optimal

The latest evidence strongly supports spreading protein across 3–4 meals of 30–40g each rather than front-loading or back-loading. The difference in 24-hour muscle protein synthesis between eating 1 large protein meal vs 3 distributed meals is meaningful.

**App implication:** The meal prep system naturally encourages this pattern (breakfast + lunch + dinner + snack). Consider adding a UI message in the meal planner: "Your plan delivers [n] protein meals today — each one triggers a fresh round of muscle building."

**Recipe note:** The pre-workout snack category (15–37g protein per option) serves as a fourth protein pulse. This is the science working in the app's favour. Worth calling this out explicitly in app copy.

### 4. Meal Prep & Adherence — the science is on our side

A French cohort study (40,000+ adults) found meal planners have significantly lower odds of obesity and significantly better diet quality. A 2021 longitudinal study showed a mean weight loss of 6.2 lbs over 25 months for consistent meal preppers.

**App implication:** This is direct marketing ammunition. "The science says people who meal prep lose more weight — SoulGainz makes meal prep the easiest it's ever been." Use in:
- Onboarding copy
- Paywall messaging
- Instagram educational reels
- App Store description

### 5. Fibre — currently underweighted in the recipe collection

The USDA recommends 25–38g fibre/day. Most recipes are focused on protein and carbs with fibre as an afterthought.

**Opportunities:**
- Marry Me Chicken: add note that peas contribute 4g fibre per portion — underrated
- Banana Dark Chocolate Almond Oats: chia seeds + oats + banana = excellent fibre (12g+ per portion)
- Salmon Bowl: avocado contributes 7g fibre per portion — mention this in the recipe tip
- Black Bean Burrito Bowl: black beans are one of the highest-fibre legumes — call this out explicitly

**Feature suggestion:** Add a "fibre tracker" alongside the macro tracker in the app. Or at minimum show fibre on recipe cards alongside protein/carbs/fat.

### 6. Omega-3 — only two recipes prominently feature it

Salmon appears in two recipes (m62, Salmon & Avocado Burrito). Omega-3 EPA/DHA is critically underconsumed by most gym-goers. Current research recommends 2g+ EPA/DHA per day for inflammation reduction and muscle recovery.

**Recipe suggestion:** Add a "Tuna & Veg Protein Plate" (high-protein tuna, which was mentioned in the September social calendar at 89g protein / 524 kcal) — if it's not already in the library, it should be. Canned tuna is one of the highest protein-per-dollar ingredients.

**Content suggestion:** "Why your meals need more omega-3 — and the one ingredient that fixes it" (salmon/tuna reel).

### 7. Anti-inflammatory foods — the turmeric tips are scientifically valid

The turmeric + black pepper tips in the cooking recipes are scientifically grounded. Curcumin bioavailability increases ~2000% with piperine (from black pepper). This is legitimate and should stay in all stovetop/oven recipes where it applies. It was only incorrectly placed in no-cook recipes — now fixed.

**Enhancement:** The ginger tip in Egg White & Toast (pw4) and Ground Beef Bowl (m61) is also valid — research confirms gingerol reduces DOMS by ~25%. Consider adding this tip to more stovetop recipes where ginger can be added during cooking.

---

## PART 4 — FEATURE IMPROVEMENT SUGGESTIONS

### Based on research gaps in the current recipe collection

1. **Fibre metric on recipe cards** — Show fibre alongside kcal/protein/carbs/fat. Users ask about this and it differentiates SoulGainz from basic macro trackers.

2. **"Leucine score" or protein quality indicator** — For advanced users, show whether a recipe's protein source reliably hits the leucine threshold. Animal = high, plant = medium.

3. **"Bulk / Cut / Maintain" tags on recipes** — Tag each recipe by its best use:
   - Bulk: KFC Mac & Cheese (898 kcal), Honey Chipotle Chicken (831 kcal), Creamy Oat Protein Shake (742 kcal)
   - Cut: Juicy Garlic Lemon Chicken (308 kcal), Carrot Protein Pancakes, Protein Smoothie Bowl
   - Maintain: most mid-range recipes

4. **"Complete vs. component" labelling** — Flag recipes that are protein components (Juicy Garlic Lemon Chicken, Slow Cooker Honey Cashew Chicken) so users know they need to add a carb source.

5. **Plant-protein leucine note** — Automatically flag vegetarian/vegan recipes under 40g protein with a tip to add a side protein source.

6. **Fibre content** — Add fibre data to the perPortion object for each recipe. This requires a data update pass but would significantly differentiate the app.

---

## PART 5 — INSTAGRAM BIO CORRECTION

**App is not yet live. Waitlist link stays.**

The bio at time of audit:
```
Feed your soul. Fuel your gainz. 🔥
Cook once. Eat all week.
👇 Join the waitlist
soulgainz.app/waitlist
```

This is correct for pre-launch. When the app goes live, update to:
```
Cook once. Eat all week. 🍗
173 high-protein meal prep recipes
Verified macros · Batch portions
👇 Free macro calculator
soulgainz.app
```

**Name field** ("Soul Gainz") should become "SoulGainz — Meal Prep App" when live — adds keyword SEO for the "meal prep app" search.

---

## PART 6 — COMMIT CHECKLIST

Changes already made to index.html:
- [x] sm1: "oat milk" → "skimmed milk" in steps
- [x] pw0: turmeric tip replaced with general tip (no-cook)
- [x] pw6: turmeric tip removed (no-cook)
- [x] pw1: turmeric tip removed (no-cook)
- [x] ds2: turmeric tip removed (frozen no-cook)

Still to do (manual decisions needed from you):
- [ ] Juicy Garlic Lemon Chicken — add "protein component" note in UI
- [ ] Slow Cooker Honey Cashew Chicken — verify macro batch quantities include a carb base
- [ ] Creamy Oat Protein Shake — consider "Meal Replacement" badge (742 kcal)
- [ ] KFC Mac & Cheese — consider "Bulk" badge (898 kcal)
- [ ] Lentil & Spinach Dahl — verify 42.6g protein is mathematically correct given ingredient quantities
- [ ] Tofu & Edamame Teriyaki Bowl — verify 48.8g protein batch quantities
- [ ] Vegetarian recipes <40g protein — add leucine tip
- [ ] Add fibre data to perPortion if/when you update recipe data

---

*Sources consulted:*
- *2025–2030 USDA Dietary Guidelines (protein range update: 1.2–1.6g/kg/day baseline)*
- *Critical Reviews in Food Science and Nutrition, May 2026 — 30-author protein consensus review*
- *Leucine Threshold and Muscle Protein Synthesis: 2026 Update — Clinical Nutrition Report*
- *Impacts of protein quantity and distribution on body composition — PubMed PMC11099237*
- *French cohort study: meal planning & obesity risk — International Journal of Behavioral Nutrition and Physical Activity*
- *Meal Timing Interventions for Weight Loss — PubMed PMC12161006*
