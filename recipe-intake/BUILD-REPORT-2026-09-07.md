# Build report — 2026-09-07 batch

**181 recipes staged in pending release** (5 pre-built from the 09-06 intake + 176 new). Nothing is visible to users until released from the Recipes tab.

| | |
|---|---|
| Mains (m) | 66 |
| Salads / light plates (sn) | 32 |
| Breakfasts (bf) | 34 |
| Desserts / sweet snacks (ds) | 14 |
| Smoothies & juices (sm) | 35 |

## How each was built

- Every ingredient line mapped to a registry row (39 new rows added, ids 371–411, sources in PREBUILD-CHECK); US cups/pieces converted to **grams and millilitres per single portion**; the app scales to batch size.
- Macros **computed from those weights**, never copied from the source. `check-ingredients.mjs` passes: all 401 recipes (old and new) reconcile.
- Allergens detected by the app's own detector from the ingredient list.
- Methods converted to °C; two recipe-specific 💡 tips added to every recipe.
- **Smoothies/juices**: 30 g whey added to each (your decision), stated in the method.
- **Protein normalisation**: where a main was under 30 g or a salad under 25 g, the primary protein source was scaled up (never more than ×2) and the change is stated in the method. Recipes that still fall short are listed below.
- **Replacements** (you chose 'replace ours'): the new recipe is staged; the old one stays live until you release the new one — then tell me and I retire the old id.

## Twins dropped (you said go)

| Dropped | Reason |
|---|---|
| cb196 | twin of cb204 |
| cb239 | twin of cb46 |
| cb174 | same title as cb103 |
| cb19 | cb56 without the banana |
| cb256 | twin of cb220 |
| cb259 | twin of cb219 |
| cb260 | covered by cb252 |
| cb246 | covered by cb252 |
| cb243 | subset of cb267 |
| cb161 | twin of cb130 |
| cb22 | plain base of cb215/cb61 |
| cb186 | plain base of cb215 |
| cb211 | twin of cb188 |
| cb71 | twin of cb128 |

## Still under the protein target after ×2 scaling

These are legume/vegetable dishes with no single scalable protein source. Options per recipe: release as-is (labelled light), add 100 g chicken/tofu, or hold.

| id | Recipe | kcal · P |
|---|---|---|
| m157 | 🍝 Creamy Mushroom & Spinach Pasta | 406 · 16.2 P |
| sn15 | 🫘 Spiced Chickpea Wraps | 582 · 22.9 P |
| m159 | 🧀 Savory Cottage Cheese Bowl | 316 · 28.3 P |
| m162 | 🫘 Curried Chickpea Bowl | 583 · 20.9 P |
| m163 | 🥚 Veggie-Packed Chickpea Pasta | 279 · 13.1 P |
| sn20 | 🫙 Apple Cinnamon Greek Yogurt Dip | 207 · 11.6 P |
| sn21 | 🫙 Savory Yogurt Bowl with Herbs & Cucumber | 113 · 11.2 P |
| m164 | 🦃 Turkey & Vegetable Stuffed Peppers | 237 · 23.1 P |
| m165 | 🌿 Lentil & Sweet Potato Shepherd's Pie | 420 · 21.1 P |
| m166 | 🍝 Creamy Spinach & Mushroom Orzo | 416 · 14.5 P |
| sn22 | 🌿 Mediterranean Lentil Salad with Feta | 327 · 19.6 P |
| m168 | 🥚 Tofu & Veggie Stir-Fry Bowl | 206 · 18.5 P |
| m169 | 🥑 Creamy Avocado Pasta | 455 · 10.8 P |
| sn23 | 🥚 Veggie-Packed Hummus Wrap | 339 · 10.1 P |
| m170 | 🫘 Roasted Chickpea & Avocado Toast | 373 · 12.5 P |
| sn24 | 🍽️ Roasted Pumpkin Seeds with Cinnamon & Honey | 193 · 9.8 P |
| sn25 | 🧀 Roasted Beet & Goat Cheese Salad | 343 · 11.5 P |
| m171 | 🌾 Broccoli & Cheddar Quinoa Bowl | 228 · 9.2 P |
| m172 | 🥚 Roasted Veggie Grain Bowl with Tahini Drizzle | 319 · 11.5 P |
| m173 | 🫘 Moroccan Chickpea Tagine | 360 · 14 P |
| m174 | 🫘 Chickpea & Spinach Coconut Stew | 358 · 13.3 P |
| m176 | 🍽️ Cauliflower Fried Rice | 159 · 11.2 P |
| sn27 | 🫙 Carrot Sticks with Spicy Greek Yogurt Dip | 92 · 6.6 P |
| sn28 | 🍽️ Caprese Skewers | 137 · 12.5 P |
| m178 | 🫘 Baked Falafel Bowl | 307 · 12.1 P |
| m179 | 🍽️ Mediterranean Stuffed Bell Peppers | 277 · 8.8 P |
| m180 | 🥚 Quinoa-Stuffed Eggplant Boats | 249 · 7.3 P |
| m181 | 🥚 Baked Eggplant Parmesan | 197 · 9 P |
| m182 | 🥚 Quinoa & Veggie Stir-Fry | 230 · 7 P |
| m183 | 🥤 Matcha Green Smoothie Bowl | 255 · 6.7 P |
| m184 | 🌿 Lentil & Sweet Potato Bowl | 490 · 26.7 P |
| m185 | 🥚 Lentil Veggie Soup | 413 · 27.2 P |
| m186 | 🍽️ Green Goddess Buddha Bowl | 298 · 10.3 P |
| sn29 | 🫘 Spicy Roasted Chickpeas | 248 · 11.6 P |
| sn30 | 🥚 Savory Egg Muffins | 134 · 11.9 P |
| m188 | 🫘 Chickpea Coconut Curry with Basmati Rice | 784 · 28.1 P |
| m189 | 🌾 Rainbow Grain Salad | 223 · 6.7 P |
| m190 | 🌿 Spicy Lentil Tacos | 97 · 2.3 P |
| sn31 | 🍽️ Edamame with Sea Salt & Lemon | 191 · 17.1 P |
| sn32 | 🫙 Sweet Potato Fries with Greek Yogurt | 128 · 4.4 P |
| sn33 | 🍝 Tomato Basil Orzo Salad | 251 · 5.9 P |
| sn34 | 🫘 Roasted Chickpea Crunch | 197 · 8.5 P |
| m191 | 🍲 Mushroom Barley Soup | 149 · 5.3 P |
| sn35 | 🥚 Mini Veggie Frittatas | 90 · 7.7 P |
| sn37 | 🫘 Cucumber Hummus Roll-Ups | 79 · 3.5 P |
| sn38 | 🥦 Baked Zucchini Fries | 62 · 2.8 P |
| sn39 | 🥚 Veggie Sticks with Spicy Tahini Dip | 100 · 3 P |
| sn40 | 🫘 Cucumber Hummus Cups | 80 · 2.9 P |

## Every recipe (181)

| id | Recipe | Source | Computed kcal · P · C · F | Source claim | Notes | Allergens |
|---|---|---|---|---|---|---|
| m125 | 🥗 Crispy Chicken Caesar Salad | prebuilt | 418 · 54P · 24.3C · 11F | — |  | Dairy, Eggs, Fish, Gluten / Wheat, Mustard |
| m126 | 🥘 Chorizo & Chicken One-Pot Rice | prebuilt | 548 · 42.3P · 50.5C · 18.5F | — |  | Celery |
| m127 | 🐟 Honey Garlic Salmon Tray Bake | prebuilt | 583 · 38.4P · 50.4C · 24.9F | — |  | Fish, Gluten / Wheat, Soy |
| m128 | 🧆 Greek Turkey Meatballs & Tzatziki Rice Bowl | prebuilt | 544 · 41.9P · 54.1C · 17.3F | — |  | Dairy, Gluten / Wheat |
| m129 | 🥬 Spinach & Feta Stuffed Chicken with Roast Sweet Potato | prebuilt | 491 · 49.9P · 40.2C · 14.6F | — |  | Dairy |
| ds10 | 🍪 Strawberry Cheesecake Protein Jars | ig4 | 302 · 28.4P · 28.4C · 8.4F | 270 · 25P |  | Dairy, Gluten / Wheat |
| bf43 | 🍌 Banana Bread Protein Bowl | ig5 | 486 · 37.6P · 59.9C · 10.8F | — | replaces bf34 | Dairy, Eggs, Gluten / Wheat |
| bf44 | 🫙 Protein Berry Yoghurt Bowl | ig7 | 345 · 39.3P · 32.6C · 6F | 300 · 35P | replaces bf8 | Dairy |
| m131 | 🍗 Garlic Chicken, Crispy Potatoes & Broccoli | ig8 | 606 · 51.6P · 65.3C · 15.9F | 600 · 55P | replaces m57 |  |
| ds11 | 🍪 Protein Brownies | ig12 | 112 · 11.8P · 11.1C · 2.3F | 99 · 11P | replaces d5 | Dairy, Eggs, Gluten / Wheat |
| m132 | 🍗 Thai Peanut Chicken Rice Bowl | cb128 | 513 · 47P · 35.3C · 20.6F | 490 · 38P |  | Gluten / Wheat, Peanuts, Soy |
| m133 | 🍗 Turmeric Chicken with Coconut Rice | cb150 | 517 · 30P · 40C · 26.2F | 410 · 29P | protein scaled: Chicken thighs 110 → 132 g; protein 30.0 g — no scalable source |  |
| m134 | 🍗 Chicken Caesar Wrap | cb95 | 479 · 53.4P · 31.7C · 14F | 330 · 32P |  | Dairy, Fish, Gluten / Wheat |
| m135 | 🍗 Balsamic Glazed Chicken with Roasted Veggies | cb129 | 354 · 41.1P · 18.8C · 12F | 380 · 40P |  | Sulphites |
| m136 | 🍗 Balsamic Chicken with Roasted Sweetpotatoes | cb147 | 359 · 40P · 21.4C · 11.5F | 390 · 36P |  | Sulphites |
| m137 | 🍗 Baked Herb Chicken with Roasted Brussels Sprouts | cb138 | 339 · 30P · 4.8C · 23F | 380 · 35P | protein scaled: Chicken thighs 110 → 144 g |  |
| m138 | 🍗 Mediterranean Chicken Skillet with Olives & Spinach | cb118 | 319 · 39.4P · 3.5C · 15.5F | 380 · 42P |  |  |
| m139 | 🐟 Miso Ginger Salmon with Brown Rice | cb133 | 490 · 34.9P · 31.9C · 23.3F | 420 · 37P |  | Fish, Gluten / Wheat, Sesame, Soy |
| m140 | 🐟 Lemon Herb Grilled Salmon with Quinoa & Steamed Greens | cb116 | 496 · 34.7P · 22.5C · 28.4F | 410 · 36P |  | Fish |
| m141 | 🐟 Honey Mustard Salmon with Greens | cb88 | 366 · 32P · 6.8C · 22.3F | 330 · 32P |  | Fish, Mustard |
| m142 | 🐟 Baked Lemon Dill Cod with Garlic Green Beans | cb121 | 230 · 30P · 10C · 8.2F | 290 · 34P | protein scaled: Cod fillets 150 → 154 g; protein 30.0 g — no scalable source | Fish |
| m143 | 🐟 One-Pan Lemon Garlic Tilapia with Asparagus | cb136 | 244 · 33.3P · 8.1C · 9.8F | 310 · 36P |  | Fish |
| m144 | 🍗 Greek Chicken Pita Pockets | cb75 | 320 · 30.6P · 38.4C · 4F | 365 · 29P |  | Dairy, Gluten / Wheat |
| m145 | 🐟 Garlic Butter Cod with Spinach | cb163 | 204 · 29.9P · 1.8C · 8.2F | 320 · 33P | protein scaled: Cod fillets 150 → 163 g | Dairy, Fish |
| m146 | 🍗 Pesto Chicken Pasta Salad | cb81 | 447 · 30.7P · 41.7C · 17.3F | 420 · 30P |  | Gluten / Wheat |
| m147 | 🐟 Zesty Lemon Herb Cod | cb154 | 202 · 30P · 1.1C · 8.2F | 310 · 36P | protein scaled: Cod fillets 150 → 166 g | Fish |
| sm10 | 🥤 Energizing Chocolate-Mint Protein Shake | cb232 | 210 · 26.1P · 19.8C · 3.1F | 190 · 22P |  | Dairy, Tree Nuts |
| m148 | 🦃 Turkey & Zucchini Meatballs | cb157 | 251 · 29.9P · 5.8C · 11.9F | 280 · 33P | protein scaled: Ground turkey 113 → 141 g | Eggs, Gluten / Wheat |
| bf45 | 🫙 Walnut & Berry Greek Yogurt Bowl | cb59 | 268 · 23.5P · 20.8C · 9.7F | 240 · 17P |  | Dairy, Tree Nuts |
| ds12 | 🍪 Chocolate Protein Mug Cake | cb204 | 202 · 25.7P · 20.6C · 2.2F | 210 · 20P |  | Dairy, Gluten / Wheat, Tree Nuts |
| m149 | 🦐 Garlic Herb Shrimp Pasta | cb145 | 442 · 30P · 60.5C · 9.7F | 400 · 32P | protein scaled: Shrimp 75 → 89 g | Crustaceans, Gluten / Wheat |
| bf46 | 🥚 Veggie-Packed Breakfast Scramble | cb26 | 214 · 19.6P · 5.5C · 12.2F | 260 · 23P |  | Dairy, Eggs |
| m150 | 🍗 Grilled Chicken & Quinoa Salad | cb66 | 339 · 30P · 22.8C · 13.7F | 370 · 29P | protein scaled: Chicken breast 85 → 108 g | Sulphites |
| sn10 | 🦃 Spiced Turkey Lettuce Cups | cb112 | 272 · 24.9P · 5.1C · 17.2F | 280 · 26P | protein scaled: Lean ground turkey 113 → 122 g; protein 24.9 g — no scalable source | Gluten / Wheat, Soy |
| m151 | 🌯 Caprese Pesto Sandwich | cb92 | 477 · 30P · 44.4C · 20.9F | 390 · 17P | protein scaled: Fresh mozzarella 57 → 84 g | Dairy, Gluten / Wheat, Sulphites |
| m152 | 🦐 Lemon-Garlic Shrimp with Zoodles | cb93 | 216 · 29.9P · 8.4C · 8.3F | 230 · 30P | protein scaled: Shrimp 113 → 137 g | Crustaceans, Gluten / Wheat |
| m153 | 🦃 Spiced Turkey & Veggie Skillet | cb142 | 323 · 30P · 6.4C · 19.7F | 340 · 33P | protein scaled: Ground turkey 113 → 153 g |  |
| sn11 | 🦐 Citrus Shrimp Salad | cb106 | 175 · 24.9P · 8.4C · 5.8F | 260 · 29P | protein scaled: Shrimp 113 → 117 g; protein 24.9 g — no scalable source | Crustaceans |
| m154 | 🦃 Turkey Veggie Stir-Fry | cb74 | 276 · 30.1P · 6.2C · 14.5F | 360 · 34P | protein scaled: Lean ground turkey 100 → 148 g | Gluten / Wheat, Sesame, Soy |
| sn12 | 🥚 Avocado Egg Salad Wrap | cb70 | 455 · 25P · 33.5C · 24.5F | 350 · 20P | protein scaled: Boiled eggs 120 → 152 g; protein 25.0 g — no scalable source | Dairy, Eggs, Gluten / Wheat |
| bf47 | 🫙 Peach Chia Yogurt Bowl | cb53 | 251 · 19P · 22.9C · 9.7F | 235 · 15P |  | Dairy, Tree Nuts |
| sn13 | 🍗 Harvest Chicken Salad | cb84 | 280 · 25.1P · 17.6C · 12.5F | 365 · 28P | protein scaled: Chicken breast 85 → 104 g | Sulphites, Tree Nuts |
| bf48 | 🫙 Lemon Poppy Seed Greek Yogurt Bowl | cb35 | 239 · 19.1P · 21.4C · 8.7F | 245 · 17P |  | Dairy, Tree Nuts |
| sn14 | 🍗 Asian-Inspired Chicken Lettuce Wraps | cb97 | 252 · 25P · 9C · 13.3F | 280 · 28P | protein scaled: Ground chicken 112 → 131 g | Gluten / Wheat, Sesame, Soy |
| sm11 | 🥤 Strawberry–Almond Glow Shake | cb231 | 391 · 40.8P · 25.3C · 14.6F | 260 · 12P |  | Dairy, Tree Nuts |
| m155 | 🦐 Shrimp & Veggie Rice Bowl | cb79 | 257 · 29.9P · 27C · 3.9F | 380 · 30P | protein scaled: Shrimp 75 → 130 g | Crustaceans, Gluten / Wheat, Soy |
| bf49 | 🧀 Mushroom & Goat Cheese Scramble | cb41 | 261 · 17.3P · 1.4C · 20.4F | 260 · 15P |  | Dairy, Eggs |
| bf50 | 🫙 Strawberry Chia Parfait | cb16 | 253 · 16.3P · 23.1C · 10.6F | 260 · 14P |  | Dairy, Tree Nuts |
| bf51 | 🍽️ Savory Tomato & Basil Scramble | cb62 | 202 · 15.7P · 3.2C · 13.7F | 230 · 14P |  | Eggs |
| m156 | 🦐 Garlic Butter Shrimp with Zucchini Noodles | cb126 | 206 · 29.9P · 9C · 7F | 280 · 31P | protein scaled: Shrimp 75 → 136 g | Crustaceans, Dairy, Gluten / Wheat |
| bf52 | 🥚 Savory Oatmeal with Spinach & Poached Egg | cb38 | 275 · 17.2P · 29.9C · 9.5F | 310 · 16P |  | Celery, Dairy, Eggs, Gluten / Wheat, Sulphites |
| m157 | 🍝 Creamy Mushroom & Spinach Pasta | cb123 | 406 · 16.2P · 61.1C · 11.5F | 390 · 15P | protein 16.2 g — no scalable source | Dairy, Gluten / Wheat, Tree Nuts |
| sn15 | 🫘 Spiced Chickpea Wraps | cb80 | 582 · 22.9P · 85.1C · 17.8F | 365 · 15P | protein scaled: Chickpeas 120 → 240 g; protein 22.9 g — no scalable source | Dairy, Gluten / Wheat |
| bf53 | 🌯 Savory Mushroom Breakfast Wrap | cb52 | 298 · 15.2P · 33.4C · 11.7F | 290 · 14P |  | Eggs, Gluten / Wheat, Sesame |
| m158 | 🍗 Hearty Chicken Vegetable Soup | cb77 | 225 · 30P · 7.1C · 8.1F | 260 · 27P | protein scaled: Cooked chicken breast 46.5 → 88 g | Celery |
| m159 | 🧀 Savory Cottage Cheese Bowl | cb103 | 316 · 28.3P · 15.6C · 15.9F | 210 · 20P | protein scaled: Low-fat cottage cheese 112 → 224 g; protein 28.3 g — no scalable source | Dairy |
| sn16 | 🥚 Grilled Veggie & Halloumi Salad | cb104 | 405 · 25P · 7.8C · 30.9F | 280 · 16P | protein scaled: Halloumi cheese 57 → 104 g; protein 25.0 g — no scalable source | Dairy, Sulphites |
| bf54 | 🥚 Avocado Egg Toast with Microgreens | cb15 | 307 · 14.5P · 24C · 18.3F | 290 · 12P |  | Eggs, Gluten / Wheat |
| m160 | 🐟 Creamy Tuna & Spinach Pasta | cb73 | 441 · 44.6P · 42.2C · 10.6F | 430 · 32P |  | Dairy, Fish, Gluten / Wheat |
| sn17 | 🧀 Strawberry Cottage Cheese Bowl | cb182 | 221 · 25P · 15.3C · 6.2F | 160 · 14P | protein scaled: Low-fat cottage cheese 112 → 201 g; protein 25.0 g — no scalable source | Dairy |
| sn18 | 🧀 Cottage Cheese Berry Bowl | cb213 | 227 · 25P · 16.9C · 6.3F | 145 · 12P | protein scaled: Cottage cheese 112 → 201 g; protein 25.0 g — no scalable source | Dairy |
| bf55 | 🥚 Creamy Avocado Toast with Soft-Boiled Egg | cb55 | 344 · 14.3P · 23.6C · 22.8F | 280 · 9P |  | Eggs, Gluten / Wheat |
| ds13 | 🫙 Greek Yogurt Parfait with Berries & Flax | cb169 | 162 · 14.2P · 17.4C · 4.6F | 180 · 14P |  | Dairy |
| bf56 | 🫙 Tropical Sunrise Parfait | cb36 | 206 · 12.8P · 23.1C · 7F | 260 · 13P |  | Dairy, Gluten / Wheat, Tree Nuts |
| bf57 | 🥞 Lemon Ricotta Pancakes | cb45 | 287 · 13.5P · 37.8C · 8.5F | 295 · 14P |  | Dairy, Eggs, Gluten / Wheat, Tree Nuts |
| m161 | 🦐 Coconut Curry Shrimp | cb158 | 239 · 29.9P · 4.6C · 12.1F | 340 · 29P | protein scaled: Shrimp 75 → 146 g | Crustaceans |
| ds14 | 🫙 Apple Cinnamon Yogurt Parfait | cb199 | 220 · 12.5P · 31.3C · 5.6F | 210 · 12P |  | Dairy, Gluten / Wheat, Tree Nuts |
| sn19 | 🧀 Cottage Cheese & Pineapple Cups | cb195 | 207 · 25P · 13.6C · 5.2F | 140 · 13P | protein scaled: Low-fat cottage cheese 112 → 207 g | Dairy |
| bf58 | 🌾 Peanut Butter Banana Overnight Oats | cb49 | 358 · 13.5P · 48.7C · 14F | 180 · 10P |  | Dairy, Gluten / Wheat, Peanuts, Tree Nuts |
| m162 | 🫘 Curried Chickpea Bowl | cb113 | 583 · 20.9P · 81.5C · 21.3F | 390 · 12P | protein scaled: Chickpeas 120 → 240 g; protein 20.9 g — no scalable source |  |
| m163 | 🥚 Veggie-Packed Chickpea Pasta | cb164 | 279 · 13.1P · 34.7C · 10.3F | 370 · 22P | protein 13.1 g — no scalable source | Dairy, Gluten / Wheat |
| sn20 | 🫙 Apple Cinnamon Greek Yogurt Dip | cb171 | 207 · 11.6P · 36.8C · 2.7F | 160 · 11P | protein 11.6 g — no scalable source | Dairy |
| sn21 | 🫙 Savory Yogurt Bowl with Herbs & Cucumber | cb190 | 113 · 11.2P · 5.8C · 4.5F | 140 · 10P | protein 11.2 g — no scalable source | Dairy |
| bf59 | 🧀 Strawberry Cottage Cheese Toast | cb48 | 176 · 12.3P · 24.8C · 3.2F | 180 · 10P |  | Dairy, Gluten / Wheat |
| m164 | 🦃 Turkey & Vegetable Stuffed Peppers | cb122 | 237 · 23.1P · 11.5C · 10.7F | 260 · 25P | protein scaled: Ground turkey 57 → 114 g; protein 23.1 g — no scalable source |  |
| m165 | 🌿 Lentil & Sweet Potato Shepherd's Pie | cb130 | 420 · 21.1P · 68.9C · 8F | 330 · 15P | protein scaled: Cooked lentils 99 → 198 g; protein 21.1 g — no scalable source | Celery |
| bf60 | 🌾 Banana Almond Butter Overnight Oats | cb56 | 339 · 11.8P · 45.8C · 13.3F | 340 · 10P |  | Dairy, Gluten / Wheat, Tree Nuts |
| bf61 | 🌾 Banana-Oat-Pancakes | cb18 | 238 · 11.6P · 27.7C · 9.6F | 310 · 14P |  | Eggs, Gluten / Wheat, Tree Nuts |
| m166 | 🍝 Creamy Spinach & Mushroom Orzo | cb149 | 416 · 14.5P · 64.5C · 10.6F | 340 · 13P | protein 14.5 g — no scalable source | Dairy, Gluten / Wheat, Tree Nuts |
| sn22 | 🌿 Mediterranean Lentil Salad with Feta | cb141 | 327 · 19.6P · 42.7C · 9.9F | 2906 · 15P | protein scaled: Cooked lentils 99 → 198 g; protein 19.6 g — no scalable source | Dairy |
| m167 | 🌿 Creamy Coconut Lentil Curry | cb144 | 574 · 29.9P · 76.3C · 16.7F | 360 · 17P | protein scaled: Red lentils 95 → 111 g | Celery |
| m168 | 🥚 Tofu & Veggie Stir-Fry Bowl | cb76 | 206 · 18.5P · 10.4C · 12.2F | 320 · 20P | protein scaled: Firm tofu 100 → 200 g; protein 18.5 g — no scalable source | Gluten / Wheat, Sesame, Soy |
| m169 | 🥑 Creamy Avocado Pasta | cb87 | 455 · 10.8P · 46.6C · 27.1F | 420 · 11P | protein 10.8 g — no scalable source | Dairy, Gluten / Wheat |
| sn23 | 🥚 Veggie-Packed Hummus Wrap | cb101 | 339 · 10.1P · 44.9C · 14.6F | 320 · 9P | protein 10.1 g — no scalable source | Gluten / Wheat, Sesame |
| bf62 | 🌯 Sweet Almond Toast with Ricotta & Honey | cb33 | 217 · 10.2P · 26.5C · 8.3F | 230 · 9P |  | Dairy, Gluten / Wheat, Tree Nuts |
| m170 | 🫘 Roasted Chickpea & Avocado Toast | cb100 | 373 · 12.5P · 42.3C · 19.2F | 290 · 8P | protein scaled: Roasted chickpeas 41.0 → 82 g; protein 12.5 g — no scalable source | Gluten / Wheat |
| sn24 | 🍽️ Roasted Pumpkin Seeds with Cinnamon & Honey | cb181 | 193 · 9.8P · 6.6C · 16F | 170 · 9P | protein 9.8 g — no scalable source |  |
| bf63 | 🌾 Brain-Boosting Berry Oatmeal | cb31 | 246 · 9.4P · 39C · 6.6F | 300 · 10P |  | Gluten / Wheat, Tree Nuts |
| bf64 | 🥚 Spinach & Feta Egg Muffins | cb21 | 115 · 9.2P · 1.5C · 7.7F | 95 · 7P |  | Dairy, Eggs, Gluten / Wheat |
| sm12 | 🥤 Raspberry Almond Dream Smoothie | cb240 | 301 · 33.1P · 21.8C · 8.8F | 220 · 10P |  | Dairy, Gluten / Wheat, Tree Nuts |
| sn25 | 🧀 Roasted Beet & Goat Cheese Salad | cb96 | 343 · 11.5P · 18C · 26.3F | 280 · 9P | protein scaled: Goat cheese 17.5 → 35.0 g; protein 11.5 g — no scalable source | Dairy, Sulphites, Tree Nuts |
| bf65 | 🌾 Coconut Mango Overnight Oats | cb40 | 327 · 9.2P · 42.4C · 14.7F | 285 · 8P |  | Gluten / Wheat |
| m171 | 🌾 Broccoli & Cheddar Quinoa Bowl | cb111 | 228 · 9.2P · 23.5C · 11.3F | 310 · 13P | protein 9.2 g — no scalable source | Dairy |
| m172 | 🥚 Roasted Veggie Grain Bowl with Tahini Drizzle | cb151 | 319 · 11.5P · 52.6C · 7.3F | 360 · 12P | protein scaled: Roasted chickpeas 41.0 → 82 g; protein 11.5 g — no scalable source | Gluten / Wheat, Sesame |
| bf66 | 🌾 Honey Nut Quinoa Breakfast Bowl | cb27 | 284 · 8.5P · 46.1C · 8.2F | 295 · 9P |  | Tree Nuts |
| sm13 | 🥤 Strawberry Kiwi Glow Smoothie | cb250 | 258 · 31.6P · 25.1C · 3.8F | 150 · 7P |  | Dairy, Tree Nuts |
| m173 | 🫘 Moroccan Chickpea Tagine | cb137 | 360 · 14P · 53.7C · 11.5F | 320 · 12P | protein scaled: Chickpeas 82 → 164 g; protein 14.0 g — no scalable source | Celery, Gluten / Wheat |
| ds15 | 🫙 Peanut Butter Yogurt Dip with Fruit | cb206 | 102 · 7.5P · 6.8C · 5.2F | 190 · 10P |  | Dairy, Peanuts |
| sm14 | 🥤 Strawberry Peach Silk Smoothie | cb219 | 246 · 31.4P · 22.7C · 3.6F | 185 · 7P |  | Dairy, Tree Nuts |
| sm15 | 🥤 Mango Kale Energy Smoothie | cb263 | 253 · 32.4P · 24.5C · 3.2F | 170 · 6P |  | Dairy |
| sm16 | 🥤 Cucumber Mint Refresh Smoothie | cb265 | 199 · 30.9P · 12.1C · 2.7F | 90 · 6P |  | Dairy |
| sm17 | 🥤 Blueberry Coconut Bliss Smoothie | cb254 | 262 · 31.2P · 28C · 2.9F | 160 · 6P |  | Dairy |
| sm18 | 🥤 Peach Raspberry Protein Smoothie | cb264 | 169 · 19.3P · 16.8C · 3F | 200 · 18P |  | Dairy, Tree Nuts |
| sm19 | 🥤 Berry Banana Bliss Smoothie | cb267 | 242 · 31.1P · 21.5C · 3.5F | 160 · 7P |  | Dairy, Tree Nuts |
| sn26 | 🌿 Savory Mushroom Lentil Stew | cb165 | 376 · 25.1P · 61.8C · 3.4F | 290 · 16P | protein scaled: Dry brown lentils 47.5 → 82 g | Celery |
| sm20 | 🥤 Peach Mango Immunity Smoothie | cb247 | 280 · 31.4P · 33C · 3F | 190 · 7P |  | Dairy |
| m174 | 🫘 Chickpea & Spinach Coconut Stew | cb155 | 358 · 13.3P · 44.6C · 15.6F | 370 · 14P | protein scaled: Chickpeas 82 → 164 g; protein 13.3 g — no scalable source |  |
| m175 | 🌿 Lentil & Vegetable Stew | cb125 | 472 · 30.1P · 75C · 5.9F | 320 · 19P | protein scaled: Dried lentils 63 → 110 g | Celery |
| sm21 | 🥤 Sweet Peach & Oat Breakfast Smoothie | cb234 | 368 · 30.9P · 53.9C · 4.9F | 230 · 5P |  | Dairy, Gluten / Wheat, Tree Nuts |
| m176 | 🍽️ Cauliflower Fried Rice | cb143 | 159 · 11.2P · 9.9C · 8.5F | 210 · 10P | protein scaled: Egg 30.0 → 60 g; protein 11.2 g — no scalable source | Eggs, Gluten / Wheat, Sesame, Soy |
| sn27 | 🫙 Carrot Sticks with Spicy Greek Yogurt Dip | cb193 | 92 · 6.6P · 13.4C · 1.5F | 90 · 6P | protein 6.6 g — no scalable source | Dairy |
| m177 | 🐟 Tuna & Avocado Open Sandwich | cb83 | 296 · 37.2P · 20.2C · 8.1F | 340 · 30P |  | Dairy, Fish, Gluten / Wheat |
| sn28 | 🍽️ Caprese Skewers | cb185 | 137 · 12.5P · 2.6C · 8.9F | 160 · 8P | protein scaled: Mini mozzarella balls 30.0 → 60 g; protein 12.5 g — no scalable source | Dairy, Sulphites |
| ds16 | 🌱 Crispy Air-Fried Tofu Bites | cb192 | 88 · 7.3P · 2C · 6.4F | 160 · 13P |  | Gluten / Wheat, Soy |
| m178 | 🫘 Baked Falafel Bowl | cb107 | 307 · 12.1P · 41.4C · 11.3F | 310 · 12P | protein scaled: Canned chickpeas 82 → 164 g; protein 12.1 g — no scalable source | Dairy, Gluten / Wheat, Sesame |
| m179 | 🍽️ Mediterranean Stuffed Bell Peppers | cb148 | 277 · 8.8P · 31.5C · 13.2F | 310 · 11P | protein scaled: Feta cheese 9.5 → 19.0 g; protein 8.8 g — no scalable source | Dairy |
| m180 | 🥚 Quinoa-Stuffed Eggplant Boats | cb139 | 249 · 7.3P · 37.7C · 9.4F | 330 · 11P | protein 7.3 g — no scalable source |  |
| m181 | 🥚 Baked Eggplant Parmesan | cb159 | 197 · 9P · 19.9C · 10.7F | 310 · 12P | protein scaled: Shredded mozzarella 14.0 → 28.0 g; protein 9.0 g — no scalable source | Dairy, Gluten / Wheat |
| bf67 | 🍪 Blueberry Almond Breakfast Muffins | cb28 | 185 · 6.7P · 17.2C · 11.3F | 180 · 6P |  | Eggs, Gluten / Wheat, Tree Nuts |
| m182 | 🥚 Quinoa & Veggie Stir-Fry | cb134 | 230 · 7P · 28C · 9.8F | 300 · 11P | protein 7.0 g — no scalable source | Gluten / Wheat, Sesame, Soy |
| m183 | 🥤 Matcha Green Smoothie Bowl | cb63 | 255 · 6.7P · 37.4C · 10.9F | 290 · 7P | protein 6.7 g — no scalable source | Gluten / Wheat, Tree Nuts |
| m184 | 🌿 Lentil & Sweet Potato Bowl | cb82 | 490 · 26.7P · 78C · 8.4F | 370 · 15P | protein scaled: Dried lentils 47.5 → 95 g; protein 26.7 g — no scalable source |  |
| bf68 | 🥤 Green Apple & Cinnamon Smoothie | cb39 | 214 · 3.6P · 50.2C · 2.4F | 210 · 5P |  | Tree Nuts |
| m185 | 🥚 Lentil Veggie Soup | cb90 | 413 · 27.2P · 68.1C · 3.4F | 250 · 14P | protein scaled: Dry lentils 47.5 → 95 g; protein 27.2 g — no scalable source | Celery |
| m186 | 🍽️ Green Goddess Buddha Bowl | cb72 | 298 · 10.3P · 34.1C · 15.1F | 390 · 16P | protein 10.3 g — no scalable source | Gluten / Wheat, Sesame, Soy |
| sn29 | 🫘 Spicy Roasted Chickpeas | cb170 | 248 · 11.6P · 38C · 6.4F | 190 · 9P | protein scaled: Canned chickpeas 82 → 164 g; protein 11.6 g — no scalable source |  |
| sn30 | 🥚 Savory Egg Muffins | cb214 | 134 · 11.9P · 0.7C · 8.9F | 95 · 7P | protein scaled: Eggs 45.0 → 90 g; protein 11.9 g — no scalable source | Dairy, Eggs, Gluten / Wheat |
| sm22 | 🥤 Berry–Spinach Beauty Shake | cb230 | 340 · 29.8P · 43.1C · 7F | 200 · 4P |  | Dairy, Tree Nuts |
| bf69 | 🍎 Warm Quinoa Breakfast Bowl with Cinnamon Apples | cb54 | 238 · 6P · 43C · 5.8F | 310 · 9P |  | Tree Nuts |
| m187 | 🐟 Mediterranean Tuna Quinoa Bowl | cb91 | 371 · 30P · 28.3C · 16.3F | 370 · 32P | protein scaled: Tuna (canned in water) 82 → 96 g | Fish |
| sm23 | 🥣 Mango Coconut Chia Pudding | cb215 | 462 · 29.4P · 22C · 30.3F | 220 · 4P |  | Dairy |
| bf70 | 🌾 Strawberry Almond Baked Oatmeal Cups | cb42 | 156 · 5.3P · 27C · 3.4F | 140 · 4P |  | Eggs, Gluten / Wheat, Tree Nuts |
| m188 | 🫘 Chickpea Coconut Curry with Basmati Rice | cb117 | 784 · 28.1P · 119.5C · 24.2F | 430 · 14P | protein scaled: Chickpeas (canned, drained) 153 → 306 g; protein 28.1 g — no scalable source |  |
| m189 | 🌾 Rainbow Grain Salad | cb78 | 223 · 6.7P · 27.6C · 9.9F | 345 · 14P | protein 6.7 g — no scalable source | Gluten / Wheat, Soy, Sulphites |
| ds17 | 🍎 Apple Peanut Butter "Nachos" | cb194 | 216 · 5.3P · 29.5C · 10.9F | 210 · 5P |  | Peanuts, Tree Nuts |
| bf71 | 🍪 Apple Cinnamon Protein Muffins | cb44 | 141 · 8.9P · 19C · 3.5F | 145 · 9P |  | Eggs, Gluten / Wheat |
| sm24 | 🥤 Green Goddess Spinach Smoothie | cb261 | 305 · 28.9P · 17.3C · 15.3F | 160 · 4P |  | Dairy |
| bf72 | 🧀 Sweet Potato Hash with Spinach & Feta | cb60 | 206 · 4.9P · 22.4C · 11.2F | 270 · 8P |  | Dairy |
| m190 | 🌿 Spicy Lentil Tacos | cb105 | 97 · 2.3P · 16C · 3.4F | 280 · 14P | protein 2.3 g — no scalable source | Gluten / Wheat |
| sn31 | 🍽️ Edamame with Sea Salt & Lemon | cb178 | 191 · 17.1P · 14.7C · 8.1F | 180 · 17P | protein 17.1 g — no scalable source | Soy |
| sm25 | 🥤 Kiwi Spinach Rejuvenation Smoothie | cb238 | 313 · 27.4P · 26.3C · 12.1F | 190 · 3P |  | Dairy |
| sn32 | 🫙 Sweet Potato Fries with Greek Yogurt | cb177 | 128 · 4.4P · 21.3C · 2.9F | 190 · 5P | protein 4.4 g — no scalable source | Dairy |
| sn33 | 🍝 Tomato Basil Orzo Salad | cb98 | 251 · 5.9P · 39C · 7.8F | 310 · 9P | protein 5.9 g — no scalable source | Gluten / Wheat, Sulphites |
| sn34 | 🫘 Roasted Chickpea Crunch | cb205 | 197 · 8.5P · 27.8C · 6.4F | 150 · 6P | protein scaled: Chickpeas 60 → 120 g; protein 8.5 g — no scalable source |  |
| sm26 | 🥤 Pineapple Coconut Recovery Smoothie | cb242 | 454 · 28.7P · 27C · 27.8F | 280 · 5P |  | Dairy |
| m191 | 🍲 Mushroom Barley Soup | cb108 | 149 · 5.3P · 27C · 2.7F | 240 · 9P | protein 5.3 g — no scalable source | Celery, Gluten / Wheat |
| sn35 | 🥚 Mini Veggie Frittatas | cb179 | 90 · 7.7P · 0.9C · 5.8F | 120 · 10P | protein scaled: Eggs 30.0 → 60 g; protein 7.7 g — no scalable source | Dairy, Eggs, Gluten / Wheat |
| bf73 | 🥤 Mango Coconut Smoothie Bowl | cb24 | 302 · 16.1P · 35.4C · 11.9F | 320 · 14P |  | Gluten / Wheat, Tree Nuts |
| ds18 | 🫐 Dark Chocolate-Dipped Strawberries | cb191 | 95 · 1.3P · 9.2C · 6.1F | 110 · 1P |  |  |
| bf74 | 🥤 Mango Turmeric Smoothie | cb46 | 211 · 3.7P · 50.6C · 1.4F | 190 · 2P |  |  |
| ds19 | 🌾 Oatmeal Raisin Protein Cookies | cb175 | 185 · 15.6P · 26.8C · 2.1F | 150 · 9P | replaces d1 | Gluten / Wheat, Tree Nuts |
| sn36 | 🫘 Greek Chickpea Salad Bowl | cb86 | 595 · 25P · 82.1C · 20.9F | 330 · 12P | protein scaled: Chickpeas (canned, drained) 153 → 306 g; protein 25.0 g — no scalable source | Dairy |
| sn37 | 🫘 Cucumber Hummus Roll-Ups | cb201 | 79 · 3.5P · 9.8C · 3.7F | 85 · 3P | protein 3.5 g — no scalable source | Gluten / Wheat, Sesame |
| sm27 | 🥤 Radiant Carrot-Orange Glow Smoothie | cb228 | 363 · 27.6P · 61.5C · 2.2F | 160 · 2P |  | Dairy |
| sm28 | 🥤 Blueberry–Lavender Calm Smoothie | cb237 | 294 · 27.1P · 40.6C · 3.5F | 160 · 3P |  | Dairy, Tree Nuts |
| sn38 | 🥦 Baked Zucchini Fries | cb183 | 62 · 2.8P · 5.6C · 3.5F | 120 · 5P | protein 2.8 g — no scalable source | Dairy, Gluten / Wheat |
| sm29 | 🥤 Avocado Spinach Metabolism Smoothie | cb221 | 279 · 27.4P · 23C · 9.9F | 240 · 5P |  | Dairy, Tree Nuts |
| sm30 | 🥤 Peach Almond Milkshake Smoothie | cb253 | 245 · 27.4P · 20.8C · 6.8F | 200 · 5P |  | Dairy, Tree Nuts |
| bf75 | 🫙 Coconut Yogurt Parfait with Tropical Fruit | cb57 | 275 · 3.3P · 32.4C · 14.8F | 290 · 5P |  | Dairy, Gluten / Wheat, Tree Nuts |
| ds20 | 🍪 Peanut Butter Banana Rice Cakes | cb173 | 108 · 3P · 15.9C · 4.3F | 190 · 6P |  | Peanuts |
| sn39 | 🥚 Veggie Sticks with Spicy Tahini Dip | cb209 | 100 · 3P · 5.6C · 8.2F | 145 · 4P | protein 3.0 g — no scalable source | Sesame |
| sn40 | 🫘 Cucumber Hummus Cups | cb168 | 80 · 2.9P · 8.6C · 4.6F | 120 · 4P | protein 2.9 g — no scalable source | Sesame |
| ds21 | 🌾 Banana Almond Oat Cookies | cb210 | 98 · 2.9P · 16.5C · 3F | 95 · 3P |  | Gluten / Wheat, Tree Nuts |
| sm31 | 🥤 Blueberry Almond Radiance Smoothie | cb223 | 233 · 26.9P · 16.4C · 6.7F | 210 · 4P |  | Dairy, Tree Nuts |
| bf76 | 🥣 Peach Chia Breakfast Pudding | cb61 | 98 · 2.9P · 13.1C · 4.2F | 190 · 5P |  | Dairy, Tree Nuts |
| sn41 | 🐟 Avocado Tuna Salad Cups | cb188 | 171 · 24.9P · 5.5C · 6.5F | 180 · 16P | protein scaled: Tuna in water 60 → 92 g; protein 24.9 g — no scalable source | Fish |
| sm32 | 🧃 Citrus–Ginger Immunity Juice | cb236 | 211 · 25.8P · 25.5C · 1.5F | 110 · 2P |  | Dairy |
| sm33 | 🥤 Tropical Mango Spinach Smoothie | cb252 | 230 · 26.6P · 27.2C · 2.5F | 160 · 3P |  | Dairy, Gluten / Wheat |
| ds22 | 🍪 Spiced Almond Energy Bites | cb197 | 154 · 3.5P · 18.1C · 8.8F | 115 · 3P |  | Gluten / Wheat, Tree Nuts |
| sm34 | 🥤 Peach Vanilla Sunshine Smoothie | cb226 | 237 · 26.4P · 29C · 2.6F | 175 · 2P |  | Dairy, Tree Nuts |
| sm35 | 🥤 Kiwi Cucumber Hydration Smoothie | cb255 | 210 · 26.2P · 23.7C · 1.9F | 80 · 1P |  | Dairy |
| ds23 | 🍽️ Coconut Matcha Bliss Balls | cb207 | 107 · 2.6P · 12.3C · 5.7F | 105 · 3P |  | Gluten / Wheat, Tree Nuts |
| sm36 | 🧃 Pineapple–Cucumber Skin-Refreshing Juice | cb233 | 225 · 25.9P · 29.3C · 1.5F | 90 · 1P |  | Dairy |
| sm37 | 🧃 Green Apple Celery Detox Juice | cb244 | 234 · 25.4P · 32.3C · 1.7F | 110 · 2P |  | Celery, Dairy, Gluten / Wheat |
| sm38 | 🥤 Blueberry Lemon Antioxidant Smoothie | cb262 | 209 · 25.6P · 22.2C · 2.4F | 150 · 3P |  | Dairy, Tree Nuts |
| sm39 | 🧃 Citrus Mint Energy Juice | cb225 | 165 · 25.2P · 13.8C · 1.4F | 60 · 1P |  | Dairy |
| sm40 | 🥤 Tropical Berry Immunity Smoothie | cb257 | 201 · 25.8P · 18.4C · 2.9F | 180 · 4P |  | Dairy, Tree Nuts |
| sm41 | 🧃 Orange Carrot Immunity Booster Juice | cb251 | 176 · 25.1P · 16C · 1.4F | 90 · 1P |  | Dairy |
| sm42 | 🥤 Pineapple Ginger Refresh Smoothie | cb220 | 191 · 24.8P · 20.9C · 1.4F | 120 · 1P |  | Dairy |
| sm43 | 🍽️ Cucumber Melon Refresher | cb241 | 161 · 25.1P · 12.6C · 1.4F | 70 · 1P |  | Dairy |
| sm44 | 🧃 Apple Ginger Immunity Juice | cb227 | 172 · 24.4P · 16.3C · 1.4F | 90 · 0P |  | Dairy |