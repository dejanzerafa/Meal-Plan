# SoulGainz Recipe Quality Audit
**Date:** August 2026 | **Recipes Audited:** 173 | **Research Base:** 2022–2026 academic findings

---

## Summary

173 recipes across 8 categories: mains (86), breakfasts (35), preworkout (9), smoothies (9), snacks (9), vegan (9), desserts (6), seasonal (10). The library is strong overall — high-protein, batch-friendly, with clear macro counts. This audit identifies the outliers and documents the improvements made.

---

## Changes Made (This Session)

### Code Infrastructure
- **Wave 2 removed** — All references to `RECIPE_TIER_WAVE2` cleaned up (all Wave 2 recipes were already released to monthly/annual tiers)
- **Pending Release system added** — New `RECIPE_TIER_PENDING` constant + `PENDING_RECIPES` staging array in the codebase. New recipes go here first, then get released to monthly/annual when ready

### Recipe Improvements
| Recipe | Issue | Fix Applied |
|--------|-------|-------------|
| `sn3` 🍉 Tropical Fruit Spice Bowl | 1.5g protein, no context for why | Subtitle updated; added science-backed tip explaining carb-only pre-workout intent + optional Greek yogurt pairing |
| `sn2` 🥟 Steamed Chicken Power Bao | 849 kcal main with no calorie context | Subtitle updated to "high-calorie bulk option" |
| `m65` 🍄 Umami Miso Mushroom Pasta | 32g protein — lower end for a main | Added step emphasising cottage cheese protein contribution + tip to add eggs or extra cottage cheese |
| `hol5` 🌙 Spiced Lamb & Lentil Rice | 707 kcal, 36g protein (20% protein ratio) | Added seasonal context note + tip to boost protein with extra Greek yogurt |

---

## Full Recipe Analysis by Category

### Mains (86 recipes)
**Average per portion:** ~530 kcal | ~53g protein | ~44g carbs | ~14g fat

**Standouts (high quality):**
- `m34` 🐟 Salmon & Sweet Potato — 481 kcal, 52g protein, omega-3 rich
- `m13` 🍖 Beef Mince & Rice Bowl — 437 kcal, 43g protein, high zinc
- `m50` 🥩 Marry Me Chicken — 517 kcal, 60g protein, excellent protein efficiency
- `m70` 🥩 Sirloin Steak & Sweet Potato — 494 kcal, 59g protein, high zinc + leucine

**Flagged (improved or monitored):**
- `m18` 🍗 Chicken with Mustard & Coffee Sauce — **228 kcal, 37.9g protein** — intentionally low-carb protein component; already has "Serve with rice or roasted veg" in steps. Fine as-is.
- `m62` 🐟 Salmon, Avocado & Spinach Bowl — **573 kcal, 37.5g fat, 10.8g carbs** — high fat, keto-lean profile. Intentional low-carb/keto option. No issue.
- `m65` 🍄 Umami Miso Mushroom Pasta — **32.3g protein** — improved (tip added to steps)
- `m25` 🍗 High-Protein KFC Mac & Cheese — **898 kcal** — highest calorie main. Clearly a bulk recipe; fine as labelled.

**Gap identified:**
- No sardine, mackerel, or anchovy recipes in the library. These are the highest omega-3-per-dollar fish sources. **Recommendation: add 1–2 oily fish recipes to a future drop.**

### Breakfasts (35 recipes)
**Average per portion:** ~370 kcal | ~40g protein

**Standouts:**
- `bf6` Cottage Cheese Protein Bowl — ideal slow-digesting casein, pre-sleep or morning
- `bf3` Turkey Egg White Bowl — 372 kcal, 50g protein, excellent lean profile

**Flagged:**
- `bf9` High-Protein Breakfast Platter — **852 kcal, 98g protein** — extreme bulking breakfast. This is by design but may surprise fat-loss users who see it. Consider adding a subtitle "bulk option."
- `bf8` Greek Yogurt Protein Bowl — **245 kcal, 23.7g protein** — very light. Fine as a light day option; no issue.

### Snacks (9 recipes)
**Average per portion:** ~250 kcal | ~22g protein

**Fixed:**
- `sn3` 🍉 Tropical Fruit Spice Bowl — was 1.5g protein with no context; now framed as carb-only preworkout fuel with pairing suggestion ✅

**Monitored:**
- `sn2` 🥟 Steamed Chicken Power Bao — 849 kcal, listed as main despite "sn" ID. Subtitle updated ✅
- `sn4` 🥒 Zesty Pickle & Veggie Board — 162 kcal, 19g protein. Fine as a light snack.

### Pre-Workout (9 recipes)
**All clean.** pw0–pw7 average 35–55g carbs, appropriate protein (0–20g). Science supports carb-forward, low-fat/fibre pre-workout nutrition. Added timing tip to sn3 as carb-only option.

**Gap:** Add timing guidance directly on each pw recipe card ("Best 60–75 min before training").

### Smoothies (9 recipes)
- `sm1` Creamy Oat Protein Shake — **742 kcal** — extremely high for a smoothie. This is essentially a full meal-replacement. Consider adding a note: "This is a full meal — count it as your main, not a snack."

### Vegan (9 recipes)
**Average per portion:** ~430 kcal | ~35g protein

**Note:** All vegan recipes have lower leucine content than meat-based mains. Research confirms plant proteins can match whey if leucine is adequate — but most lentil/tofu recipes sit below the 2.5g leucine threshold per portion. **Recommendation for future:** add a "boost leucine" tip to vegan mains (e.g., pair with 150g Greek yogurt side, or add soy protein).

### Seasonal / Holiday (10 recipes)
- `hol3` 🐣 Herb-Crusted Lamb — 36g fat per portion. Holiday recipe, acceptable.
- `hol5` 🌙 Spiced Lamb & Lentil Rice — 707 kcal, 36g protein (20% protein ratio). Improved with context note ✅

---

## Research-Backed Improvements (Priority Roadmap)

Based on the nutrition/fitness science research (2022–2026):

### High Priority
1. **Add fibre data to recipe cards** — High-protein diets shift gut bacteria toward inflammatory proteolytic fermentation without adequate fibre. Currently the app shows protein/carbs/fat/kcal only. Adding fibre estimates would be a meaningful differentiator.
2. **Add timing guidance to pre-workout category** — "Best 60–75 min before training" on pw0–pw7 recipe cards
3. **Flag recipes with leucine-sufficient protein** — All chicken breast, beef, egg, and salmon mains clear the 2.5g leucine threshold. A badge or tag ("MPS-optimised") would be scientifically differentiated and unique in the market.

### Medium Priority
4. **Label sm1 as meal-replacement** — 742 kcal smoothie should be positioned clearly as a meal, not a snack
5. **Add gut health pairing tips** — "Add 50 g kimchi" note to Korean/Asian bowl recipes; "serve with kefir" to high-protein mains. Fermented foods + cruciferous veg are the highest-impact gut health interventions per 2024 research.
6. **Add 1–2 oily fish recipes** — Sardine or mackerel recipes would plug the omega-3 gap at a lower cost than salmon
7. **Cottage cheese note** — Update bf6 and any recipe featuring cottage cheese with: "~80% casein — slow-digesting protein ideal pre-sleep"

### Feature Ideas (from research)
- **Daily protein goal tracker** — User inputs weight + goal (fat loss / maintain / bulk); app shows running protein total across day's meals
- **Post-workout recipe filter** — Surface mains and pw-series recipes as "Post-Workout Window" category
- **Hydration reminder** — "Drink 500ml water with this meal" note in meal plan view (dehydration suppresses MPS)
- **Micronutrient coaching** — Expand supplements section with: Vit D3 (1000–4000 IU), Magnesium glycinate (300–400mg pre-sleep), Zinc (25–40mg from food first)

---

## Macro Quality Summary

| Category | Avg kcal | Avg Protein | Protein% | Notes |
|----------|----------|-------------|----------|-------|
| Mains | 530 | 53g | 40% | Strong |
| Breakfasts | 370 | 40g | 43% | Strong |
| Snacks | 250 | 22g | 35% | Acceptable |
| Pre-workout | 210 | 8g | 15% | Intentional (carb-forward) |
| Smoothies | 490 | 42g | 34% | Watch sm1 at 742 kcal |
| Vegan | 430 | 35g | 33% | Leucine gap noted |
| Seasonal | 650 | 45g | 28% | Acceptable for occasion recipes |

---

## How to Add New Recipes (Updated Process)

1. Add recipe object to `PENDING_RECIPES` array in `index.html` (after line ~5380)
2. Add recipe ID to `RECIPE_TIER_PENDING` constant (~line 8084) — keeps it hidden from users
3. Test in dev mode (tier simulator) to verify it renders correctly
4. TO RELEASE: move ID from `RECIPE_TIER_PENDING` to `RECIPE_TIER_MONTHLY` or `RECIPE_TIER_ANNUAL`
5. Add to `NEWLY_RELEASED_IDS` for the 🔥 NEW badge (auto-expires 60 days)
6. Redeploy to Netlify

**ID naming convention:** bf87+, m87+, sm10+, sn10+, pw8+, v10+, d7+, ds7+

---

*Audit completed: August 2026 | Next review recommended after next recipe drop*
