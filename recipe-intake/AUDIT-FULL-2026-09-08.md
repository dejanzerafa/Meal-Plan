# Full recipe audit — 2026-09-08

Every recipe in the app: **401** (171 live, 230 staged). This is a fresh pass, not a re-run — the 2026-09-07 findings are now assertions in the regression suite and pass by construction. `*` marks a staged recipe.

Nothing here has been changed.

## Summary

| Finding | Recipes |
|---|---|
| main course under 300 kcal | 29 |
| very high fat share | 19 |
| main course that barely fills a plate | 14 |
| three or more high-sodium ingredients | 1 |
| batch recipe with no portioning step | 11 |
| method under three steps | 5 |
| a step over 320 characters | 2 |
| no allergens field (admin release panel only) | 177 |
| duplicate recipe names | 0 |
| same food, different macros between recipes | 0 |
| the two macro banks disagree on protein/carbs/fat | 0 foods |

**Total findings: 258** across 232 recipes.

Severity: **safety** first, then **wrong** (the recipe misstates itself), **nutrition**, **quality**, **cosmetic**.

## main course under 300 kcal (29) — severity: nutrition

- `m18` 🍗 Chicken with Mustard & Coffee Sauce — 228 kcal
- `m36` 🐟 Tuna & Chickpea Power Bowl — 220 kcal
- `sn4` 🥒 Zesty Pickle & Veggie Board — 222 kcal
- `m142`* 🐟 Baked Lemon Dill Cod with Garlic Green Beans — 230 kcal
- `m143`* 🐟 One-Pan Lemon Garlic Tilapia with Asparagus — 244 kcal
- `m145`* 🐟 Garlic Butter Cod with Spinach — 204 kcal
- `m147`* 🐟 Zesty Lemon Herb Cod — 202 kcal
- `m148`* 🦃 Turkey & Zucchini Meatballs — 251 kcal
- `m152`* 🦐 Lemon-Garlic Shrimp with Zoodles — 216 kcal
- `m154`* 🦃 Turkey Veggie Stir-Fry — 276 kcal
- `m155`* 🦐 Shrimp & Veggie Rice Bowl — 257 kcal
- `m156`* 🦐 Garlic Butter Shrimp with Zucchini Noodles — 206 kcal
- `m158`* 🍗 Hearty Chicken Vegetable Soup — 225 kcal
- `m161`* 🦐 Coconut Curry Shrimp — 239 kcal
- `m163`* 🥚 Veggie-Packed Chickpea Pasta — 279 kcal
- `m164`* 🦃 Turkey & Vegetable Stuffed Peppers — 237 kcal
- `m168`* 🥚 Tofu & Veggie Stir-Fry Bowl — 206 kcal
- `m171`* 🌾 Broccoli & Cheddar Quinoa Bowl — 228 kcal
- `m176`* 🍽️ Cauliflower Fried Rice — 159 kcal
- `m177`* 🐟 Tuna & Avocado Open Sandwich — 296 kcal
- `m179`* 🍽️ Mediterranean Stuffed Bell Peppers — 277 kcal
- `m180`* 🥚 Quinoa-Stuffed Eggplant Boats — 249 kcal
- `m181`* 🥚 Baked Eggplant Parmesan — 197 kcal
- `m182`* 🥚 Quinoa & Veggie Stir-Fry — 230 kcal
- `m183`* 🥤 Matcha Green Smoothie Bowl — 255 kcal
- `m186`* 🍽️ Green Goddess Buddha Bowl — 298 kcal
- `m189`* 🌾 Rainbow Grain Salad — 223 kcal
- `m190`* 🌿 Spicy Lentil Tacos — 97 kcal
- `m191`* 🍲 Mushroom Barley Soup — 149 kcal

## very high fat share (19) — severity: nutrition

- `m62` 🐟 Salmon, Avocado & Spinach Bowl — 56% of calories from fat
- `ds7`* 🍫 Frozen Banana Snickers Bar — 61% of calories from fat
- `m137`* 🍗 Baked Herb Chicken with Roasted Brussels Sprouts — 61% of calories from fat
- `sn10`* 🦃 Spiced Turkey Lettuce Cups — 57% of calories from fat
- `bf49`* 🧀 Mushroom & Goat Cheese Scramble — 69% of calories from fat
- `bf51`* 🍽️ Savory Tomato & Basil Scramble — 61% of calories from fat
- `sn16`* 🥚 Grilled Veggie & Halloumi Salad — 69% of calories from fat
- `bf55`* 🥚 Creamy Avocado Toast with Soft-Boiled Egg — 60% of calories from fat
- `sn24`* 🍽️ Roasted Pumpkin Seeds with Cinnamon & Honey — 75% of calories from fat
- `bf64`* 🥚 Spinach & Feta Egg Muffins — 60% of calories from fat
- `sn25`* 🧀 Roasted Beet & Goat Cheese Salad — 69% of calories from fat
- `sn28`* 🍽️ Caprese Skewers — 58% of calories from fat
- `ds16`* 🌱 Crispy Air-Fried Tofu Bites — 65% of calories from fat
- `sn30`* 🥚 Savory Egg Muffins — 60% of calories from fat
- `sm23`* 🥣 Mango Coconut Chia Pudding — 59% of calories from fat
- `sm26`* 🥤 Pineapple Coconut Recovery Smoothie — 55% of calories from fat
- `sn35`* 🥚 Mini Veggie Frittatas — 58% of calories from fat
- `ds18`* 🫐 Dark Chocolate-Dipped Strawberries — 58% of calories from fat
- `sn39`* 🥚 Veggie Sticks with Spicy Tahini Dip — 74% of calories from fat

## main course that barely fills a plate (14) — severity: nutrition

- `m21` 🍗 Crispy Chicken Nuggets — 199 g of food per portion
- `m103`* 🍝 Creamy Pesto Pasta — 193 g of food per portion
- `m137`* 🍗 Baked Herb Chicken with Roasted Brussels Sprouts — 197 g of food per portion
- `m145`* 🐟 Garlic Butter Cod with Spinach — 198 g of food per portion
- `m146`* 🍗 Pesto Chicken Pasta Salad — 194 g of food per portion
- `m147`* 🐟 Zesty Lemon Herb Cod — 181 g of food per portion
- `m149`* 🦐 Garlic Herb Shrimp Pasta — 194 g of food per portion
- `m163`* 🥚 Veggie-Packed Chickpea Pasta — 110 g of food per portion
- `m169`* 🥑 Creamy Avocado Pasta — 158 g of food per portion
- `m171`* 🌾 Broccoli & Cheddar Quinoa Bowl — 160 g of food per portion
- `m178`* 🫘 Baked Falafel Bowl — 179 g of food per portion
- `m182`* 🥚 Quinoa & Veggie Stir-Fry — 175 g of food per portion
- `m189`* 🌾 Rainbow Grain Salad — 174 g of food per portion
- `m190`* 🌿 Spicy Lentil Tacos — 69 g of food per portion

## three or more high-sodium ingredients (1) — severity: nutrition

- `m24` 🍯 Slow Cooker Honey Cashew Chicken — Dark soy sauce, Japanese-style soy sauce, Hoisin sauce

## batch recipe with no portioning step (11) — severity: quality

- `m27` 🥚 Sweet Potato Veggie Egg Bake — 4 portions and no instruction to divide them
- `d1` 🍪 Protein Brownie Cookies — 7 portions and no instruction to divide them
- `pw2` 🍌 Banana & Oat Protein Smoothie — 7 portions and no instruction to divide them
- `pw0` ⚡ Carb Bridge — 7 portions and no instruction to divide them
- `ds3` 🥭 Mango Protein Tart — 4 portions and no instruction to divide them
- `ds4` 🍫 Chocolate Protein Brownie — 8 portions and no instruction to divide them
- `bf33` 🥚 High Protein Breakfast Sandwiches — 10 portions and no instruction to divide them
- `pw7` 🥯 Pre-Run Bagel & Banana — 7 portions and no instruction to divide them
- `ds5` 🍌 Protein Banana Bread — 8 portions and no instruction to divide them
- `bf35` 🥞 High Protein Banana Pancakes — 4 portions and no instruction to divide them
- `ds9`* 🥕 Protein Carrot Cake — 9 portions and no instruction to divide them

## method under three steps (5) — severity: quality

- `bf44`* 🫙 Protein Berry Yoghurt Bowl — 2 step(s)
- `m131`* 🍗 Garlic Chicken, Crispy Potatoes & Broccoli — 2 step(s)
- `ds11`* 🍪 Protein Brownies — 2 step(s)
- `sn27`* 🫙 Carrot Sticks with Spicy Greek Yogurt Dip — 2 step(s)
- `ds20`* 🍪 Peanut Butter Banana Rice Cakes — 2 step(s)

## a step over 320 characters (2) — severity: quality

- `v8` 🥬 Spinach & White Bean Pasta — longest 331 chars — hard to follow on a phone mid-cook
- `bf4` 🧀 Cottage Cheese & Toast — longest 341 chars — hard to follow on a phone mid-cook

## no allergens field (admin release panel only) (177) — severity: cosmetic

- `hol10` 🎖️ All-American Beef & Rice Casserole — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Celery
- `m37` 🐟 Baked Cod & Roasted Baby Potatoes — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Fish
- `hol6` 🍗 🇺🇸 BBQ Chicken & Corn Rice Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m13` 🥩 Beef Mince & Rice Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m02` 🥩 Big Mac Protein Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Mustard, Sulphites
- `hol4` 🎃 Black Bean & Pumpkin Chilli Chicken Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Celery
- `m09` 🍗 Buffalo Ranch Chicken Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Celery
- `m28` 🥩 Cheeseburger Burritos — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Mustard, Sulphites
- `m45` 🍗 Chicken & Red Lentil Soup — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Celery
- `m14` 🍗 Chicken Alfredo Red Sauce — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `m12` 🍗 Chicken Bacon Mac — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `m18` 🍗 Chicken with Mustard & Coffee Sauce — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Mustard
- `v3` 🌿 Chickpea & Roasted Veggie Couscous — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Celery
- `m07` 🍗 Chipotle Chicken Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Celery
- `m26` 🥩 Creamy Steak Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Celery
- `m21` 🍗 Crispy Chicken Nuggets — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Mustard
- `m43` 🥚 Egg White Frittata & Roasted Potatoes — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Eggs
- `m05` 🍗 French Onion Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Fish, Mustard
- `m10` 🍗 Garlic Parmesan Chicken Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `m35` 🦐 Garlic Shrimp Stir-Fry & Brown Rice — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy, Sesame, Crustaceans
- `m46` 🍗 Greek Chicken & Orzo Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `v4` 🥗 Greek Yogurt Egg & Veggie Protein Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Eggs
- `m11` 🍗 Green Pepper & Onion Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Celery
- `hol9` 🥩 Grilled Sirloin & Sweet Potato Mash Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Fish, Celery, Mustard
- `hol3` 🐣 Herb-Crusted Lamb & Quinoa with Feta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m51` 🥩 Hibachi Steak Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Eggs, Soy, Sesame, Mustard
- `m54` 🥩 Lean Beef Bowl with Rice & Vegetables — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m55` 🥩 Lean Beef Bowl with Sweet Potato & Vegetables — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m56` 🍗 Herb Chicken Bowl with Rice & Vegetables — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m57` 🍗 Herb Chicken Bowl with Sweet Potato & Vegetables — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m58` 🌶️ Lean Beef Chili with Sweet Potato, Spinach & Corn — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Celery
- `m59` 🥩 Beef, Cottage Cheese & Sweet Potato Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m61` 🥩 Ground Beef, Eggs & Brown Rice Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Eggs, Soy
- `m62` 🐟 Salmon, Avocado & Spinach Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Fish
- `m25` 🍗 High-Protein KFC Mac & Cheese — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Celery, Mustard
- `m06` 🍗 Honey Chipotle Chicken Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m16` 🍗 Honey Chipotle Chicken Burritos — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `hol8` 🌸 Honey-Glazed Chicken & Strawberry Spinach Quinoa — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Tree Nuts
- `m20` 🍋 Juicy Garlic Lemon Chicken — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Soy
- `m44` 🥩 Lean Beef & Broccoli Rice Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy, Sesame, Molluscs
- `m15` 🥩 Lean Beef & Potato Roast — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Celery
- `m08` 🥩 Lean Beef Hamburger Helper — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Celery
- `m30` 🥩 Lean Taco Salad — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Celery
- `m33` 🦃 Lean Turkey Mince Rice Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Celery
- `v1` 🍛 Lentil & Spinach Dahl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Celery
- `m01` 🍗 Marry Me Chicken — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Celery
- `m03` 🍗 Marry Me Chicken — Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Celery
- `m23` 🍕 Pepperoni Pizza Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `m41` 🐷 Pork Tenderloin & Jasmine Rice — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Mustard
- `m49` 🦐 Prawn & Avocado Rice Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Crustaceans
- `m29` 🥩 Ranch Beef Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `hol1` 🎄 Rosemary Turkey & Cranberry Sweet Potato Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `hol7` ❤️ Salmon & Asparagus with Lemon-Dill Quinoa — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Fish
- `m19` 🥑 Salmon & Avocado Burrito — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Fish
- `m34` 🐟 Salmon & Quinoa with Asparagus — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Fish
- `m48` 🐟 Seared Tuna Steak & Quinoa Tabbouleh — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Fish
- `m24` 🍯 Slow Cooker Honey Cashew Chicken — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy, Tree Nuts, Celery, Sulphites
- `m50` 🍗 Slow-Cooked Pulled Chicken & Rice — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Celery
- `hol2` 🦃 Slow-Cooker Turkey & Butternut Squash Feast — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Celery
- `hol5` 🌙 Spiced Lamb & Lentil Rice (Mujadara-Style) — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m27` 🥚 Sweet Potato Veggie Egg Bake — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Eggs
- `m47` 🍗 Teriyaki Chicken & Edamame Rice — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy
- `v2` 🥢 Tofu & Edamame Teriyaki Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Soy, Sesame
- `m36` 🐟 Tuna & Chickpea Power Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Fish
- `v9` 🍳 Egg & Veggie Protein Frittata — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Eggs
- `v6` 🍳 Shakshuka Protein Bowls — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `v8` 🥬 Spinach & White Bean Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `v5` 🧀 Paneer Tikka Masala Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `v7` 🪴 Black Bean & Sweet Potato Burrito Bowls — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m42` 🐟 White Fish & Mango Salsa Rice — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Fish
- `bf1` 🥓 Bacon & Hashbrown Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Eggs
- `bf2` 🥚 Breakfast Bagel Sandwich — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Sesame
- `bf3` 🥕 Carrot Protein Pancakes — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `bf4` 🧀 Cottage Cheese & Toast — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `bf5` 🥚 Egg, Beef & Cheese Breakfast Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Eggs
- `bf6` 🥚🥩 Egg, Beef & Cheese Breakfast Burritos — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Mustard, Sulphites
- `bf7` 🥚 Eggs on Wholegrain Toast — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Eggs, Fish
- `bf8` 🫙 Greek Yogurt Protein Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `bf9` 🥚 High-Protein Breakfast — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `bf10` 🌾 High-Protein Breakfast Oats — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Peanuts
- `bf11` 🫐 Protein Smoothie Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Tree Nuts
- `bf12` 🥯 Turkey Sausage Breakfast Bagel — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Sesame
- `bf13` 🫐 Blueberry Cinnamon Protein Oats — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `bf14` 🍌 Banana Blueberry Protein Oats — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `bf15` 🍫 Banana Dark Chocolate Almond Oats — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `d5` 🍫 Chocolate Banana Protein Brownies — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Eggs, Tree Nuts
- `ds2` 🍫 Chocolate Protein Rice Cakes — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Peanuts
- `d4` 🍵 Matcha Banana Protein Bread — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `d1` 🍪 Protein Brownie Cookies — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Tree Nuts
- `pw2` 🍌 Banana & Oat Protein Smoothie — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `pw6` 🥛 Chocolate Milk & Banana — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `pw4` 🥚 Egg White & Toast with Jam — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Eggs
- `pw3` 🫙 Greek Yogurt & Berry Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `pw5` 🌾 Overnight Oats with Protein — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `pw1` 🥜 Rice Cake & Peanut Butter Stack — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Peanuts
- `sm1` 🥛 Creamy Oat Protein Shake — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `sm2` 🍫 Chocolate Peanut Power Shake — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Peanuts, Tree Nuts
- `sm3` 🌿 Tropical Green Gains Smoothie — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Peanuts
- `sm4` 🫐 Mixed Berry Power Smoothie — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `sm5` 🍓 Berry Matcha Antioxidant Shake — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `sm6` 🍫 Light Choc Peanut Shake — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Peanuts, Tree Nuts
- `sm7` 🥭 Coconut Mango Protein Smoothie — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `sm8` ☕ Caramel Espresso Protein Shake — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `sm9` 💜 Purple Acai Dream Smoothie — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Tree Nuts
- `sn2` 🥟 Steamed Chicken Power Bao — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Soy
- `sn3` 🍉 Tropical Fruit Spice Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `sn4` 🥒 Zesty Pickle & Veggie Board — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Sulphites
- `sn5` 🍉 Watermelon Feta & Edamame Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Soy, Sulphites
- `sn6` 🍗 Minced Chicken Thai Herb Salad — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy
- `sn7` 🫓 Smoky Eggplant Baba Pita — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Sesame, Sulphites
- `sn8` 🫔 High-Protein Chicken Quesadilla — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `bf16` 🍌 Banana Egg Caramel Stack — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `bf17` 🍓 Berry Granola Goddess Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `bf18` 💜 Purple Berry Power Smoothie Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `bf19` 🌞 Tropical Yellow Sunshine Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `bf20` 🍎 Apple Cinnamon Protein Porridge — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `bf21` 📅 Dates & Banana Protein Toast — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `bf22` 🥥 Mango Coconut Overnight Oats — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `bf23` 🥞 Fluffy High-Protein Pancakes — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Tree Nuts
- `bf24` 🥜 Peanut Butter Banana Wrap — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Peanuts, Tree Nuts
- `bf25` 🥩 Classic Steak & Smashed Egg Skillet — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Eggs
- `bf26` 🐟 Omega-3 Smoked Salmon Plate — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Fish
- `bf27` 🍳 Full Power Breakfast Plate — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `bf28` 🌯 Loaded Protein Breakfast Wrap — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `bf29` 🥑 Smashed Avo & Poached Egg Toast — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Sulphites
- `bf30` 🥚 Stuffed Veggie Power Omelette — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `bf31` 🥚 Clean Egg White Omelette — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `bf32` 🍚 Protein Chicken Congee — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Eggs, Celery
- `m63` 🍝 Slow-Cooked Beef Ragu Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `m64` 🥬 Green Kale Basil Pesto Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts, Sulphites
- `m65` 🍄 Umami Miso Mushroom Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Soy, Sesame
- `m66` 🥩 Spicy Thai Beef & Herb Salad — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy, Fish
- `m67` 🥑 Creamy Chicken Avocado Salad — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `m68` 🥗 Crunchy Asian Sesame Chicken Salad — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy, Tree Nuts, Sesame
- `m69` 🎃 Roasted Pumpkin Power Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Sesame
- `m70` 🥩 Seared Steak & Garlicky Greens — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m71` 🧆 Smoky Eggplant Beef Rice Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m72` 🐟 Bali-Spiced Barramundi Plate — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Fish, Mustard, Sulphites
- `m73` 🍗 Herb Green Rice Chicken Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Tree Nuts
- `m74` 🍯 Honey Soy Glazed Chicken Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy, Tree Nuts, Sesame
- `m75` 🥩 Spicy Thai Basil Beef Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Eggs, Soy, Molluscs
- `m76` 🍳 High-Protein Nasi Goreng — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Eggs, Soy, Sesame, Sulphites
- `m78` 🌶 Peri Peri Grilled Chicken Plate — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Celery, Sulphites
- `m79` 🍗 Lemongrass Chicken Coconut Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy
- `m80` 🍔 Lean Beef Smash Burger — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `m81` 🐔 Grilled Chicken Protein Burger — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Mustard, Sulphites
- `m82` 🥚 Chicken & Egg Toast Stack — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Mustard
- `m83` 🍗 Chicken Club Toastie — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Mustard, Sulphites
- `m84` 🫔 Crispy Chicken Crunch Wrap — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `ds3` 🥭 Mango Protein Tart — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `ds4` 🍫 Chocolate Protein Brownie — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Tree Nuts
- `m85` 🥓 Creamy Bacon Beef Protein Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `m86` 🥩 High Protein Creamy Beef Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Celery
- `sn9` 🐟 High-Protein Tuna & Veg Plate — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Fish
- `bf33` 🥚 High Protein Breakfast Sandwiches — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs
- `pw7` 🥯 Pre-Run Bagel & Banana — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Peanuts
- `ds5` 🍌 Protein Banana Bread — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Peanuts
- `ds6` 🍫 Protein Chocolate Mousse — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `bf34` 🍌 Banana Bread Baked Oats — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Tree Nuts
- `bf35` 🥞 High Protein Banana Pancakes — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Eggs, Tree Nuts
- `m88`* 🍯 Honey Garlic Chicken & Rice — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Soy
- `m89`* 🥩 Steak Burrito Meal Prep Bowls — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Celery
- `m90`* 🐟 Teriyaki Salmon & Brown Rice Power Bowls — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy, Fish
- `m91`* 🍤 Mediterranean Shrimp Quinoa Bowls — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Crustaceans
- `m93`* 🧀 Cheesy Beef Taco Potato Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Celery
- `m94`* 🍚 Crispy Garlic Chicken & Fried Rice — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Eggs, Soy, Sesame
- `m95`* 🥦 Honey Garlic Baked Chicken & Broccoli — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy
- `m96`* 🫙 No-Cook Greek Chickpea & Chicken Jars — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m97`* 🍝 Cheesy Beef Pasta Skillet — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `m98`* 🥩 Steak & Potato Power Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy
- `m99`* 🐟 Garlic Lemon Salmon Rice Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Fish
- `m100`* 🌮 Chicken Burrito Bowl — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Dairy, Celery
- `m101`* 🐟 Tuna Protein Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy, Fish
- `m102`* 🧀 Buffalo Chicken Mac & Cheese — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `m103`* 🍝 Creamy Pesto Pasta — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Dairy
- `v10`* 🥗 Tofu & Quinoa Veggie Power Bowls — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy
- `v11`* 🥜 Cold Peanut Noodle Slaw — the user-facing chips and diet filters call detectAllergens() live, so this is cosmetic — the release panel just shows no ⚠ line. Would read: Gluten / Wheat, Soy, Peanuts, Sesame

## one food, many labels (86)

- **Chicken Breast (skinless, raw)** — "Skinless boneless chicken breast (raw)", "Chicken breast (raw)", "Chicken breast (skinless, raw)", "Diced chicken breast", "Chicken breasts (raw)", "Chicken breast (raw, diced)", "Chicken breast (raw, butterflied)", "Chicken breast (raw, cubed)", "Chicken breast (raw, shredded)", "Chicken breast (diced)", "Chicken breast (large)", "Chicken breast", "Chicken breasts"
- **Ground Turkey (93% lean, raw)** — "93/7 turkey mince (raw)", "Ground turkey sausage (raw)", "Lean ground turkey (raw)", "Ground turkey (93% lean, raw)", "Ground turkey", "Lean ground turkey"
- **Beef Mince (5% fat, raw)** — "95/5 lean ground beef (raw)", "Beef mince (5% fat)", "Lean ground beef (5% fat)", "Lean ground beef (96/4)", "Extra lean beef mince (96/4)", "95/5 lean beef mince (raw)", "Beef mince (5% fat, raw)"
- **Salmon (Atlantic, raw)** — "Salmon (Atlantic, raw)", "Salmon fillets (skin-on)", "Salmon loin (cubed, raw)", "Salmon fillets (raw)", "Salmon fillet (raw)", "Salmon fillet (raw, skin-on)", "Salmon fillets"
- **Tuna (canned in water)** — "Tuna in spring water (480g)", "Tuna (canned in water, drained)", "Tuna in spring water (drained)", "Tuna in water", "Tuna (canned in water)"
- **Shrimp / Prawns (raw)** — "Raw shrimp (peeled & deveined)", "Raw king prawns (peeled)", "Shrimp / prawns (raw, peeled)", "Shrimp"
- **Eggs (whole, large, raw)** — "Large eggs", "Large whole eggs", "Eggs (whole, large)", "Large egg", "Whole eggs", "Eggs (large)", "Large eggs (beaten, for dipping)", "Egg", "Eggs", "Boiled eggs", "Poached eggs", "Scrambled egg", "Soft-boiled egg"
- **Egg Whites (raw)** — "Liquid egg whites", "Egg whites (liquid)", "Egg whites", "Egg whites (raw)", "Egg white"
- **Fat-Free Cottage Cheese** — "Fat-free cottage cheese", "Fat-free cottage cheese (sauce base)", "Fat-free cottage cheese (topping)", "Fat-free cottage cheese (protein dip)", "Fat-Free Cottage Cheese", "Fat-Free Cottage Cheese (sauce base)"
- **Light Mozzarella** — "Président Light mozzarella", "Président Light mozzarella (shredded)", "Shredded Italian cheese blend", "Light mozzarella (shredded)", "Fresh mozzarella", "Mini mozzarella balls", "Shredded mozzarella"
- **Parmesan** — "Parmesan", "Parmesan (optional topping)", "Parmigiano Reggiano (grated)", "Parmesan (sauce + topping)", "Parmesan or feta (crumbled)", "Parmesan (topping)", "Parmesan (grated)", "Pecorino Romano / Parmesan", "Parmesan (finely grated)", "Parmesan (grated, for coating)", "Parmesan (shaved)", "Grated Parmesan", "Grated Parmesan cheese"
- **Greek Yogurt (0% fat)** — "0% Greek yogurt (ranch base)", "0% Greek yogurt", "0% Greek yogurt (to serve)", "0% Greek yogurt (sauce base)", "0% Greek yogurt (dressing)", "Plain nonfat Greek yogurt", "0% Greek yogurt (stirred in to serve)", "0% Greek yogurt (sauce)", "0% Greek yogurt (for serving)", "Greek yogurt 0%", "0% fat Greek yogurt", "Fat-free Greek yogurt", "Greek yogurt (0% fat)", "Greek Yogurt (0% fat)", "0% Greek yogurt (sour cream sub)", "0% Greek yogurt (tzatziki base)", "0% Greek yogurt (herb sauce)", "Greek yogurt (0%) — frosting", "Nonfat Greek yogurt"
- **Greek Yogurt (2% fat)** — "Low-fat Greek yogurt", "Greek yogurt", "Low-fat Greek yogurt (topping)", "Greek yogurt (2% fat)", "Plain Greek yogurt"
- **Milk (skim / 0%)** — "Baladna skimmed milk", "Fat-free milk", "Skimmed milk", "Silk Protein Milk (skim)", "Skim milk"
- **Feta Cheese** — "Feta cheese", "Reduced-fat feta cheese", "Feta cheese (light)", "Light feta cheese", "Reduced-fat feta (crumbled)", "Feta cheese (crumbled)", "Feta (crumbled)", "Crumbled feta"
- **Cream Cheese (light)** — "Reduced-fat cream cheese", "Light cream cheese (Philadelphia Light)", "Light cream cheese", "1/3 less-fat cream cheese", "Light cream cheese (⅓ fat)", "Cream cheese (light)", "Cream cheese (light) — frosting"
- **Almond Milk (unsweetened)** — "Unsweetened almond milk", "Almond milk (unsweetened)", "Almond Milk (unsweetened)", "Almond milk"
- **Oats (rolled, dry)** — "Rolled oats", "Rolled oats (dry)", "Oats (rolled, dry)", "Oats"
- **Pasta (dry, white)** — "Pasta (any shape)", "Pasta (rigatoni or any)", "Pasta (farfalle or any)", "Pasta (macaroni/shells)", "Penne pasta", "Pasta (penne or short)", "Pasta (spaghetti or any)", "Macaroni pasta", "Pasta (elbow or short)", "Macaroni (dry)", "Pasta (dry)", "Rigatoni (dry pasta)"
- **Pasta (dry, whole wheat)** — "Wholegrain pasta (dry)", "High-protein pasta (dry)", "Chickpea / high-protein pasta", "Wholewheat lasagne sheets", "Whole-grain pasta", "Whole-grain spaghetti", "Whole wheat pasta"
- **Sweet Potato (raw)** — "Sweet potato (raw)", "Sweet potato (cubed, raw)", "Sweet potatoes (cubed)", "Sweet potatoes (whole)", "Sweet potatoes", "Large sweet potato", "Sweet potato (raw, diced)", "Sweet potato (cubed)", "Cubed sweet potatoes", "Sweet potato"
- **White Potato (raw)** — "Baby potatoes (halved)", "White potato (raw)", "Red potatoes (quartered)", "Frozen shredded hashbrowns", "White potato (raw, cubed)", "Baby potatoes (cubed)", "Potatoes"
- **Bread (whole wheat)** — "Wholegrain bread slice", "Wholegrain bread (loaf)", "Whole wheat toast", "Bread (whole wheat)", "Whole-grain bread"
- **Tortilla (flour, 25cm)** — "High-fiber tortilla wraps (110 cal)", "High-fiber 12-inch tortilla wraps", "Tortilla (flour, 25cm)", "Flour tortillas (small)", "Wheat tortilla", "-grain tortillas", "-wheat tortilla", "Whole wheat tortilla"
- **Corn / Sweetcorn** — "Corn (canned, drained)", "Canned sweet corn (drained)", "Corn / sweetcorn", "Canned corn (drained)", "Sweetcorn (kernels)"
- **Rice Cakes (plain)** — "Lightly salted rice cakes", "Kallo rice cakes", "Plain rice cakes", "Brown rice cakes"
- **Chickpeas (canned, drained)** — "Chickpeas in water (canned, drained)", "Chickpeas (canned, drained)", "Chickpeas", "Roasted chickpeas", "Canned chickpeas"
- **Edamame (shelled)** — "Frozen edamame (shelled)", "Edamame (frozen, shelled)", "Edamame (shelled)", "Edamame (shelled, thawed)", "Edamame", "Shelled edamame"
- **Broccoli** — "Broccoli", "Broccoli florets", "Broccoli (florets)", "Steamed broccoli", "Steamed broccoli florets"
- **Spinach (fresh)** — "Frozen spinach", "Spinach", "Fresh spinach", "Spinach (fresh)"
- **Kale** — "Kale or baby spinach", "Kale (raw)", "Handful kale", "Kale"
- **Zucchini / Courgette** — "Zucchini (sliced)", "Zucchini", "Zucchini (diced)", "Zucchini / courgette", "Zucchini / courgette (diced)", "Zucchinis"
- **Bell Pepper (red)** — "Mixed bell peppers (diced)", "Red bell peppers", "Red & yellow capsicum (diced)", "Red bell pepper", "Bell peppers (red & yellow)", "Red capsicum (diced)", "Bell peppers (mixed)", "Mixed bell peppers (sliced)", "Red bell pepper (sliced)", "Bell pepper, red (sliced)", "Bell peppers (mixed colours)", "Bell pepper, red (diced)", "Red capsicum (bell pepper)", "Red bell pepper (diced)", "Bell pepper (red)", "Chopped bell peppers", "Diced bell peppers", "Roasted red peppers", "Bell peppers"
- **Bell Pepper (green)** — "Green bell peppers", "Green bell pepper (diced)", "Bell pepper, green (diced)", "Bell pepper, green (thinly sliced)"
- **Onion** — "Yellow onion (large)", "Onion", "White onion (diced)", "Yellow onion", "White onion (chopped)", "Large sweet onions", "Yellow onions (large)", "Yellow onion (diced)", "Large onion (diced)", "Onion (large)", "Brown onion", "Onion (diced)", "Onion (thinly sliced)", "Onion (chopped)", "Onion (finely diced)", "Diced onion"
- **Red Onion** — "Red onion (diced)", "Red onion", "Red onion (half, sliced)", "Red onion (finely diced)"
- **Garlic** — "Garlic cloves", "Minced garlic", "Garlic cloves (chopped)", "Garlic", "Garlic (fresh, minced)", "Garlic (minced)", "Garlic (fresh cloves)", "Garlic cloves (minced)", "Garlic paste", "Garlic (grated)", "Garlic (chopped)", "Garlic clove"
- **Tomato** — "Diced tomatoes (canned)", "Chopped tomatoes (canned)", "Tomato (fresh, sliced)", "Tomatoes (medium)", "Tomato (diced)", "Tomato (chopped)"
- **Cherry Tomatoes** — "Cherry tomatoes", "Cherry tomatoes (halved)", "Tomato slices", "Tomato"
- **Cucumber** — "Cucumber (diced, for serving)", "Cucumbers", "Cucumber (sliced)", "Cucumber", "Cucumbers (small/Lebanese)", "Cucumber (diced)", "Cucumber (thinly sliced)", "Cucumber (grated, squeezed)", "Sliced cucumber", "Carrot and cucumber sticks"
- **Lettuce (romaine)** — "Romaine lettuce (shredded)", "Iceberg lettuce (chopped)", "Lettuce (romaine)", "Lettuce (cos/romaine)", "Romaine lettuce (chopped)", "Romaine lettuce", "Lettuce leaves", "Shredded lettuce"
- **Mushrooms (white button)** — "Mushrooms (sliced)", "Sliced mushrooms", "Mushrooms (white button)", "Mushrooms", "Sautéed mushrooms"
- **Asparagus** — "Asparagus spears", "Asparagus (trimmed)", "Asparagus (chopped)", "Asparagus"
- **Green Beans** — "Green beans (fresh or frozen)", "Green beans", "Green beans (trimmed)", "Green beans (fresh)", "Steamed green beans"
- **Cauliflower** — "Cauliflower rice (frozen or fresh)", "Riced cauliflower (frozen)", "Cauliflower (florets)", "Cauliflower rice"
- **Carrot** — "Carrots (diced)", "Frozen carrots", "Baby carrots", "Grated carrot", "Carrot", "Carrot (julienned)", "Carrot (finely grated)", "Carrot (finely diced)", "Chopped carrots", "Carrots", "Shredded carrots", "Carrot sticks", "Grated carrots"
- **Celery** — "Celery (diced)", "Celery stalks (diced)", "Celery (finely diced)", "Celery", "Celery stalk", "Celery stalks"
- **Baby Spinach** — "Baby spinach", "Baby spinach (stir in last 5 min)", "Baby spinach (cooked & squeezed dry)", "Baby spinach (chopped)", "Steamed broccoli and spinach mix", "Spinach", "Chopped spinach", "A handful of spinach", "Spinach leaves", "Handful spinach"
- **Spring Onion / Scallion** — "Spring onion / scallion", "Spring onions (bunch)", "Spring onion", "Spring onion (sliced)"
- **Banana** — "Banana (sliced, half)", "Banana (half, sliced)", "Ripe bananas, mashed", "Ripe bananas", "Bananas (ripe, frozen)", "Bananas", "Bananas or berries for topping", "Bananas (ripe)", "Banana (medium)", "Ripe banana", "Banana (halved lengthways)", "Banana (sliced)", "Banana", "Frozen banana", "Mashed banana"
- **Apple** — "Apple", "Apples (diced)", "Green apple", "Green apples"
- **Strawberries** — "Strawberries (hulled, halved)", "Strawberries", "Sliced strawberries", "Frozen strawberries", "Diced strawberries"
- **Blueberries** — "Blueberries", "Sliced strawberries or blueberries", "Fresh blueberries", "Frozen blueberries"
- **Mango** — "Mangoes (ripe)", "Mango", "Mango (diced)", "Diced mango", "Frozen mango chunks", "Frozen mango"
- **Pineapple** — "Pineapple (chunks)", "Diced pineapple", "Pineapple chunks", "Pineapple"
- **Avocado** — "Avocado", "Ripe avocados", "Ripe avocado (quarter)", "Avocado (½)", "Avocado (¼)", "Avocado (diced)"
- **Lemon (juice)** — "Lemons", "Lemon (juice of 2)", "Lemon juice", "Lemon juice (fresh)", "Lemon (juice of half)", "Lemon (juice + zest)", "Lemon (juice)", "Fresh lemon juice", "Lemon (zest & juice)", "Lemon (juice + wedges)", "Lemon", "Juice of ½ lemon", "Squeeze of lemon juice"
- **Lime (juice)** — "Lime", "Lime juice", "Limes", "Lime (juice)"
- **Mixed Berries (frozen)** — "Mixed berries (fresh or frozen)", "Frozen mixed berries", "Mixed berries (topping)", "Mixed frozen berries", "Mixed berries (frozen)", "Mixed berries"
- **Dates (medjool)** — "Medjool dates, pitted", "Medjool dates (pitted)", "Dates (medjool)", "Medjool dates"
- **Peach** — "Fresh peach", "Peach", "Peaches", "Diced peach"
- **Butter (unsalted)** — "Butter", "Butter (unsalted)", "Butter (melted)", "Unsalted butter"
- **Walnuts** — "Walnuts", "Walnuts (chopped)", "Chopped walnuts", "Crushed walnuts"
- **Peanut Butter (natural)** — "Peanut butter", "Natural peanut butter", "Peanut butter (natural)", "Natural peanut butter (no added sugar)"
- **Soy Sauce (low sodium)** — "Low-sodium soy sauce", "Soy Sauce", "Dark soy sauce", "Japanese-style soy sauce", "Soy sauce (low sodium)", "Soy sauce / tamari", "Soy sauce or tamari", "Soy sauce"
- **Passata (tomato sauce)** — "Italian tomato sauce — Prego (1 jar)", "Tomato spaghetti sauce (jar)", "Passata (tomato sauce)", "Tomato sauce", "Crushed tomatoes (canned, drained)", "Low-cal pizza sauce", "Tomato passata", "Passata", "Crushed tomatoes / passata", "Diced tomatoes", "Marinara sauce"
- **Pickles / Gherkins** — "Dill pickles / gherkins (sliced)", "Pickle (gherkin sliced)", "Pickles (chopped)", "Pickles (sliced)"
- **Chicken Bone Broth** — "Bone broth (chicken) or low-sodium chicken broth", "Bone broth or chicken stock (2 Knorr cubes + 1L water)", "Bone broth or chicken stock (½ Knorr cube + 126mL water)", "Bone broth or chicken stock (1 Knorr cube + 280mL water)", "Bone broth or chicken stock", "Chicken or mushroom broth (low-sodium)", "Chicken bone broth"
- **Beef Bone Broth** — "Bone broth (beef) or low-sodium beef broth", "Beef bone broth", "Beef stock (1 Knorr cube + 750mL water)", "Beef stock (1 Knorr cube + 1L water)"
- **Whey Protein Powder** — "Vanilla protein powder", "Whey protein (1 scoop)", "Whey protein powder (1 scoop)", "Chocolate protein powder", "ON Rich Chocolate whey (1 scoop)", "Chocolate whey protein", "Whey protein powder (vanilla/choc)", "White chocolate protein powder", "Chocolate brownie protein powder", "Whey or plant protein powder (vanilla)", "Whey protein powder", "Whey protein powder (vanilla)", "Vanilla whey protein", "Vanilla whey protein (3 scoops)", "Vanilla whey protein — frosting", "Whey protein (vanilla) — our addition"
- **Oregano (dried)** — "Dried oregano", "Oregano", "Oregano (dried)", "Italian seasoning", "Dried basil"
- **Garlic Powder** — "Garlic Powder", "Garlic powder (tsp)", "Garlic powder", "Garlic salt", "Pinch of paprika & garlic powder"
- **Chili Flakes / Red Pepper Flakes** — "Chipotle chilli powder", "Chili flakes", "Chili flakes (tsp)", "Chili flakes / red pepper flakes", "Chilli flakes", "Red pepper flakes", "Pinch chili flakes", "Pinch of chili flakes"
- **Ginger (fresh root)** — "Fresh ginger (grated)", "Fresh ginger (grated, 2 tbsp)", "Crushed ginger", "Ginger (fresh root)", "Ginger (fresh)", "Ginger (fresh, grated)", "Grated ginger", "Ginger", "Fresh ginger"
- **Parsley (fresh)** — "Fresh parsley (chopped)", "Fresh parsley", "Flat-leaf parsley (large bunch)", "Parsley (chopped)", "Parsley (fresh, chopped)", "Chopped parsley", "Parsley"
- **Basil (fresh)** — "Basil (dried)", "Fresh Basil", "Basil (fresh)", "Basil (fresh, torn)", "Chopped basil", "Basil leaves", "Fresh basil"
- **Dill (fresh)** — "Dried dill", "Fresh dill", "Fresh dill or parsley", "Dill (fresh)", "Pinch of dill"
- **Rosemary (fresh/dried)** — "Fresh rosemary or thyme", "Rosemary (dried)", "Fresh rosemary sprigs", "Fresh mint/basil (garnish)", "Rosemary (chopped)"
- **Thyme (fresh/dried)** — "Thyme", "Fresh thyme", "Thyme (dried)", "Thyme (fresh)", "Dried thyme"
- **Dark Chocolate (85%)** — "Dark chocolate 85% (shell)", "Dark chocolate 85% (melted)", "Dark chocolate 85%", "Dark chocolate"
- **Mixed Frozen Vegetables** — "Mixed frozen vegetables", "Roasted mixed vegetables", "Mixed veggies", "Mixed vegetables"
- **Plain Flour (white)** — "Plain flour", "Self-rising flour", "Flour", "Whole-wheat flour"
- **Beef bacon** — "Beef bacon (raw — cook and crumble)", "Beef bacon", "Center-cut beef bacon (raw)", "Beef bacon slices"
- **Cheddar Cheese (reduced-fat)** — "Reduced-fat cheddar (shredded)", "Low-fat shredded cheese", "Shredded sharp cheddar", "Shredded cheese"
- **Chicken Breast (cooked / rotisserie)** — "Rotisserie chicken breast (shredded)", "Chicken breast (cooked, finely chopped)", "Chicken breast (cooked, diced)", "Cooked chicken breast"
- **Ice / Water** — "Water", "Ice", "Warm water", "Ice cubes", "Cold water"

## No findings (169)

`m40` `m04` `m38` `m31` `m39` `m52` `m53` `m60` `m22` `m32` `m92` `m104` `m105` `m106` `m107` `m108` `m109` `m110` `m111` `m112` `m113` `m114` `m115` `m116` `m117` `m118` `m119` `m120` `m121` `m122` `m123` `bf36` `bf37` `bf38` `bf39` `m124` `ds8` `bf40` `d6` `bf41` `m125` `m126` `m127` `m128` `m129` `ds10` `bf43` `m132` `m133` `m134` `m135` `m136` `m138` `m139` `m140` `m141` `m144` `sm10` `bf45` `ds12` `bf46` `m150` `m151` `m153` `sn11` `sn12` `bf47` `sn13` `bf48` `sn14` `sm11` `bf50` `bf52` `m157` `sn15` `bf53` `m159` `bf54` `m160` `sn17` `sn18` `ds13` `bf56` `bf57` `ds14` `sn19` `bf58` `m162` `sn20` `sn21` `bf59` `m165` `bf60` `bf61` `m166` `sn22` `m167` `sn23` `bf62` `m170` `bf63` `sm12` `bf65` `m172` `bf66` `sm13` `m173` `ds15` `sm14` `sm15` `sm16` `sm17` `sm18` `sm19` `sn26` `sm20` `m174` `m175` `sm21` `bf67` `m184` `bf68` `m185` `sn29` `sm22` `bf69` `m187` `bf70` `m188` `ds17` `bf71` `sm24` `bf72` `sn31` `sm25` `sn32` `sn33` `sn34` `bf73` `bf74` `ds19` `sn36` `sn37` `sm27` `sm28` `sn38` `sm29` `sm30` `bf75` `sn40` `ds21` `sm31` `bf76` `sn41` `sm32` `sm33` `ds22` `sm34` `sm35` `ds23` `sm36` `sm37` `sm38` `sm39` `sm40` `sm41` `sm42` `sm43` `sm44`
