# Recipe Audit — 2026-05-10
Total recipes: 94

---

## 🔴 Critical (fix before launch)

These issues are clearly wrong — macro data contradictions over 80 kcal, a broken portion count that breaks scaling, a JavaScript syntax error, and a mismatched note vs. displayed macros.

---

### [d1] Protein Brownie Cookies
- **Issue**: `portions: 7` but recipe note explicitly states "Makes 4 cookies"
- **Details**: The batch shopping list will scale to 7 servings, but the recipe only produces 4 physical cookies. Every shopper who follows this will overbuy by 75%.
- **Suggested fix**: Change `portions: 7` → `portions: 4`. Also verify macros: perPortion says {kcal:146, P:14, C:20, F:4.1} but note says 145/12/18/3 — resolve which is authoritative.

---

### [m19] Salmon & Avocado Burrito
- **Issue**: Macro note contradicts perPortion by 119 kcal
- **Details**: perPortion states `{kcal:623, protein:48, carbs:46, fat:28.3}`, but the recipe note says "Macros: 504 kcal · 38P · 32C · 27F". These appear to be two different serving sizes (100g vs full portion).
- **Suggested fix**: Decide which figure is correct for one burrito. The note's 504 kcal appears to reference a 100g/smaller portion. Update either the note or perPortion to match. Also: recipe name needs a leading emoji.

---

### [m20] Juicy Garlic Lemon Chicken
- **Issue**: Macro note contradicts perPortion by 81 kcal
- **Details**: perPortion states `{kcal:278, protein:55, carbs:6, fat:2.8}`, but note says "197 kcal · 39P · 2C · 4F per 200g portion". The note appears to be for a 200g sub-portion, while perPortion is the full serving.
- **Suggested fix**: Clarify in the note that 197 kcal is per 200g piece, and that full portions are ~278 kcal. Or standardise to one measurement. Recipe name also missing emoji.

---

### [m25] High-Protein KFC Mac & Cheese
- **Issue**: Macro note contradicts perPortion by 135 kcal
- **Details**: perPortion states `{kcal:724, protein:72, carbs:89, fat:6.6}`, but note says "589 kcal · 59P · 67C · 8F (4 portions)". This is a 23% calorie discrepancy — large enough to mislead users significantly.
- **Suggested fix**: Recalculate from scratch using exact brand weights. One set of figures needs to be removed. Also: add `portions: 4` to the recipe object. Recipe name missing emoji.

---

### [v4] Greek Yogurt Egg & Veggie Protein Bowl
- **Issue**: JavaScript syntax error — double comma `,,` before v5
- **Details**: The v4 recipe object ends with `},` followed by another `,` before the v5 object. In strict JS parsing this may silently insert an `undefined` element into the RECIPES array, which will break any code that assumes all array items are objects (`.map`, `.filter`, `.find` calls).
- **Suggested fix**: Remove the extra comma. Change `},,` → `},`. Also: add `portions: 5` field (note says 5 portions), add leading emoji to recipe name.

---

## 🟡 Review needed (confirm with owner)

These items may be intentional (single-serve recipes without a portions field is fine) but should be confirmed before launch.

---

### [bf3] 🥚 Breakfast Bagel Sandwich
- **Issue**: Near-duplicate of b3
- **Details**: `bf3` (portions:3, kcal:653, P:47, C:52, F:27.7) and `b3` "Turkey Sausage Breakfast Bagel" (portions:4, kcal:651, P:47, C:52, F:27.5) are nearly identical recipes with different IDs, portions counts, and slight macro variations.
- **Suggested fix**: Confirm whether both are intentionally in the library or if one should be removed. If keeping both, differentiate the names and macros clearly.

---

### [m29] 🥩 Ranch Beef Bowl
- **Issue**: No `portions` field on a batch main meal
- **Details**: Note says "divide into 3 containers" but no `portions:` key in the object. The shopping list scaler has nothing to key off.
- **Suggested fix**: Add `portions: 3` to the recipe object.

---

### [m30] 🥩 Lean Taco Salad
- **Issue**: No `portions` field on a batch main meal
- **Details**: Same as m29 — note says divide into 3 containers.
- **Suggested fix**: Add `portions: 3`.

---

### [m4] 🥩 Hibachi Steak Bowl
- **Issue**: ID naming inconsistency
- **Details**: ID is `"m4"` while all other main meal IDs are zero-padded (`"m01"` through `"m14"`). This can cause sort/lookup bugs.
- **Suggested fix**: Rename to `"m04"` and verify no hardcoded references to `"m4"` exist elsewhere in the codebase.

---

### [m16] 🍗 Honey Chipotle Chicken Burritos
- **Issue 1**: Note macro contradiction
- **Details**: Note says "Macros: 455 kcal · 65P · 52C · 4F per burrito" but perPortion states {kcal:521, protein:69, carbs:47, fat:5.1}. This is a 66 kcal gap with different macro splits.
- **Issue 2**: batchItem `m16_chip` has `qty: 1, unit: "whole"` for "Chipotle peppers in adobo" — ambiguous. Other recipes use grams (e.g. m06 uses 198g). 1 whole could mean 1 can or 1 single pepper.
- **Suggested fix**: Resolve note vs perPortion. Change m16_chip to `qty: 200, unit: "g"` or equivalent.

---

### [pw6] Chocolate Milk & Banana
- **Issue**: Missing leading emoji
- **Details**: All other preworkout recipes start with an emoji. This one starts with "Chocolate..." — breaks visual consistency and the emoji-strip sort logic may place it differently.
- **Suggested fix**: Add an appropriate emoji, e.g. `"🍫 Chocolate Milk & Banana"` or `"🥛 Chocolate Milk & Banana"`.

---

### [b0] High-Protein Breakfast
- **Issue 1**: Missing leading emoji; note macro contradiction
- **Details**: perPortion states {kcal:863, protein:99, carbs:69, fat:20.2} but note says "Macros: 798 kcal · 93P · 64C · 19F". 65 kcal gap with different protein counts (99 vs 93).
- **Suggested fix**: Reconcile note and perPortion. Add emoji to name.

---

### [b1] Egg, Beef & Cheese Breakfast Bowl
- **Issue 1**: Missing leading emoji
- **Issue 2**: Note macro contradiction — note says "512 kcal · 48P · 45C · 15F" but perPortion states {kcal:578, protein:56, carbs:42, fat:18.7}
- **Issue 3**: No `portions` field — note says divide into 7 containers but no `portions: 7` in object
- **Suggested fix**: Add emoji, add `portions: 7`, resolve note vs perPortion.

---

### [b3] Turkey Sausage Breakfast Bagel
- **Issue 1**: Missing leading emoji
- **Issue 2**: Note says "601 kcal · 51P · 34C · 29F" but perPortion states {kcal:651, protein:47, carbs:52, fat:27.5}
- **Suggested fix**: Add emoji, resolve note discrepancy. Also review near-duplication with bf3.

---

### [d2] Protein Brownie
- **Issue 1**: Macro math off by 37 kcal — `(39×4)+(17×4)+(10.3×9)=317` vs stated 280
- **Issue 2**: Note says "297 kcal · 37P · 17C · 9F" — three different figures (note, perPortion, and calculated all differ)
- **Issue 3**: Missing emoji; no portions field
- **Suggested fix**: Recalculate macros from ingredient weights. The note may be from an older version. Add emoji and `portions: 1`.

---

### [m18] Chicken with Mustard & Coffee Sauce
- **Issue**: Missing leading emoji; no `portions` field
- **Details**: Recipe note says "4 portions" but no `portions:` key. The macro math checks out ({39×4}+{7×4}+{3×9}=211 vs 208 stated — within tolerance).
- **Suggested fix**: Add emoji, add `portions: 4`.

---

### [m21] Crispy Chicken Nuggets
- **Issue**: Missing emoji; `flexPortions: true` with no context
- **Details**: The recipe uses `flexPortions: true` but has no `portions` field and no explanation of what the base serving is. Per-portion macros show 106 kcal / 12P / 5C / 3.7F which appears to be per nugget or per 2-nugget serving.
- **Suggested fix**: Add emoji. Define a base `portions` or add a clear serving note (e.g. "2 nuggets per serving").

---

### [b4] Protein Smoothie Bowl
- **Issue**: Missing emoji; no `portions` field (single-serve is OK but flag for consistency)
- **Suggested fix**: Add emoji (e.g. `🫐 Protein Smoothie Bowl`).

---

### [b5] Carrot Protein Pancakes
- **Issue**: Missing leading emoji
- **Suggested fix**: Add emoji (e.g. `🥕 Carrot Protein Pancakes`).

---

### [d3] High-Protein Chocolate Cake
- **Issue 1**: Missing emoji
- **Issue 2**: Note says "118 kcal · 15P · 9C · 3F" but perPortion states {kcal:93, protein:12, carbs:9, fat:1.8}
- **Details**: Macro math: `(12×4)+(9×4)+(1.8×9)=100` — closer to 100 than 93 or 118. Significant confusion between versions.
- **Suggested fix**: Add emoji. Recalculate from ingredient weights and standardise.

---

### [d4] Matcha Banana Protein Bread
- **Issue**: Missing emoji; minor note discrepancy (note says 153 kcal, stated is 152 — negligible)
- **Suggested fix**: Add emoji (e.g. `🍵 Matcha Banana Protein Bread`).

---

### [m22] Hot Honey Beef & Sweet Potato Bowls
- **Issue 1**: Missing emoji; no `portions` field
- **Issue 2**: Note says "650 kcal · 50P · 45C · 30F" but perPortion states {kcal:583, protein:54, carbs:56, fat:15.7} — different macro split entirely
- **Suggested fix**: Add emoji, add `portions: 4`. Reconcile note vs perPortion (they appear to be different recipes or versions).

---

### [m23] Pepperoni Pizza Pasta
- **Issue 1**: Missing emoji; no `portions` field
- **Issue 2**: Note says "490 kcal · 44P · 40C · 18F" but perPortion states {kcal:462, protein:38, carbs:34, fat:18.8}
- **Suggested fix**: Add emoji, add `portions: 10`. Reconcile note.

---

### [m24] Slow Cooker Honey Cashew Chicken
- **Issue 1**: Missing emoji; no `portions` field
- **Issue 2**: `carb: "🍚 Rice"` but no rice in `batchItems` — rice is described as an optional add-on in the note
- **Suggested fix**: Add emoji, add `portions: 5`. Change `carb` to `"🥜 Cashew"` or similar that reflects the actual batchItems.

---

### [m26] Creamy Steak Pasta
- **Issue 1**: Missing emoji; no `portions` field
- **Issue 2**: Note says "690 kcal · 51P · 74C · 20F" but perPortion states {kcal:733, protein:52, carbs:76, fat:23.2}
- **Suggested fix**: Add emoji, add `portions: 10`. Reconcile note.

---

### [m27] Sweet Potato Veggie Egg Bake
- **Issue**: Missing emoji; no `portions` field; note labels macros as "estimated"
- **Details**: Note explicitly says "~200 kcal · 10P · 26C · 6F per portion (4 portions, estimated)" — these don't match the perPortion object (213/13/25/7.5). Both may be estimates.
- **Suggested fix**: Add emoji, add `portions: 4`. Pick one set of figures.

---

### [b6] High-Protein Breakfast Oats
- **Issue**: Missing emoji; no `portions` field (single-serve)
- **Suggested fix**: Add emoji (e.g. `🌾 High-Protein Breakfast Oats`).

---

### [d5] Chocolate Mousse Chia Pudding
- **Issue 1**: Macro math off by 33 kcal — `(30×4)+(42×4)+(26.7×9)=528` vs stated 495
- **Issue 2**: Missing emoji; no `portions` field
- **Suggested fix**: Add emoji. Verify fat content — 26.7g fat for a portion with 8g almond butter and 25g dark chocolate seems high; recheck ingredient quantities. Add `portions: 1`.

---

### [v1] Lentil & Spinach Dahl
- **Issue**: Missing emoji; no `portions` field (note says 7)
- **Suggested fix**: Add emoji (e.g. `🍛 Lentil & Spinach Dahl`), add `portions: 7`.

---

### [v2] Tofu & Edamame Teriyaki Bowl
- **Issue 1**: Macro math off by 34 kcal — `(34×4)+(56×4)+(14×9)=486` vs stated 520
- **Issue 2**: Missing emoji; no `portions` field (note says 5)
- **Suggested fix**: Add emoji, add `portions: 5`. Recalculate macros — the 34 kcal gap suggests either protein or carbs are understated by ~8g.

---

### [v3] Chickpea & Roasted Veggie Couscous
- **Issue 1**: Macro math off by 31 kcal — `(19×4)+(62×4)+(10×9)=414` vs stated 445
- **Issue 2**: Missing emoji; no `portions` field (note says 6)
- **Suggested fix**: Add emoji, add `portions: 6`. Recalculate — the gap is likely fat being understated (olive oil 40mL across 6 portions adds ~60 kcal per portion).

---

## 🟢 Looks good

The following 63 recipe IDs passed all checks (macro math within 30 kcal, portions defined or single-serve, emoji present, carb field matches batchItems, holiday flags correct):

m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12, m13, m14, bf2, bf4, bf5, bf6, ds2, m28, m15, m17, m31, m32, m33, m34, m35, m36, m37, m38, m39, m40, m41, m42, m43, m44, m45, m46, m47, m48, m49, m50, pw0, pw1, pw2, pw3, pw4, pw5, v5, v6, v7, v8, v9, hol1, hol2, hol3, hol4, hol5, hol6, hol7, hol8, hol9, hol10

**Notable**: All 10 holiday recipes (hol1–hol10) correctly carry `locked: true` and `seasonal: true`. All 14 core main meals (m01–m14) pass all checks. The m31–m50 locked premium recipe block is clean.

---

## Summary of issues by type

| Check | Critical | Review |
|---|---|---|
| Macro note vs perPortion contradiction (>60 kcal) | 2 (m19, m25) | 6 (b0, b1, b3, m16, m22, m26) |
| Macro math (P×4+C×4+F×9) off >30 kcal | 0 | 4 (d2, d5, v2, v3) |
| portions field broken / missing on batch recipe | 1 (d1: wrong count) | 14 (multiple) |
| Missing leading emoji | 0 (flagged alongside other issues) | 18 recipes |
| JavaScript syntax error | 1 (v4: double comma) | — |
| carb field mismatch | 0 | 1 (m24) |
| Duplicate/near-duplicate recipe | 0 | 1 (bf3 ≈ b3) |
| ID naming inconsistency | 0 | 1 (m4 → should be m04) |
| Ambiguous batchItem qty/unit | 0 | 1 (m16_chip: qty:1 whole) |
