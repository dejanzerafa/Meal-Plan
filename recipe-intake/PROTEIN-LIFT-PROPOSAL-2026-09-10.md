# Protein lift — 80 staged recipes, proposed changes

2026-09-10. **Applied 2026-09-10** via `apply-protein-lift-2026-09-10.mjs` — 292 changes.

Every addition below lands in three places: a `batchItems` row (so it reaches the ingredients tab and the shopping list), a `INGREDIENT_MACROS` key copied from the registry row, and a method step. `perPortion` is then recomputed from the ingredients — the "after" numbers below are that recomputation, not an estimate.

## Summary

| id | recipe | cat | protein % now | after | +protein | |
|---|---|---|---|---|---|---|
| bf38 | 🥕 Carrot Cake Baked Oats | breakfast | 18.5% | **30.1%** | +24.0 g | ✅ clears floor |
| bf39 | 🫐 Wild Blueberry Vanilla Kefir Bowl | breakfast | 22.6% | **34.0%** | +21.7 g | ✅ clears floor |
| bf41 | 🥥 Bounty Overnight Weetabix | breakfast | 22.3% | **32.4%** | +24.8 g | ✅ clears floor |
| bf49 | 🧀 Mushroom & Goat Cheese Scramble | breakfast | 27.6% | **35.7%** | +12.4 g | ✅ clears median |
| bf50 | 🫙 Strawberry Chia Parfait | breakfast | 25.8% | **35.3%** | +12.4 g | ✅ clears median |
| bf52 | 🥚 Savory Oatmeal with Spinach & Poached Egg | breakfast | 26.1% | **35.5%** | +14.9 g | ✅ clears median |
| bf53 | 🌯 Savory Mushroom Breakfast Wrap | breakfast | 22.8% | **33.5%** | +18.6 g | ✅ clears floor |
| bf54 | 🥚 Avocado Egg Toast with Microgreens | breakfast | 21.7% | **34.8%** | +24.8 g | ✅ clears median |
| bf55 | 🥚 Creamy Avocado Toast with Soft-Boiled Egg | breakfast | 19.8% | **32.4%** | +24.8 g | ✅ clears floor |
| bf56 | 🫙 Tropical Sunrise Parfait | breakfast | 24.9% | **31.3%** | +9.0 g | ✅ clears floor |
| bf57 | 🥞 Lemon Ricotta Pancakes | breakfast | 18.8% | **36.9%** | +24.0 g | ✅ clears median |
| bf58 | 🌾 Peanut Butter Banana Overnight Oats | breakfast | 15.1% | **31.4%** | +24.0 g | ✅ clears floor |
| bf59 | 🧀 Strawberry Cottage Cheese Toast | breakfast | 28.0% | **36.0%** | +7.4 g | ✅ clears median |
| bf60 | 🌾 Banana Almond Butter Overnight Oats | breakfast | 13.9% | **31.2%** | +24.0 g | ✅ clears floor |
| bf61 | 🌾 Banana-Oat-Pancakes | breakfast | 19.5% | **39.8%** | +24.0 g | ✅ clears median |
| bf62 | 🌯 Sweet Almond Toast with Ricotta & Honey | breakfast | 18.8% | **31.3%** | +12.4 g | ✅ clears floor |
| bf63 | 🌾 Brain-Boosting Berry Oatmeal | breakfast | 15.3% | **32.3%** | +20.0 g | ✅ clears floor |
| bf65 | 🌾 Coconut Mango Overnight Oats | breakfast | 11.3% | **34.2%** | +34.0 g | ✅ clears floor |
| bf66 | 🌾 Honey Nut Quinoa Breakfast Bowl | breakfast | 12.0% | **32.2%** | +24.0 g | ✅ clears floor |
| bf67 | 🍪 Blueberry Almond Breakfast Muffins | breakfast | 14.5% | **40.3%** | +24.0 g | ✅ clears median |
| bf68 | 🥤 Green Apple & Cinnamon Smoothie | breakfast | 6.7% | **33.1%** | +24.0 g | ✅ clears floor |
| bf69 | 🍎 Warm Quinoa Breakfast Bowl with Cinnamon Apples | breakfast | 10.1% | **33.5%** | +24.0 g | ✅ clears floor |
| bf70 | 🌾 Strawberry Almond Baked Oatmeal Cups | breakfast | 13.6% | **42.5%** | +24.0 g | ✅ clears median |
| bf71 | 🍪 Apple Cinnamon Protein Muffins | breakfast | 25.2% | **37.3%** | +8.0 g | ✅ clears median |
| bf72 | 🧀 Sweet Potato Hash with Spinach & Feta | breakfast | 9.5% | **30.1%** | +16.5 g | ✅ clears floor |
| bf73 | 🥤 Mango Coconut Smoothie Bowl | breakfast | 21.3% | **33.6%** | +16.0 g | ✅ clears floor |
| bf74 | 🥤 Mango Turmeric Smoothie | breakfast | 7.0% | **33.5%** | +24.0 g | ✅ clears floor |
| bf75 | 🫙 Coconut Yogurt Parfait with Tropical Fruit | breakfast | 4.8% | **35.0%** | +39.0 g | ✅ clears median |
| bf76 | 🥣 Peach Chia Breakfast Pudding | breakfast | 11.8% | **49.4%** | +24.0 g | ✅ clears median |
| d6 | 🍎 Baked Apple & Blueberry Crumble | dessert | 16.8% | **32.3%** | +24.0 g | ✅ clears floor |
| ds14 | 🫙 Apple Cinnamon Yogurt Parfait | dessert | 22.7% | **42.9%** | +24.0 g | ✅ clears median |
| ds17 | 🍎 Apple Peanut Butter "Nachos" | dessert | 9.8% | **34.9%** | +24.0 g | ✅ clears median |
| ds18 | 🫐 Dark Chocolate-Dipped Strawberries | dessert | 5.5% | **32.0%** | +12.0 g | ✅ clears floor |
| ds20 | 🍪 Peanut Butter Banana Rice Cakes | dessert | 11.0% | **47.2%** | +24.0 g | ✅ clears median |
| ds21 | 🌾 Banana Almond Oat Cookies | dessert | 11.8% | **49.4%** | +24.0 g | ✅ clears median |
| ds22 | 🍪 Spiced Almond Energy Bites | dessert | 9.1% | **33.3%** | +16.0 g | ✅ clears median |
| ds23 | 🍽️ Coconut Matcha Bliss Balls | dessert | 9.7% | **35.0%** | +12.0 g | ✅ clears median |
| ds7 | 🍫 Frozen Banana Snickers Bar | dessert | 10.6% | **31.2%** | +24.0 g | ✅ clears floor |
| m157 | 🍝 Creamy Mushroom & Spinach Pasta | main | 16.0% | **27.1%** | +18.6 g | ✅ clears floor |
| m162 | 🫘 Curried Chickpea Bowl | main | 15.7% | **24.6%** | +34.6 g | ✅ clears floor |
| m163 | 🥚 Veggie-Packed Chickpea Pasta | main | 18.8% | **35.8%** | +24.8 g | ✅ clears floor |
| m166 | 🍝 Creamy Spinach & Mushroom Orzo | main | 13.9% | **25.3%** | +18.6 g | ✅ clears floor |
| m169 | 🥑 Creamy Avocado Pasta | main | 9.5% | **23.8%** | +24.8 g | ✅ clears floor |
| m170 | 🫘 Roasted Chickpea & Avocado Toast | main | 13.4% | **28.9%** | +24.8 g | ✅ clears floor |
| m171 | 🌾 Broccoli & Cheddar Quinoa Bowl | main | 16.1% | **33.1%** | +18.6 g | ✅ clears floor |
| m172 | 🥚 Roasted Veggie Grain Bowl with Tahini Drizzle | main | 14.4% | **26.0%** | +15.0 g | ✅ clears floor |
| m173 | 🫘 Moroccan Chickpea Tagine | main | 15.6% | **25.8%** | +15.0 g | ✅ clears floor |
| m174 | 🫘 Chickpea & Spinach Coconut Stew | main | 14.9% | **27.4%** | +18.6 g | ✅ clears floor |
| m178 | 🫘 Baked Falafel Bowl | main | 15.8% | **27.4%** | +15.0 g | ✅ clears floor |
| m179 | 🍽️ Mediterranean Stuffed Bell Peppers | main | 12.7% | **28.5%** | +18.6 g | ✅ clears floor |
| m180 | 🥚 Quinoa-Stuffed Eggplant Boats | main | 11.7% | **32.7%** | +24.8 g | ✅ clears floor |
| m181 | 🥚 Baked Eggplant Parmesan | main | 18.3% | **39.6%** | +24.8 g | ✅ clears median |
| m182 | 🥚 Quinoa & Veggie Stir-Fry | main | 12.2% | **29.6%** | +26.0 g | ✅ clears floor |
| m186 | 🍽️ Green Goddess Buddha Bowl | main | 13.8% | **26.1%** | +15.0 g | ✅ clears floor |
| m188 | 🫘 Chickpea Coconut Curry with Basmati Rice | main | 14.6% | **22.6%** | +31.1 g | ✅ clears floor |
| m189 | 🌾 Rainbow Grain Salad | main | 12.0% | **29.8%** | +26.0 g | ✅ clears floor |
| m191 | 🍲 Mushroom Barley Soup | main | 14.2% | **34.1%** | +15.0 g | ✅ clears floor |
| ds16 | 🌱 Crispy Air-Fried Tofu Bites | salad | 33.2% | **38.0%** | +9.7 g | ✅ clears floor |
| sn12 | 🥚 Avocado Egg Salad Wrap | salad | 22.0% | **36.3%** | +34.8 g | ✅ clears floor |
| sn15 | 🫘 Spiced Chickpea Wraps | salad | 16.1% | **36.4%** | +54.0 g | ✅ clears floor |
| sn16 | 🥚 Grilled Veggie & Halloumi Salad | salad | 24.7% | **43.0%** | +36.0 g | ✅ clears median |
| sn20 | 🫙 Apple Cinnamon Greek Yogurt Dip | salad | 22.4% | **43.5%** | +24.0 g | ✅ clears median |
| sn22 | 🌿 Mediterranean Lentil Salad with Feta | salad | 25.3% | **35.9%** | +22.3 g | ✅ clears floor |
| sn23 | 🥚 Veggie-Packed Hummus Wrap | salad | 11.9% | **36.7%** | +36.0 g | ✅ clears floor |
| sn24 | 🍽️ Roasted Pumpkin Seeds with Cinnamon & Honey | salad | 20.3% | **43.2%** | +24.0 g | ✅ clears median |
| sn25 | 🧀 Roasted Beet & Goat Cheese Salad | salad | 13.4% | **40.6%** | +43.2 g | ✅ clears floor |
| sn27 | 🫙 Carrot Sticks with Spicy Greek Yogurt Dip | salad | 28.7% | **46.3%** | +12.4 g | ✅ clears median |
| sn29 | 🫘 Spicy Roasted Chickpeas | salad | 18.7% | **37.1%** | +24.8 g | ✅ clears floor |
| sn32 | 🫙 Sweet Potato Fries with Greek Yogurt | salad | 13.5% | **39.4%** | +27.7 g | ✅ clears floor |
| sn33 | 🍝 Tomato Basil Orzo Salad | salad | 9.4% | **40.5%** | +36.0 g | ✅ clears floor |
| sn34 | 🫘 Roasted Chickpea Crunch | salad | 17.3% | **36.2%** | +20.0 g | ✅ clears floor |
| sn35 | 🥚 Mini Veggie Frittatas | salad | 32.1% | **42.0%** | +5.5 g | ✅ clears floor |
| sn36 | 🫘 Greek Chickpea Salad Bowl | salad | 16.8% | **36.2%** | +53.6 g | ✅ clears floor |
| sn37 | 🫘 Cucumber Hummus Roll-Ups | salad | 17.7% | **42.1%** | +12.4 g | ✅ clears median |
| sn38 | 🥦 Baked Zucchini Fries | salad | 18.1% | **37.7%** | +5.5 g | ✅ clears floor |
| sn39 | 🥚 Veggie Sticks with Spicy Tahini Dip | salad | 12.0% | **42.2%** | +20.0 g | ✅ clears median |
| sn40 | 🫘 Cucumber Hummus Cups | salad | 14.5% | **40.3%** | +12.4 g | ✅ clears floor |
| m183 | 🥤 Matcha Green Smoothie Bowl | smoothie | 10.5% | **32.7%** | +24.0 g | ✅ clears floor |
| sm23 | 🥣 Mango Coconut Chia Pudding | smoothie | 25.5% | **34.1%** | +20.0 g | ✅ clears floor |
| sm26 | 🥤 Pineapple Coconut Recovery Smoothie | smoothie | 25.3% | **32.2%** | +15.0 g | ✅ clears floor |

---

## Every recipe in detail

### bf75 — 🫙 Coconut Yogurt Parfait with Tropical Fruit
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `47` Greek Yogurt (0% fat) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key
- **Add** `210` Whey Protein Powder — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a glass, whisk the coconut yogurt with the Greek yogurt and a scoop of whey protein powder until completely smooth, then layer this mixture with the granola and mixed fruit.

**Why:** Both stir into the yogurt base cold, so the parfait stays creamy and tropical.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 275 | 3.3 g | 32.4 g | 14.8 g | 4.8% |
| after | 484 | 42.3 g | 40.2 g | 16.6 g | **35.0%** ✅ clears median |

---

### bf68 — 🥤 Green Apple & Cinnamon Smoothie
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Combine all ingredients in a blender, adding a scoop of whey protein powder along with the apple, banana, spinach, and almond milk.

**Why:** Whey disappears into a cold blended smoothie without dulling the apple-cinnamon flavour.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 214 | 3.6 g | 50.2 g | 2.4 g | 6.7% |
| after | 334 | 27.6 g | 52.6 g | 3.6 g | **33.1%** ✅ clears floor |

---

### bf74 — 🥤 Mango Turmeric Smoothie
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add all ingredients to a blender, including a scoop of whey protein powder, then blend until smooth and silky.

**Why:** Whey blends invisibly into the cold mango base.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 211 | 3.7 g | 50.6 g | 1.4 g | 7.0% |
| after | 331 | 27.7 g | 53 g | 2.6 g | **33.5%** ✅ clears floor |

---

### bf72 — 🧀 Sweet Potato Hash with Spinach & Feta
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `41` Egg Whites (raw) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add spinach, garlic powder, and the egg whites to the skillet, stirring and folding gently until the egg whites are just set and the spinach has wilted.

**Why:** Egg whites scramble into the hot hash with no added fat.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 206 | 4.9 g | 22.4 g | 11.2 g | 9.5% |
| after | 284 | 21.4 g | 23.4 g | 11.5 g | **30.1%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add crumbled turkey breakfast sausage — 50 g per portion."* Adds **+98 kcal, +8.5 g protein, +1.0 g carbs, +6.5 g fat** per portion → 31.3% protein.

---

### bf69 — 🍎 Warm Quinoa Breakfast Bowl with Cinnamon Apples
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Remove the pot from the heat after the apples are tender, let it cool for a minute, then whisk in the whey protein powder until fully smooth before spooning into bowls and topping with walnuts and chia seeds.

**Why:** Off direct heat, whey will not clump and folds into the cinnamon-apple sweetness.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 238 | 6 g | 43 g | 5.8 g | 10.1% |
| after | 358 | 30 g | 45.4 g | 7 g | **33.5%** ✅ clears floor |

---

### bf65 — 🌾 Coconut Mango Overnight Oats
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key
- **Add** `47` Greek Yogurt (0% fat) — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Combine oats, coconut milk, chia seeds, honey, and whey protein powder in a jar, then stir in the Greek yogurt until fully incorporated, seal, and refrigerate overnight.

**Why:** Both mix in cold and set with the oats overnight.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 327 | 9.2 g | 42.4 g | 14.7 g | 11.3% |
| after | 506 | 43.2 g | 48.4 g | 16.3 g | **34.2%** ✅ clears floor |

---

### bf76 — 🥣 Peach Chia Breakfast Pudding
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Mix chia seeds, almond milk, honey, vanilla, and whey protein powder in a jar until the powder is fully dissolved, then cover and refrigerate for 2 hours until thickened.

**Why:** Whey stirs smoothly into the cold chia base before it sets.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 98 | 2.9 g | 13.1 g | 4.2 g | 11.8% |
| after | 218 | 26.9 g | 15.5 g | 5.4 g | **49.4%** ✅ clears median |

---

### bf66 — 🌾 Honey Nut Quinoa Breakfast Bowl
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Remove from the heat, then stir in the honey, cinnamon, and whey protein powder until smooth, before dividing between bowls and topping with almonds, walnuts, and banana.

**Why:** Adding whey off direct heat prevents clumping in this honey-nut bowl.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 284 | 8.5 g | 46.1 g | 8.2 g | 12.0% |
| after | 404 | 32.5 g | 48.5 g | 9.4 g | **32.2%** ✅ clears floor |

---

### bf70 — 🌾 Strawberry Almond Baked Oatmeal Cups
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a bowl, mix the oats and baking powder, then stir in the almond milk, egg, honey, vanilla extract and a scoop of whey protein powder until no dry streaks remain, before folding in the strawberries and almonds.

**Why:** Whisked into raw batter, whey disappears into the crumb.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 156 | 5.3 g | 27 g | 3.4 g | 13.6% |
| after | 276 | 29.3 g | 29.4 g | 4.6 g | **42.5%** ✅ clears median |

---

### bf60 — 🌾 Banana Almond Butter Overnight Oats
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a jar, mix oats, almond milk, mashed banana, almond butter, vanilla, chia seeds, and a scoop of whey protein powder, stirring until fully dissolved.

**Why:** A no-heat overnight jar is exactly where whey belongs.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 339 | 11.8 g | 45.8 g | 13.3 g | 13.9% |
| after | 459 | 35.8 g | 48.2 g | 14.5 g | **31.2%** ✅ clears floor |

---

### bf67 — 🍪 Blueberry Almond Breakfast Muffins
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a mixing bowl, whisk eggs, honey, almond milk, vanilla, and a scoop of whey protein powder until combined, before adding the almond flour, oats, and baking powder.

**Why:** Stirred into the wet mix pre-bake, whey keeps the tender crumb.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 185 | 6.7 g | 17.2 g | 11.3 g | 14.5% |
| after | 305 | 30.7 g | 19.6 g | 12.5 g | **40.3%** ✅ clears median |

---

### bf58 — 🌾 Peanut Butter Banana Overnight Oats
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a jar, stir together the rolled oats, almond milk, peanut butter, half the mashed banana, the chia seeds, the cinnamon, and a scoop of whey protein powder until evenly combined.

**Why:** Cold overnight jar — whey blends smoothly and echoes the peanut butter.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 358 | 13.5 g | 48.7 g | 14 g | 15.1% |
| after | 478 | 37.5 g | 51.1 g | 15.2 g | **31.4%** ✅ clears floor |

---

### bf63 — 🌾 Brain-Boosting Berry Oatmeal
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `47` Greek Yogurt (0% fat) — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Remove from the heat and fold in the mixed berries gently, then dollop in the Greek yogurt and stir until the porridge turns creamy and cools slightly.

**Why:** Stirred in off the heat, 0% yogurt adds tang without curdling.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 246 | 9.4 g | 39 g | 6.6 g | 15.3% |
| after | 364 | 29.4 g | 46.2 g | 7.4 g | **32.3%** ✅ clears floor |

---

### bf38 — 🥕 Carrot Cake Baked Oats
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Stir the oats, milk, egg, maple syrup, cinnamon, nutmeg, and a scoop of whey protein powder together until evenly combined, before folding in the grated carrot and raisins.

**Why:** Mixed into the batter before baking, whey rounds out the carrot-cake flavour.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 516 | 23.9 g | 71.5 g | 16.8 g | 18.5% |
| after | 636 | 47.9 g | 73.9 g | 18 g | **30.1%** ✅ clears floor |

---

### bf62 — 🌯 Sweet Almond Toast with Ricotta & Honey
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `42` Fat-Free Cottage Cheese (blended smooth) — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese until completely smooth, then spread it over the warm toast first, followed by the ricotta, so the two creamy layers combine before you drizzle with honey and cinnamon.

**Why:** Blended smooth, it vanishes into the ricotta layer.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 217 | 10.2 g | 26.5 g | 8.3 g | 18.8% |
| after | 289 | 22.6 g | 30.8 g | 8.6 g | **31.3%** ✅ clears floor |

---

### bf57 — 🥞 Lemon Ricotta Pancakes
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a bowl, whisk ricotta, egg, almond milk, honey, lemon zest, vanilla, and a scoop of whey protein powder until smooth, before combining with the dry ingredients.

**Why:** Added to the raw wet mix, whey folds seamlessly into the batter.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 287 | 13.5 g | 37.8 g | 8.5 g | 18.8% |
| after | 407 | 37.5 g | 40.2 g | 9.7 g | **36.9%** ✅ clears median |

---

### bf61 — 🌾 Banana-Oat-Pancakes
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Place banana, eggs, oats, cinnamon, baking powder, and the whey protein powder in a blender. Blend until smooth and slightly thick.

**Why:** The batter is already blended, so whey disappears into it completely.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 238 | 11.6 g | 27.7 g | 9.6 g | 19.5% |
| after | 358 | 35.6 g | 30.1 g | 10.8 g | **39.8%** ✅ clears median |

---

### bf55 — 🥚 Creamy Avocado Toast with Soft-Boiled Egg
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a bowl, blend the avocado with the cottage cheese and olive oil until completely smooth, then season with salt and pepper before spreading.

**Why:** Blitzed cottage cheese thickens the avocado mash without adding fat.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 417 | 20.6 g | 24.2 g | 27.6 g | 19.8% |
| after | 561 | 45.4 g | 32.8 g | 28.2 g | **32.4%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add smoked salmon — 60 g per portion."* Adds **+70 kcal, +10.8 g protein, +0.0 g carbs, +2.6 g fat** per portion → 35.6% protein.

---

### bf73 — 🥤 Mango Coconut Smoothie Bowl
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Increase** `210` Whey Protein Powder (vanilla) — **20 g/portion** (20 g batch) — existing row `bf73_vanill` 15 g → 35 g

**Method:** In a blender, combine mango, banana, coconut milk, and the whey protein powder, now raised to 35 g in total. Blend on high until creamy and smooth.

**Why:** The bowl already leans on protein powder, so topping up the scoop is the least disruptive fix.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 302 | 16.1 g | 35.4 g | 11.9 g | 21.3% |
| after | 382 | 32.1 g | 37 g | 12.7 g | **33.6%** ✅ clears floor |

---

### bf54 — 🥚 Avocado Egg Toast with Microgreens
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a small bowl, mash the avocado together with the cottage cheese until smooth yet slightly chunky, then season lightly with salt and pepper before spreading on the toast.

**Why:** Keeps the creamy texture while adding protein with almost no extra fat.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 373 | 20.2 g | 24.5 g | 22.7 g | 21.7% |
| after | 517 | 45 g | 33.1 g | 23.3 g | **34.8%** ✅ clears median |

**🍗 Non-veg option note:** *"Not vegetarian? Add smoked salmon — 60 g per portion."* Adds **+70 kcal, +10.8 g protein, +0.0 g carbs, +2.6 g fat** per portion → 38.0% protein.

---

### bf41 — 🥥 Bounty Overnight Weetabix
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add the coconut protein yogurt to the base, then blend in the cottage cheese until smooth before sprinkling over the desiccated coconut.

**Why:** Folds invisibly into the creamy yogurt layer.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 523 | 29.2 g | 60.4 g | 17.2 g | 22.3% |
| after | 667 | 54 g | 69 g | 17.8 g | **32.4%** ✅ clears floor |

---

### bf39 — 🫐 Wild Blueberry Vanilla Kefir Bowl
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `42` Fat-Free Cottage Cheese — **175 g/portion** (175 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese until smooth, then stir it with the vanilla and honey into the kefir and yogurt so the base tastes finished rather than plain.

**Why:** Thickens the base and disappears into the kefir-yogurt mix.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 383 | 21.6 g | 61.7 g | 5.7 g | 22.6% |
| after | 509 | 43.3 g | 69.2 g | 6.2 g | **34.0%** ✅ clears floor |

---

### bf53 — 🌯 Savory Mushroom Breakfast Wrap
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `42` Fat-Free Cottage Cheese — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese until smooth and mix it with the hummus, then spread the combined mixture down the centre of the tortilla.

**Why:** Stretches the hummus layer further without changing the wrap.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 355 | 20.2 g | 33.7 g | 15.5 g | 22.8% |
| after | 463 | 38.8 g | 40.2 g | 15.9 g | **33.5%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add crumbled turkey sausage — 50 g per portion."* Adds **+98 kcal, +8.5 g protein, +1.0 g carbs, +6.5 g fat** per portion → 33.7% protein.

---

### bf56 — 🫙 Tropical Sunrise Parfait
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Increase** `48` Low-fat Greek yogurt (increase existing row) — **100 g/portion** (100 g batch) — existing row `bf56_lowfat` 122 g → 222 g

**Method:** In a glass, layer the low-fat Greek yogurt together with an extra 100 g of 0% Greek yogurt, then add the mango, pineapple, and granola.

**Why:** Doubling the yogurt already in the parfait keeps one line on the shopping list rather than two near-identical yogurts.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 206 | 12.8 g | 23.1 g | 7 g | 24.9% |
| after | 279 | 21.8 g | 27 g | 8.9 g | **31.3%** ✅ clears floor |

---

### bf71 — 🍪 Apple Cinnamon Protein Muffins
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Increase** `210` Whey Protein Powder (vanilla) — **10 g/portion** (10 g batch) — existing row `bf71_vanill` 5 g → 15 g

**Method:** In a bowl, whisk together oat flour, the whey protein powder — now 15 g in total — baking powder, and cinnamon.

**Why:** The batter is already whey-based, so a larger scoop blends in seamlessly.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 141 | 8.9 g | 19 g | 3.5 g | 25.2% |
| after | 181 | 16.9 g | 19.8 g | 3.9 g | **37.3%** ✅ clears median |

---

### bf50 — 🫙 Strawberry Chia Parfait
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `42` Fat-Free Cottage Cheese — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In serving glasses, layer chia pudding, Greek yogurt blended smooth with the cottage cheese until creamy, and sliced strawberries.

**Why:** Blended cottage cheese disappears into the yogurt layer.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 253 | 16.3 g | 23.1 g | 10.6 g | 25.8% |
| after | 325 | 28.7 g | 27.4 g | 10.9 g | **35.3%** ✅ clears median |

---

### bf52 — 🥚 Savory Oatmeal with Spinach & Poached Egg
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `42` Fat-Free Cottage Cheese — **120 g/portion** (120 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Remove the pan from the heat, then stir the cottage cheese, blended smooth, into the oats until creamy before folding in the spinach.

**Why:** Melts into the oats off the heat, thickening them into a savoury sauce.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 311 | 20.3 g | 30 g | 11.8 g | 26.1% |
| after | 397 | 35.2 g | 35.2 g | 12.2 g | **35.5%** ✅ clears median |

**🍗 Non-veg option note:** *"Not vegetarian? Add smoked turkey bacon, crumbled — 30 g per portion."* Adds **+65 kcal, +8.7 g protein, +0.6 g carbs, +3.3 g fat** per portion → 38.0% protein.

---

### bf49 — 🧀 Mushroom & Goat Cheese Scramble
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `42` Fat-Free Cottage Cheese — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add the goat cheese and the cottage cheese, blended smooth, folding until both are just melted through the eggs.

**Why:** Folds into the curds like a savoury sauce, keeping the scramble light.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 297 | 20.5 g | 1.6 g | 22.7 g | 27.6% |
| after | 369 | 32.9 g | 5.9 g | 23 g | **35.7%** ✅ clears median |

**🍗 Non-veg option note:** *"Not vegetarian? Add crispy turkey bacon, crumbled — 30 g per portion."* Adds **+65 kcal, +8.7 g protein, +0.6 g carbs, +3.3 g fat** per portion → 38.3% protein.

---

### bf59 — 🧀 Strawberry Cottage Cheese Toast
*breakfast · 1 portion · floor 29.9% · live median 34.7%*

- **Add** `42` Fat-Free Cottage Cheese — **60 g/portion** (60 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Spread the cottage cheese — 116 g in total — evenly over the toast.

**Why:** The same base ingredient the toast already stars, just a bigger spoonful.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 176 | 12.3 g | 24.8 g | 3.2 g | 28.0% |
| after | 219 | 19.7 g | 27.4 g | 3.4 g | **36.0%** ✅ clears median |

---

### ds18 — 🫐 Dark Chocolate-Dipped Strawberries
*dessert · 1 portion · floor 23.1% · live median 33.3%*

- **Add** `47` Greek Yogurt (0% fat) — **120 g/portion** (120 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Before dipping, roll each strawberry through a shallow bowl of thick 0% Greek yogurt, letting the excess drip off, then dip halfway into the warm chocolate as before.

**Why:** A cool yogurt undercoat adds a protein layer beneath the chocolate shell.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 95 | 1.3 g | 9.2 g | 6.1 g | 5.5% |
| after | 166 | 13.3 g | 13.5 g | 6.6 g | **32.0%** ✅ clears floor |

---

### ds22 — 🍪 Spiced Almond Energy Bites
*dessert · 1 portion · floor 23.1% · live median 33.3%*

- **Add** `210` Whey Protein Powder — **20 g/portion** (20 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add cinnamon, nutmeg, chia seeds, coconut oil, vanilla, and the vanilla whey protein powder; blend until a sticky dough forms.

**Why:** Never heated, so whey blends straight into the date dough.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 154 | 3.5 g | 18.1 g | 8.8 g | 9.1% |
| after | 234 | 19.5 g | 19.7 g | 9.6 g | **33.3%** ✅ clears median |

---

### ds23 — 🍽️ Coconut Matcha Bliss Balls
*dessert · 1 portion · floor 23.1% · live median 33.3%*

- **Add** `210` Whey Protein Powder — **15 g/portion** (15 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add almond butter, honey, vanilla, and the vanilla whey protein powder; blend until a sticky dough forms.

**Why:** Processed cold, so whey folds in cleanly without drying the dough.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 107 | 2.6 g | 12.3 g | 5.7 g | 9.7% |
| after | 167 | 14.6 g | 13.5 g | 6.3 g | **35.0%** ✅ clears median |

---

### ds17 — 🍎 Apple Peanut Butter "Nachos"
*dessert · 1 portion · floor 23.1% · live median 33.3%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Whisk the vanilla whey protein powder with 15 ml of water until smooth, then drizzle it over the apple slices alongside the peanut butter.

**Why:** Whisked into a thin glaze, whey clings to the apple slices.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 216 | 5.3 g | 29.5 g | 10.9 g | 9.8% |
| after | 336 | 29.3 g | 31.9 g | 12.1 g | **34.9%** ✅ clears median |

---

### ds7 — 🍫 Frozen Banana Snickers Bar
*dessert · 1 portion · floor 23.1% · live median 33.3%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Spread the peanut butter, whisked together with the vanilla whey protein powder and 15 ml of water until smooth, over the cut side. This is the caramel layer that makes it taste like the candy bar.

**Why:** Thickens the peanut butter into more of a caramel spread.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 284 | 7.5 g | 24.3 g | 19.3 g | 10.6% |
| after | 404 | 31.5 g | 26.7 g | 20.5 g | **31.2%** ✅ clears floor |

---

### ds20 — 🍪 Peanut Butter Banana Rice Cakes
*dessert · 1 portion · floor 23.1% · live median 33.3%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Whisk the peanut butter with the vanilla whey protein powder and 15 ml of water into a thick paste, then spread it across the rice cakes right to the edges.

**Why:** Keeps the spreadable texture while multiplying the protein.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 109 | 3 g | 16.3 g | 4.3 g | 11.0% |
| after | 229 | 27 g | 18.7 g | 5.5 g | **47.2%** ✅ clears median |

---

### ds21 — 🌾 Banana Almond Oat Cookies
*dessert · 1 portion · floor 23.1% · live median 33.3%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Mix all the ingredients with the vanilla whey protein powder in a bowl until combined, adding a splash of milk if the dough feels dry.

**Why:** Whey folds into raw cookie dough like any dry ingredient.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 98 | 2.9 g | 16.5 g | 3 g | 11.8% |
| after | 218 | 26.9 g | 18.9 g | 4.2 g | **49.4%** ✅ clears median |

---

### d6 — 🍎 Baked Apple & Blueberry Crumble
*dessert · 1 portion · floor 23.1% · live median 33.3%*

- **Increase** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — existing row `d6_whey` 10 g → 40 g

**Method:** Combine the oats, the vanilla whey protein powder — now 40 g in total — and the almond flour in a bowl.

**Why:** The topping already carries whey, so upping the amount keeps the crumble intact.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 371 | 15.6 g | 60 g | 10 g | 16.8% |
| after | 491 | 39.6 g | 62.4 g | 11.2 g | **32.3%** ✅ clears floor |

---

### ds14 — 🫙 Apple Cinnamon Yogurt Parfait
*dessert · 1 portion · floor 23.1% · live median 33.3%*

- **Add** `210` Whey Protein Powder (vanilla) — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a bowl, stir together the yogurt, honey, cinnamon, and the vanilla whey protein powder until smooth and well combined.

**Why:** Stirred cold into a parfait that is built around yogurt anyway.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 220 | 12.5 g | 31.3 g | 5.6 g | 22.7% |
| after | 340 | 36.5 g | 33.7 g | 6.8 g | **42.9%** ✅ clears median |

---

### m169 — 🥑 Creamy Avocado Pasta
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a blender, combine the avocado, cottage cheese, garlic, lemon juice, olive oil, salt, and pepper. Blend until creamy.

**Why:** Blended smooth, it disappears into the avocado sauce and adds body.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 455 | 10.8 g | 46.6 g | 27.1 g | 9.5% |
| after | 599 | 35.6 g | 55.2 g | 27.7 g | **23.8%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 36.5% protein.

---

### m180 — 🥚 Quinoa-Stuffed Eggplant Boats
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Mix with the quinoa, tomatoes, spinach, oregano, cottage cheese, salt, and pepper.

**Why:** Adds a ricotta-like creaminess to the quinoa filling.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 249 | 7.3 g | 37.7 g | 9.4 g | 11.7% |
| after | 393 | 32.1 g | 46.3 g | 10 g | **32.7%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add ground turkey — 120 g per portion."* Adds **+178 kcal, +25.2 g protein, +0.0 g carbs, +8.4 g fat** per portion → 40.2% protein.

---

### m189 — 🌾 Rainbow Grain Salad
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `341` Tofu (extra-firm, pressed) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a large bowl, combine the quinoa, cabbage, carrots, peppers, edamame, and the pan-seared tofu cubes.

**Why:** Seared cubes hold their texture when tossed cold with a vinaigrette.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 223 | 6.7 g | 27.6 g | 9.9 g | 12.0% |
| after | 439 | 32.7 g | 31.8 g | 22.9 g | **29.8%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast, diced — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 43.9% protein.

---

### m182 — 🥚 Quinoa & Veggie Stir-Fry
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `341` Tofu (extra-firm, pressed) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add the cubed tofu to the pan with the garlic and vegetables, sautéing until lightly golden before adding the cooked quinoa and soy sauce.

**Why:** Pan-seared tofu soaks up the soy-sesame flavours already in the dish.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 230 | 7 g | 28 g | 9.8 g | 12.2% |
| after | 446 | 33 g | 32.2 g | 22.9 g | **29.6%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add sliced chicken breast — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 43.6% protein.

---

### m179 — 🍽️ Mediterranean Stuffed Bell Peppers
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `42` Fat-Free Cottage Cheese — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese until smooth and mix it into the quinoa, feta, salt, and pepper before spooning the mixture into the peppers.

**Why:** Disappears into the creamy quinoa-feta filling.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 277 | 8.8 g | 31.5 g | 13.2 g | 12.7% |
| after | 385 | 27.4 g | 38 g | 13.6 g | **28.5%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add ground turkey, cooked — 100 g per portion."* Adds **+176 kcal, +27.0 g protein, +0.0 g carbs, +7.0 g fat** per portion → 38.8% protein.

---

### m170 — 🫘 Roasted Chickpea & Avocado Toast
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Whip the cottage cheese smooth with the olive oil, spread it over the toast, then mash the avocado on top and season with salt and pepper.

**Why:** Whipped cottage cheese on toast is a natural base under the avocado, and it keeps the recipe no-cook.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 373 | 12.5 g | 42.3 g | 19.2 g | 13.4% |
| after | 517 | 37.3 g | 50.9 g | 19.8 g | **28.9%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add smoked salmon — 60 g per portion."* Adds **+70 kcal, +10.8 g protein, +0.0 g carbs, +2.6 g fat** per portion → 32.8% protein.

---

### m186 — 🍽️ Green Goddess Buddha Bowl
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `47` Greek Yogurt (0% fat) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Whisk the tahini, lemon juice, olive oil, Greek yogurt, salt, and pepper into a creamy green-goddess-style dressing.

**Why:** Yogurt turns the tahini dressing rich and creamy.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 298 | 10.3 g | 34.1 g | 15.1 g | 13.8% |
| after | 387 | 25.3 g | 39.5 g | 15.7 g | **26.1%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 42.7% protein.

---

### m166 — 🍝 Creamy Spinach & Mushroom Orzo
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `42` Fat-Free Cottage Cheese — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese until smooth and stir it in with the almond milk and Parmesan until creamy.

**Why:** Thickens the sauce while preserving the dish's signature creaminess.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 416 | 14.5 g | 64.5 g | 10.6 g | 13.9% |
| after | 524 | 33.1 g | 71 g | 11 g | **25.3%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add shredded cooked chicken — 100 g per portion."* Adds **+165 kcal, +31.0 g protein, +0.0 g carbs, +3.6 g fat** per portion → 37.2% protein.

---

### m191 — 🍲 Mushroom Barley Soup
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `47` Greek Yogurt (0% fat) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Remove the pot from the heat and stir in the Greek yogurt just before serving, until the soup turns silky.

**Why:** A dairy swirl off the heat is classic in mushroom-barley soup.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 149 | 5.3 g | 27 g | 2.7 g | 14.2% |
| after | 238 | 20.3 g | 32.4 g | 3.3 g | **34.1%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add diced beef chuck, stewed — 100 g per portion."* Adds **+220 kcal, +28.0 g protein, +0.0 g carbs, +12.0 g fat** per portion → 42.2% protein.

---

### m172 — 🥚 Roasted Veggie Grain Bowl with Tahini Drizzle
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `47` Greek Yogurt (0% fat) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Whisk the tahini, lemon juice, maple syrup, Greek yogurt, and warm water into a smooth, creamy dressing.

**Why:** Yogurt rounds the tahini drizzle into a tahini-yogurt sauce.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 319 | 11.5 g | 52.6 g | 7.3 g | 14.4% |
| after | 408 | 26.5 g | 58 g | 7.9 g | **26.0%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken thigh — 120 g per portion."* Adds **+156 kcal, +25.2 g protein, +0.0 g carbs, +5.4 g fat** per portion → 36.7% protein.

---

### m188 — 🫘 Chickpea Coconut Curry with Basmati Rice
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `341` Tofu (extra-firm, pressed) — **180 g/portion** (180 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add the chickpeas, coconut milk, tomatoes, and cubed tofu. Simmer for 10–12 minutes until thickened and the tofu is heated through.

**Why:** Firm tofu soaks up the curry spices and holds its shape.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 824 | 30.1 g | 126.2 g | 24.9 g | 14.6% |
| after | 1083 | 61.2 g | 131.2 g | 40.6 g | **22.6%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add diced chicken thigh — 150 g per portion."* Adds **+195 kcal, +31.5 g protein, +0.0 g carbs, +6.8 g fat** per portion → 29.0% protein.

---

### m174 — 🫘 Chickpea & Spinach Coconut Stew
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `42` Fat-Free Cottage Cheese — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Stir in the coconut milk, the cottage cheese blended smooth, and the spinach; cook until wilted and creamy.

**Why:** Melts into the coconut milk without curdling or going grainy.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 358 | 13.3 g | 44.6 g | 15.6 g | 14.9% |
| after | 466 | 31.9 g | 51 g | 16.1 g | **27.4%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add diced chicken breast — 120 g per portion."* Adds **+144 kcal, +27.0 g protein, +0.0 g carbs, +3.1 g fat** per portion → 38.6% protein.

---

### m173 — 🫘 Moroccan Chickpea Tagine
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `47` Greek Yogurt (0% fat) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Garnish with fresh parsley and a dollop of 0% Greek yogurt, then serve with couscous or rice.

**Why:** A cool dollop off the heat is classic alongside a spiced tagine.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 360 | 14 g | 53.7 g | 11.5 g | 15.6% |
| after | 449 | 29 g | 59.1 g | 12.1 g | **25.8%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add diced lamb shoulder — 120 g per portion."* Adds **+281 kcal, +30.0 g protein, +0.0 g carbs, +18.0 g fat** per portion → 32.3% protein.

---

### m162 — 🫘 Curried Chickpea Bowl
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `341` Tofu (extra-firm, pressed) — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Stir in the chickpeas, coconut milk, and cubed tofu; simmer for 5–7 minutes until the tofu is warmed through.

**Why:** Simmers in the curried coconut sauce, picking up flavour.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 762 | 30 g | 111.2 g | 24.5 g | 15.7% |
| after | 1050 | 64.6 g | 116.8 g | 41.9 g | **24.6%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add diced chicken breast — 150 g per portion."* Adds **+180 kcal, +33.8 g protein, +0.0 g carbs, +3.9 g fat** per portion → 32.0% protein.

---

### m178 — 🫘 Baked Falafel Bowl
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `47` Greek Yogurt (0% fat) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Serve with a side of mixed greens and a dip of 0% Greek yogurt stirred with a squeeze of lemon.

**Why:** A lemony yogurt dip is the traditional falafel accompaniment.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 307 | 12.1 g | 41.4 g | 11.3 g | 15.8% |
| after | 396 | 27.1 g | 46.8 g | 11.9 g | **27.4%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken shawarma — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 43.3% protein.

---

### m157 — 🍝 Creamy Mushroom & Spinach Pasta
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `42` Fat-Free Cottage Cheese — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add the almond milk and the cottage cheese blended smooth; simmer 3 minutes until creamy. Stir in the spinach until wilted.

**Why:** Turns the almond milk into a rich pasta sauce without extra fat.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 406 | 16.2 g | 61.1 g | 11.5 g | 16.0% |
| after | 514 | 34.8 g | 67.5 g | 11.9 g | **27.1%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 40.4% protein.

---

### m171 — 🌾 Broccoli & Cheddar Quinoa Bowl
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `42` Fat-Free Cottage Cheese — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add the broccoli, cheddar, and the cottage cheese blended smooth, mixing until melted into a creamy sauce.

**Why:** Folds into the melting cheddar to build a creamier sauce.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 228 | 9.2 g | 23.5 g | 11.3 g | 16.1% |
| after | 336 | 27.8 g | 29.9 g | 11.8 g | **33.1%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 48.7% protein.

---

### m181 — 🥚 Baked Eggplant Parmesan
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Spread the cottage cheese blended smooth over the eggplant, layer with the marinara, and scatter the shredded mozzarella over the top, then bake another 10 minutes.

**Why:** Stands in for a ricotta layer, the traditional filling in a baked parmigiana.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 197 | 9 g | 19.9 g | 10.7 g | 18.3% |
| after | 341 | 33.8 g | 28.5 g | 11.3 g | **39.6%** ✅ clears median |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 52.7% protein.

---

### m163 — 🥚 Veggie-Packed Chickpea Pasta
*main · 1 portion · floor 20.7% · live median 36.7%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese with a splash of the pasta cooking water until completely smooth, then stir it into the pan with the sautéed tomatoes before adding the spinach and cooked pasta, tossing until the sauce coats everything.

**Why:** Turns into a silky sauce without fighting the light tomato-garlic flavour.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 279 | 13.1 g | 34.7 g | 10.3 g | 18.8% |
| after | 423 | 37.9 g | 43.3 g | 10.9 g | **35.8%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 48.4% protein.

---

### sn33 — 🍝 Tomato Basil Orzo Salad
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `281` Fat-Free Mozzarella (diced) — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** After tossing the orzo with the tomatoes, basil, and olive oil, fold in the diced mozzarella so it becomes a caprese-style orzo salad, then finish with the balsamic glaze.

**Why:** Plays straight into the tomato-basil pairing.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 251 | 5.9 g | 39 g | 7.8 g | 9.4% |
| after | 414 | 41.9 g | 42 g | 8.3 g | **40.5%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 100 g per portion."* Adds **+165 kcal, +31.0 g protein, +0.0 g carbs, +3.6 g fat** per portion → 50.4% protein.

---

### sn23 — 🥚 Veggie-Packed Hummus Wrap
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `281` Fat-Free Mozzarella (shredded) — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** After spreading the hummus, scatter the shredded mozzarella over the spinach layer before adding the carrots, cucumber, peppers, and avocado, then roll the tortilla tightly.

**Why:** Adds a creamy, savoury backbone without displacing the crunch.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 339 | 10.1 g | 44.9 g | 14.6 g | 11.9% |
| after | 502 | 46.1 g | 47.9 g | 15.1 g | **36.7%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 100 g per portion."* Adds **+165 kcal, +31.0 g protein, +0.0 g carbs, +3.6 g fat** per portion → 46.2% protein.

---

### sn39 — 🥚 Veggie Sticks with Spicy Tahini Dip
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `47` Greek Yogurt (0% fat) — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In the small bowl, whisk the tahini with the Greek yogurt, lemon juice, chilli powder, and a pinch of salt, adding only a splash of water, until smooth and creamy.

**Why:** A yogurt-tahini dip is a Mediterranean classic and makes the dip the centrepiece.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 100 | 3 g | 5.6 g | 8.2 g | 12.0% |
| after | 218 | 23 g | 12.8 g | 9 g | **42.2%** ✅ clears median |

---

### sn25 — 🧀 Roasted Beet & Goat Cheese Salad
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `281` Fat-Free Mozzarella (crumbled) — **120 g/portion** (120 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Toss the greens with the roasted beetroot, goat cheese, walnuts, and the crumbled mozzarella before drizzling with olive oil and balsamic vinegar.

**Why:** A second, leaner cheese keeps the creamy-tangy character.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 343 | 11.5 g | 18 g | 26.3 g | 13.4% |
| after | 539 | 54.7 g | 21.6 g | 26.9 g | **40.6%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add crispy prosciutto — 40 g per portion."* Adds **+78 kcal, +10.4 g protein, +0.4 g carbs, +4.0 g fat** per portion → 42.2% protein.

---

### sn32 — 🫙 Sweet Potato Fries with Greek Yogurt
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Increase** `48` Greek yogurt (increase existing row) — **170 g/portion** (170 g batch) — existing row `sn32_greeky` 30.5 g → 200.5 g
- **Add** `42` Fat-Free Cottage Cheese — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese smooth and stir it into the Greek yogurt — 200 g of yogurt in total — with the lemon juice, for a thicker, more generous dip alongside the sweet potato fries.

**Why:** Cottage cheese thickens the dip and carries far more protein than yogurt alone, without changing how it tastes.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 130 | 4.4 g | 21.6 g | 2.9 g | 13.5% |
| after | 326 | 32.1 g | 32.5 g | 6.4 g | **39.4%** ✅ clears floor |

---

### sn40 — 🫘 Cucumber Hummus Cups
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `42` Fat-Free Cottage Cheese — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese smooth and mix it into the hummus before spooning the mixture into each hollowed cucumber cup, then finish with the olive oil drizzle, paprika, and parsley.

**Why:** Thickens and lightens the hummus filling without changing its flavour.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 80 | 2.9 g | 8.6 g | 4.6 g | 14.5% |
| after | 152 | 15.3 g | 12.9 g | 4.9 g | **40.3%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add smoked salmon — 30 g per portion."* Adds **+35 kcal, +5.4 g protein, +0.0 g carbs, +1.3 g fat** per portion → 44.3% protein.

---

### sn15 — 🫘 Spiced Chickpea Wraps
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `281` Fat-Free Mozzarella (shredded) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** After spreading the Greek yogurt on the tortillas, scatter the shredded mozzarella over the spiced chickpeas so it melts slightly from their warmth, then add the lettuce, roll tightly, and cut in half.

**Why:** Melting cheese into the warm chickpeas gives the wrap a savoury finish.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 623 | 25 g | 92 g | 18.6 g | 16.1% |
| after | 868 | 79 g | 96.5 g | 19.4 g | **36.4%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 100 g per portion."* Adds **+165 kcal, +31.0 g protein, +0.0 g carbs, +3.6 g fat** per portion → 42.6% protein.

---

### sn36 — 🫘 Greek Chickpea Salad Bowl
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key
- **Add** `281` Fat-Free Mozzarella (cubed) — **80 g/portion** (80 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** In a small bowl, blend the cottage cheese until smooth and whisk it into the dressing along with the olive oil, lemon juice, oregano, salt, and pepper, then pour over the salad, scatter over the cubed mozzarella, and toss to coat.

**Why:** The blended dressing turns creamy without masking the Greek flavours, and cubed mozzarella belongs in a Greek salad alongside the feta.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 595 | 25 g | 82.1 g | 20.9 g | 16.8% |
| after | 869 | 78.6 g | 93.1 g | 21.9 g | **36.2%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 43.4% protein.

---

### sn34 — 🫘 Roasted Chickpea Crunch
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `47` Greek Yogurt (0% fat) — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** While the chickpeas roast, stir the Greek yogurt with a pinch of the same paprika and garlic powder to make a cooling dip, then serve the hot chickpeas alongside it for scooping.

**Why:** Gives the crunchy chickpeas something creamy to be scooped into.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 197 | 8.5 g | 27.8 g | 6.4 g | 17.3% |
| after | 315 | 28.5 g | 35 g | 7.2 g | **36.2%** ✅ clears floor |

---

### sn37 — 🫘 Cucumber Hummus Roll-Ups
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `42` Fat-Free Cottage Cheese — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese until smooth and fold it into the hummus before spreading a thin layer over each cucumber slice.

**Why:** Thickens the hummus spread while roughly doubling the protein per roll.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 79 | 3.5 g | 9.8 g | 3.7 g | 17.7% |
| after | 151 | 15.9 g | 14.1 g | 4 g | **42.1%** ✅ clears median |

**🍗 Non-veg option note:** *"Not vegetarian? Add sliced turkey breast — 60 g per portion."* Adds **+62 kcal, +10.2 g protein, +0.6 g carbs, +1.2 g fat** per portion → 48.9% protein.

---

### sn38 — 🥦 Baked Zucchini Fries
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `41` Egg Whites (raw) — **50 g/portion** (50 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Dip the zucchini pieces in the egg whites before tossing them with the breadcrumbs, Parmesan, olive oil, salt, and pepper, so the coating clings evenly.

**Why:** An egg-white dip is the classic way to make breading stick.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 62 | 2.8 g | 5.6 g | 3.5 g | 18.1% |
| after | 88 | 8.3 g | 5.9 g | 3.6 g | **37.7%** ✅ clears floor |

---

### sn29 — 🫘 Spicy Roasted Chickpeas
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** While the chickpeas roast, blend the cottage cheese smooth with a squeeze of lemon and a pinch of salt to make a cooling dip, and serve it alongside the hot spicy chickpeas.

**Why:** A cool, creamy dip balances the cayenne heat.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 248 | 11.6 g | 38 g | 6.4 g | 18.7% |
| after | 392 | 36.4 g | 46.6 g | 7 g | **37.1%** ✅ clears floor |

---

### sn24 — 🍽️ Roasted Pumpkin Seeds with Cinnamon & Honey
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `210` Whey Protein Powder — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Once the pumpkin seeds have roasted and cooled slightly, toss them with the whey protein powder and a little extra cinnamon so it clings to the honey glaze.

**Why:** Stirred in after roasting, whey sticks to the glaze like a cinnamon-sugar coating.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 193 | 9.8 g | 6.6 g | 16 g | 20.3% |
| after | 313 | 33.8 g | 9 g | 17.2 g | **43.2%** ✅ clears median |

---

### sn12 — 🥚 Avocado Egg Salad Wrap
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `42` Fat-Free Cottage Cheese — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key
- **Add** `47` Greek Yogurt (0% fat) — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Mash the avocado with the Greek yogurt, the blended cottage cheese, and the lemon juice until smooth, then stir in the chopped eggs, salt, and pepper.

**Why:** Blended cottage cheese and a bigger spoon of yogurt keep the filling creamy and spreadable — and keep the wrap genuinely no-cook.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 458 | 25.2 g | 34.2 g | 24.6 g | 22.0% |
| after | 661 | 60 g | 46.4 g | 25.6 g | **36.3%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add turkey bacon, crisped — 40 g per portion."* Adds **+87 kcal, +11.6 g protein, +0.8 g carbs, +4.4 g fat** per portion → 38.3% protein.

---

### sn20 — 🫙 Apple Cinnamon Greek Yogurt Dip
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `210` Whey Protein Powder — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Add the yogurt to a small bowl, whisk in the whey protein powder, then sprinkle in the cinnamon and drizzle the honey over the top, mixing until smooth and creamy.

**Why:** Whey dissolves cleanly in cold yogurt and pairs with the cinnamon-honey.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 207 | 11.6 g | 36.8 g | 2.7 g | 22.4% |
| after | 327 | 35.6 g | 39.2 g | 3.9 g | **43.5%** ✅ clears median |

---

### sn16 — 🥚 Grilled Veggie & Halloumi Salad
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `281` Fat-Free Mozzarella — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Toss all with the greens, scatter the cubed mozzarella through the warm salad so it softens slightly, and drizzle with balsamic vinegar.

**Why:** Mozzarella cubes echo the halloumi's texture without extra grease.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 405 | 25 g | 7.8 g | 30.9 g | 24.7% |
| after | 568 | 61 g | 10.8 g | 31.4 g | **43.0%** ✅ clears median |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 120 g per portion."* Adds **+198 kcal, +37.2 g protein, +0.0 g carbs, +4.3 g fat** per portion → 51.3% protein.

---

### sn22 — 🌿 Mediterranean Lentil Salad with Feta
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `42` Fat-Free Cottage Cheese — **180 g/portion** (180 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese until smooth, then whisk it with the olive oil, lemon juice, salt, and pepper into a creamy dressing.

**Why:** Thickens the lemony dressing into a protein-rich cream that coats the lentils.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 399 | 25.2 g | 55.2 g | 10.1 g | 25.3% |
| after | 529 | 47.5 g | 62.9 g | 10.6 g | **35.9%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add grilled chicken breast — 100 g per portion."* Adds **+165 kcal, +31.0 g protein, +0.0 g carbs, +3.6 g fat** per portion → 45.2% protein.

---

### sn27 — 🫙 Carrot Sticks with Spicy Greek Yogurt Dip
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `42` Fat-Free Cottage Cheese — **100 g/portion** (100 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the cottage cheese smooth and whisk it into the Greek yogurt with the spices, lemon juice and a pinch of salt until fully combined.

**Why:** Thickens the dip and doubles its protein while staying dippable.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 92 | 6.6 g | 13.4 g | 1.5 g | 28.7% |
| after | 164 | 19 g | 17.7 g | 1.8 g | **46.3%** ✅ clears median |

---

### sn35 — 🥚 Mini Veggie Frittatas
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Add** `41` Egg Whites (raw) — **50 g/portion** (50 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Whisk the eggs, egg whites, milk, salt, and pepper in a bowl.

**Why:** Boosts protein in the frittata mix without adding fat.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 112 | 9 g | 4.3 g | 6.4 g | 32.1% |
| after | 138 | 14.5 g | 4.6 g | 6.5 g | **42.0%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add diced cooked ham — 40 g per portion."* Adds **+58 kcal, +7.2 g protein, +0.4 g carbs, +2.8 g fat** per portion → 44.3% protein.

---

### ds16 — 🌱 Crispy Air-Fried Tofu Bites
*salad · 1 portion · floor 34.9% · live median 42.1%*

- **Increase** `97` Firm tofu (increase existing row) — **120 g/portion** (120 g batch) — existing row `ds16_firmto` 88 g → 208 g

**Method:** Add the tofu cubes — 208 g in total — to a bowl and drizzle them with the olive oil and soy sauce.

**Why:** More of the same tofu the recipe already buys; a second tofu row would put two tofus on the shopping list.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 88 | 7.3 g | 2 g | 6.4 g | 33.2% |
| after | 179 | 17 g | 4.3 g | 12.2 g | **38.0%** ✅ clears floor |

**🍗 Non-veg option note:** *"Not vegetarian? Add chicken breast, cubed — 90 g per portion."* Adds **+108 kcal, +20.3 g protein, +0.0 g carbs, +2.3 g fat** per portion → 51.9% protein.

---

### m183 — 🥤 Matcha Green Smoothie Bowl
*smoothie · 1 portion · floor 29.0% · live median 37.6%*

- **Add** `210` Whey Protein Powder — **30 g/portion** (30 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Blend the banana, spinach, almond milk, matcha powder, almond butter, and the whey protein powder until creamy.

**Why:** Whey blends into a cold base and turns the bowl into a real protein breakfast.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 255 | 6.7 g | 37.4 g | 10.9 g | 10.5% |
| after | 375 | 30.7 g | 39.8 g | 12.1 g | **32.7%** ✅ clears floor |

---

### sm26 — 🥤 Pineapple Coconut Recovery Smoothie
*smoothie · 1 portion · floor 29.0% · live median 37.6%*

- **Add** `47` Greek Yogurt (0% fat) — **150 g/portion** (150 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Stir in the hemp seeds along with the Greek yogurt and pulse 3–4 times for a thicker, protein-rich texture.

**Why:** Adds tang and body that suit a cold recovery smoothie.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 454 | 28.7 g | 27 g | 27.8 g | 25.3% |
| after | 543 | 43.7 g | 32.4 g | 28.4 g | **32.2%** ✅ clears floor |

---

### sm23 — 🥣 Mango Coconut Chia Pudding
*smoothie · 1 portion · floor 29.0% · live median 37.6%*

- **Add** `47` Greek Yogurt (0% fat) — **200 g/portion** (200 g batch) — new `batchItems` row + `INGREDIENT_MACROS` key

**Method:** Swirl in the Greek yogurt before topping with the diced mango.

**Why:** A yogurt swirl fits the chilled pudding format without disturbing the chia set.

| per portion | kcal | protein | carbs | fat | protein % |
|---|---|---|---|---|---|
| now | 462 | 29.4 g | 22 g | 30.3 g | 25.5% |
| after | 580 | 49.4 g | 29.2 g | 31.1 g | **34.1%** ✅ clears floor |

---
