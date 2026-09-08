# Full recipe audit — 2026-09-08

Every recipe in the app: **401** (171 live, 230 staged). This is a fresh pass, not a re-run — the 2026-09-07 findings are now assertions in the regression suite and pass by construction. `*` marks a staged recipe.

Nothing here has been changed.

## Summary

| Finding | Recipes |
|---|---|
| cooked rice stored without a rapid-cool note | 27 |
| minced red meat with no doneness cue | 20 |
| reheat advice with neither a time nor 'until hot through' | 9 |
| long marinade with no refrigeration note | 1 |
| method with no timing at all | 60 |
| ingredient never mentioned in the method | 21 |
| same registry ingredient listed twice | 9 |
| method names a cut the recipe does not use | 4 |
| oven recipe with no temperature | 3 |
| air-fryer recipe with no temperature | 1 |
| implausible quantity | 1 |
| main course under 300 kcal | 29 |
| very high fat share | 19 |
| main course that barely fills a plate | 14 |
| three or more high-sodium ingredients | 1 |
| very large plate | 1 |
| batch recipe with no portioning step | 11 |
| method under three steps | 5 |
| a step over 320 characters | 2 |
| no allergens field (admin release panel only) | 177 |
| duplicate recipe names | 0 |
| same food, different macros between recipes | 12 |
| the two macro banks disagree on protein/carbs/fat | 9 foods |

**Total findings: 415** across 283 recipes.

Severity: **safety** first, then **wrong** (the recipe misstates itself), **nutrition**, **quality**, **cosmetic**.

## The two macro banks disagree (9 foods) — severity: wrong

`INGREDIENT_MACROS` drives the recipe card; `ING_FLAT` drives the ingredients tab and shopping list. `check-ingredients.mjs` compares them on calories only, at a 15% tolerance, so these never surfaced.

- **Black Beans (canned, drained)** — protein: recipe card says 6.9 g, registry says 8.9 g · 2 use(s): m89, m100
- **Black Beans (canned, drained)** — carbs: recipe card says 19.8 g, registry says 24 g · 2 use(s): m89, m100
- **Corn / Sweetcorn** — protein: recipe card says 2.6 g, registry says 3.2 g · 3 use(s): m89, m93, m100
- **Taco Seasoning (blend)** — fat: recipe card says 6 g, registry says 8 g · 3 use(s): m89, m93, m100
- **Fat-Free Mozzarella (shredded)** — carbs: recipe card says 7.1 g, registry says 3 g · 3 use(s): m93, m97, m102
- **Pasta (dry, whole wheat)** — protein: recipe card says 20 g, registry says 14 g · 3 use(s): m97, m101, m103
- **Parmesan** — carbs: recipe card says 4.1 g, registry says 3.2 g · 1 use(s): m103
- **Soy Sauce (low sodium)** — protein: recipe card says 10.5 g, registry says 8.1 g · 2 use(s): v10, v11
- **Peanut Butter (natural)** — carbs: recipe card says 12.2 g, registry says 20 g · 1 use(s): v11

## cooked rice stored without a rapid-cool note (27) — severity: safety

- `hol10` 🎖️ All-American Beef & Rice Casserole — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `hol6` 🍗 🇺🇸 BBQ Chicken & Corn Rice Bowl — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m31` 🍗 Classic Chicken, Rice & Broccoli — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m35` 🦐 Garlic Shrimp Stir-Fry & Brown Rice — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m52` 🍗 Italian Herb Chicken, Rice & Broccoli — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m44` 🥩 Lean Beef & Broccoli Rice Bowl — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m24` 🍯 Slow Cooker Honey Cashew Chicken — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m47` 🍗 Teriyaki Chicken & Edamame Rice — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `v2` 🥢 Tofu & Edamame Teriyaki Bowl — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `v5` 🧀 Paneer Tikka Masala Bowl — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `v7` 🪴 Black Bean & Sweet Potato Burrito Bowls — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `bf32` 🍚 Protein Chicken Congee — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m74` 🍯 Honey Soy Glazed Chicken Bowl — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m78` 🌶 Peri Peri Grilled Chicken Plate — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m79` 🍗 Lemongrass Chicken Coconut Bowl — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m88`* 🍯 Honey Garlic Chicken & Rice — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m89`* 🥩 Steak Burrito Meal Prep Bowls — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m90`* 🐟 Teriyaki Salmon & Brown Rice Power Bowls — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m94`* 🍚 Crispy Garlic Chicken & Fried Rice — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m95`* 🥦 Honey Garlic Baked Chicken & Broccoli — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m109`* 🍛 Yellow Curry Meatballs — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m132`* 🍗 Thai Peanut Chicken Rice Bowl — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m139`* 🐟 Miso Ginger Salmon with Brown Rice — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m162`* 🫘 Curried Chickpea Bowl — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m164`* 🦃 Turkey & Vegetable Stuffed Peppers — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m172`* 🥚 Roasted Veggie Grain Bowl with Tahini Drizzle — Bacillus cereus survives cooking and multiplies in rice left to cool slowly
- `m188`* 🫘 Chickpea Coconut Curry with Basmati Rice — Bacillus cereus survives cooking and multiplies in rice left to cool slowly

## minced red meat with no doneness cue (20) — severity: safety

- `m13` 🥩 Beef Mince & Rice Bowl — minced beef/lamb needs cooking right through, unlike a steak
- `m04` 🥩 Beef Mince Bake — minced beef/lamb needs cooking right through, unlike a steak
- `m02` 🥩 Big Mac Protein Pasta — minced beef/lamb needs cooking right through, unlike a steak
- `m55` 🥩 Lean Beef Bowl with Sweet Potato & Vegetables — minced beef/lamb needs cooking right through, unlike a steak
- `m58` 🌶️ Lean Beef Chili with Sweet Potato, Spinach & Corn — minced beef/lamb needs cooking right through, unlike a steak
- `m22` 🍯 Hot Honey Beef & Sweet Potato Bowls — minced beef/lamb needs cooking right through, unlike a steak
- `m44` 🥩 Lean Beef & Broccoli Rice Bowl — minced beef/lamb needs cooking right through, unlike a steak
- `m08` 🥩 Lean Beef Hamburger Helper — minced beef/lamb needs cooking right through, unlike a steak
- `m29` 🥩 Ranch Beef Bowl — minced beef/lamb needs cooking right through, unlike a steak
- `hol5` 🌙 Spiced Lamb & Lentil Rice (Mujadara-Style) — minced beef/lamb needs cooking right through, unlike a steak
- `m63` 🍝 Slow-Cooked Beef Ragu Pasta — minced beef/lamb needs cooking right through, unlike a steak
- `m71` 🧆 Smoky Eggplant Beef Rice Bowl — minced beef/lamb needs cooking right through, unlike a steak
- `m75` 🥩 Spicy Thai Basil Beef Bowl — minced beef/lamb needs cooking right through, unlike a steak
- `m80` 🍔 Lean Beef Smash Burger — minced beef/lamb needs cooking right through, unlike a steak
- `m85` 🥓 Creamy Bacon Beef Protein Pasta — minced beef/lamb needs cooking right through, unlike a steak
- `m93`* 🧀 Cheesy Beef Taco Potato Bowl — minced beef/lamb needs cooking right through, unlike a steak
- `m97`* 🍝 Cheesy Beef Pasta Skillet — minced beef/lamb needs cooking right through, unlike a steak
- `m107`* 🥜 Caramelised Beef & Peanut Noodles — minced beef/lamb needs cooking right through, unlike a steak
- `m114`* 🥢 Egg Roll in a Bowl — minced beef/lamb needs cooking right through, unlike a steak
- `m124`* 🍝 Spinach Tagliatelle Bolognese — minced beef/lamb needs cooking right through, unlike a steak

## reheat advice with neither a time nor 'until hot through' (9) — severity: safety

- `m35` 🦐 Garlic Shrimp Stir-Fry & Brown Rice — no way to tell when it is safely reheated
- `v8` 🥬 Spinach & White Bean Pasta — no way to tell when it is safely reheated
- `m89`* 🥩 Steak Burrito Meal Prep Bowls — no way to tell when it is safely reheated
- `m96`* 🫙 No-Cook Greek Chickpea & Chicken Jars — no way to tell when it is safely reheated
- `m103`* 🍝 Creamy Pesto Pasta — no way to tell when it is safely reheated
- `m124`* 🍝 Spinach Tagliatelle Bolognese — no way to tell when it is safely reheated
- `m166`* 🍝 Creamy Spinach & Mushroom Orzo — no way to tell when it is safely reheated
- `sn26`* 🌿 Savory Mushroom Lentil Stew — no way to tell when it is safely reheated
- `m191`* 🍲 Mushroom Barley Soup — no way to tell when it is safely reheated

## long marinade with no refrigeration note (1) — severity: safety

- `m78` 🌶 Peri Peri Grilled Chicken Plate — marinating at room temperature

## method with no timing at all (60) — severity: wrong

- `m13` 🥩 Beef Mince & Rice Bowl — no duration anywhere in the steps
- `m28` 🥩 Cheeseburger Burritos — no duration anywhere in the steps
- `m08` 🥩 Lean Beef Hamburger Helper — no duration anywhere in the steps
- `m30` 🥩 Lean Taco Salad — no duration anywhere in the steps
- `m23` 🍕 Pepperoni Pizza Pasta — no duration anywhere in the steps
- `m29` 🥩 Ranch Beef Bowl — no duration anywhere in the steps
- `bf1` 🥓 Bacon & Hashbrown Bowl — no duration anywhere in the steps
- `bf2` 🥚 Breakfast Bagel Sandwich — no duration anywhere in the steps
- `bf5` 🥚 Egg, Beef & Cheese Breakfast Bowl — no duration anywhere in the steps
- `bf6` 🥚🥩 Egg, Beef & Cheese Breakfast Burritos — no duration anywhere in the steps
- `bf7` 🥚 Eggs on Wholegrain Toast — no duration anywhere in the steps
- `bf9` 🥚 High-Protein Breakfast — no duration anywhere in the steps
- `sn5` 🍉 Watermelon Feta & Edamame Bowl — no duration anywhere in the steps
- `sn6` 🍗 Minced Chicken Thai Herb Salad — no duration anywhere in the steps
- `bf16` 🍌 Banana Egg Caramel Stack — no duration anywhere in the steps
- `bf19` 🌞 Tropical Yellow Sunshine Bowl — no duration anywhere in the steps
- `bf21` 📅 Dates & Banana Protein Toast — no duration anywhere in the steps
- `bf26` 🐟 Omega-3 Smoked Salmon Plate — no duration anywhere in the steps
- `bf27` 🍳 Full Power Breakfast Plate — no duration anywhere in the steps
- `m65` 🍄 Umami Miso Mushroom Pasta — no duration anywhere in the steps
- `m67` 🥑 Creamy Chicken Avocado Salad — no duration anywhere in the steps
- `m71` 🧆 Smoky Eggplant Beef Rice Bowl — no duration anywhere in the steps
- `m73` 🍗 Herb Green Rice Chicken Bowl — no duration anywhere in the steps
- `m83` 🍗 Chicken Club Toastie — no duration anywhere in the steps
- `m96`* 🫙 No-Cook Greek Chickpea & Chicken Jars — no duration anywhere in the steps
- `m103`* 🍝 Creamy Pesto Pasta — no duration anywhere in the steps
- `m106`* 🥟 Creamy Chicken & Gnocchi — no duration anywhere in the steps
- `m115`* 🌶️ Creamy Cajun Chicken Pasta — no duration anywhere in the steps
- `m116`* 🌮 Smash Burger Tacos — no duration anywhere in the steps
- `m118`* 🍢 Greek Chicken Skewers with Whipped Feta — no duration anywhere in the steps
- `m119`* 🍔 Big Mac Bowl — no duration anywhere in the steps
- `m120`* 🐟 Creamy Tuscan Salmon with Rice — no duration anywhere in the steps
- `m122`* 🥩 Cottage Cheese Alfredo Steak Rigatoni — no duration anywhere in the steps
- `m123`* 🍗 Smothered Chicken with Mushroom Gravy & Mash — no duration anywhere in the steps
- `bf39`* 🫐 Wild Blueberry Vanilla Kefir Bowl — no duration anywhere in the steps
- `bf40`* 🧇 Birthday Cake Protein Waffles — no duration anywhere in the steps
- `ds10`* 🍪 Strawberry Cheesecake Protein Jars — no duration anywhere in the steps
- `bf44`* 🫙 Protein Berry Yoghurt Bowl — no duration anywhere in the steps
- `m146`* 🍗 Pesto Chicken Pasta Salad — no duration anywhere in the steps
- `sn12`* 🥚 Avocado Egg Salad Wrap — no duration anywhere in the steps
- `bf54`* 🥚 Avocado Egg Toast with Microgreens — no duration anywhere in the steps
- `sn17`* 🧀 Strawberry Cottage Cheese Bowl — no duration anywhere in the steps
- `sn18`* 🧀 Cottage Cheese Berry Bowl — no duration anywhere in the steps
- `ds13`* 🫙 Greek Yogurt Parfait with Berries & Flax — no duration anywhere in the steps
- `ds14`* 🫙 Apple Cinnamon Yogurt Parfait — no duration anywhere in the steps
- `sn20`* 🫙 Apple Cinnamon Greek Yogurt Dip — no duration anywhere in the steps
- `m169`* 🥑 Creamy Avocado Pasta — no duration anywhere in the steps
- `sn25`* 🧀 Roasted Beet & Goat Cheese Salad — no duration anywhere in the steps
- `m172`* 🥚 Roasted Veggie Grain Bowl with Tahini Drizzle — no duration anywhere in the steps
- `ds15`* 🫙 Peanut Butter Yogurt Dip with Fruit — no duration anywhere in the steps
- `sm18`* 🥤 Peach Raspberry Protein Smoothie — no duration anywhere in the steps
- `sn27`* 🫙 Carrot Sticks with Spicy Greek Yogurt Dip — no duration anywhere in the steps
- `m177`* 🐟 Tuna & Avocado Open Sandwich — no duration anywhere in the steps
- `m186`* 🍽️ Green Goddess Buddha Bowl — no duration anywhere in the steps
- `sn37`* 🫘 Cucumber Hummus Roll-Ups — no duration anywhere in the steps
- `bf75`* 🫙 Coconut Yogurt Parfait with Tropical Fruit — no duration anywhere in the steps
- `ds20`* 🍪 Peanut Butter Banana Rice Cakes — no duration anywhere in the steps
- `sn39`* 🥚 Veggie Sticks with Spicy Tahini Dip — no duration anywhere in the steps
- `sn40`* 🫘 Cucumber Hummus Cups — no duration anywhere in the steps
- `sm35`* 🥤 Kiwi Cucumber Hydration Smoothie — no duration anywhere in the steps

## ingredient never mentioned in the method (21) — severity: wrong

- `m26` 🥩 Creamy Steak Pasta — Parmigiano Reggiano (grated) (80 g) — the user is told to buy it but not what to do with it
- `m30` 🥩 Lean Taco Salad — Fat-free cheddar (shredded) (70 g) — the user is told to buy it but not what to do with it
- `m29` 🥩 Ranch Beef Bowl — Fat-free mozzarella (shredded) (56 g) — the user is told to buy it but not what to do with it
- `bf25` 🥩 Classic Steak & Smashed Egg Skillet — Lean beef tenderloin (raw) (180 g) — the user is told to buy it but not what to do with it
- `bf31` 🥚 Clean Egg White Omelette — Bread (whole wheat) (60 g) — the user is told to buy it but not what to do with it
- `ds9`* 🥕 Protein Carrot Cake — Brown sugar substitute (5 g) — the user is told to buy it but not what to do with it
- `bf44`* 🫙 Protein Berry Yoghurt Bowl — Greek yogurt (250 g) — the user is told to buy it but not what to do with it
- `ds11`* 🍪 Protein Brownies — Flour (9 g) — the user is told to buy it but not what to do with it
- `ds11`* 🍪 Protein Brownies — Cocoa powder (2.2 g) — the user is told to buy it but not what to do with it
- `ds11`* 🍪 Protein Brownies — Chocolate protein powder (7 g) — the user is told to buy it but not what to do with it
- `ds11`* 🍪 Protein Brownies — Sweetener (1.1 g) — the user is told to buy it but not what to do with it
- `ds11`* 🍪 Protein Brownies — Maple syrup (2.2 ml) — the user is told to buy it but not what to do with it
- `ds11`* 🍪 Protein Brownies — Vanilla extract (0.6 ml) — the user is told to buy it but not what to do with it
- `m133`* 🍗 Turmeric Chicken with Coconut Rice — Garlic clove (1.5 g) — the user is told to buy it but not what to do with it
- `m139`* 🐟 Miso Ginger Salmon with Brown Rice — Sesame oil (2.3 ml) — the user is told to buy it but not what to do with it
- `bf58`* 🌾 Peanut Butter Banana Overnight Oats — Cinnamon (0.7 g) — the user is told to buy it but not what to do with it
- `m172`* 🥚 Roasted Veggie Grain Bowl with Tahini Drizzle — Cooked farro or brown rice (98 g) — the user is told to buy it but not what to do with it
- `m181`* 🥚 Baked Eggplant Parmesan — Shredded mozzarella (28 g) — the user is told to buy it but not what to do with it
- `bf70`* 🌾 Strawberry Almond Baked Oatmeal Cups — Honey (14 g) — the user is told to buy it but not what to do with it
- `bf70`* 🌾 Strawberry Almond Baked Oatmeal Cups — Vanilla extract (0.7 ml) — the user is told to buy it but not what to do with it
- `sm43`* 🍽️ Cucumber Melon Refresher — Honeydew or cantaloupe (80 g) — the user is told to buy it but not what to do with it

## same registry ingredient listed twice (9) — severity: wrong

- `m24` 🍯 Slow Cooker Honey Cashew Chicken — Soy Sauce (low sodium)
- `v5` 🧀 Paneer Tikka Masala Bowl — Fat-Free Cottage Cheese
- `ds9`* 🥕 Protein Carrot Cake — Greek Yogurt (0% fat), Whey Protein Powder
- `m125`* 🥗 Crispy Chicken Caesar Salad — Parmesan
- `sm27`* 🥤 Radiant Carrot-Orange Glow Smoothie — Ice / Water
- `sm32`* 🧃 Citrus–Ginger Immunity Juice — Ice / Water
- `sm36`* 🧃 Pineapple–Cucumber Skin-Refreshing Juice — Ice / Water
- `sm41`* 🧃 Orange Carrot Immunity Booster Juice — Ice / Water
- `sm43`* 🍽️ Cucumber Melon Refresher — Ice / Water

## method names a cut the recipe does not use (4) — severity: wrong

- `m40` 🍗 Baked Chicken Breast & Potato — steps say "thigh" but the ingredients are: Skinless boneless chicken breast (raw)
- `bf25` 🥩 Classic Steak & Smashed Egg Skillet — steps say "steak" but the ingredients are: Lean beef tenderloin (raw)
- `m70` 🥩 Seared Steak & Garlicky Greens — steps say "steak" but the ingredients are: Lean beef tenderloin (raw)
- `m110`* 🌯 Chicken Shawarma Wrap — steps say "breast" but the ingredients are: Chicken thigh (boneless, skinless, raw)

## oven recipe with no temperature (3) — severity: wrong

- `m26` 🥩 Creamy Steak Pasta — says bake/roast but never gives a temperature
- `m15` 🥩 Lean Beef & Potato Roast — says bake/roast but never gives a temperature
- `m72` 🐟 Bali-Spiced Barramundi Plate — says bake/roast but never gives a temperature

## air-fryer recipe with no temperature (1) — severity: wrong

- `m155`* 🦐 Shrimp & Veggie Rice Bowl — no air-fryer temperature

## implausible quantity (1) — severity: wrong

- `bf68`* 🥤 Green Apple & Cinnamon Smoothie — Ice cubes: 960 g per portion

## main course under 300 kcal (29) — severity: nutrition

- `m18` 🍗 Chicken with Mustard & Coffee Sauce — 228 kcal
- `m36` 🐟 Tuna & Chickpea Power Bowl — 225 kcal
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

## very large plate (1) — severity: nutrition

- `bf68`* 🥤 Green Apple & Cinnamon Smoothie — 1477 g of food per portion

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

- `bf44`* 🫙 Protein Berry Yoghurt Bowl — 1 step(s)
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

## same registry food, different macros (12)

- **Tuna (canned in water)** — 116 kcal / 26 g protein (m36) · 109 kcal / 25.5 g protein (sn9) · 109 kcal / 25.5 g protein (m101) · 109 kcal / 25.5 g protein (m160) · 109 kcal / 25.5 g protein (m177) · 109 kcal / 25.5 g protein (m187) · 109 kcal / 25.5 g protein (sn41)
- **Milk (skim / 0%)** — 34 kcal / 3.4 g protein (m12) · 34 kcal / 3.4 g protein (m05) · 34 kcal / 3.4 g protein (m10) · 34 kcal / 3.4 g protein (m06) · 34 kcal / 3.4 g protein (m16) · 34 kcal / 3.4 g protein (v8) · 34 kcal / 3.4 g protein (bf9) · 34 kcal / 3.4 g protein (bf13) · 34 kcal / 3.4 g protein (bf14) · 34 kcal / 3.4 g protein (bf15) · 35 kcal / 3.4 g protein (sm1) · 34 kcal / 3.4 g protein (m85) · 34 kcal / 3.4 g protein (m122) · 34 kcal / 3.4 g protein (bf36) · 34 kcal / 3.4 g protein (bf38) · 34 kcal / 3.4 g protein (bf40) · 34 kcal / 3.4 g protein (ds9) · 34 kcal / 3.4 g protein (bf43)
- **Pasta (dry, whole wheat)** — 348 kcal / 14 g protein (m23) · 348 kcal / 14 g protein (v8) · 348 kcal / 14 g protein (m85) · 348 kcal / 14 g protein (m86) · 354 kcal / 20 g protein (m97) · 354 kcal / 20 g protein (m101) · 354 kcal / 20 g protein (m103) · 348 kcal / 14 g protein (m111) · 348 kcal / 14 g protein (m146) · 348 kcal / 14 g protein (m149) · 348 kcal / 14 g protein (m157) · 348 kcal / 14 g protein (m160) · 348 kcal / 14 g protein (m169)
- **Corn / Sweetcorn** — 86 kcal / 3.2 g protein (hol6) · 86 kcal / 3.2 g protein (hol4) · 86 kcal / 3.2 g protein (m07) · 86 kcal / 3.2 g protein (m58) · 86 kcal / 3.2 g protein (m30) · 86 kcal / 3.2 g protein (m50) · 86 kcal / 3.2 g protein (v7) · 86 kcal / 3.2 g protein (m78) · 81 kcal / 2.6 g protein (m89) · 81 kcal / 2.6 g protein (m93) · 81 kcal / 2.6 g protein (m100)
- **Black Beans (canned, drained)** — 132 kcal / 8.9 g protein (hol6) · 132 kcal / 8.9 g protein (hol4) · 132 kcal / 8.9 g protein (m07) · 132 kcal / 8.9 g protein (m39) · 132 kcal / 8.9 g protein (m06) · 132 kcal / 8.9 g protein (m30) · 132 kcal / 8.9 g protein (v7) · 118 kcal / 6.9 g protein (m89) · 118 kcal / 6.9 g protein (m100)
- **Edamame (shelled)** — 121 kcal / 11 g protein (m47) · 121 kcal / 11 g protein (v2) · 121 kcal / 11 g protein (sn5) · 121 kcal / 11.9 g protein (v10) · 121 kcal / 11.9 g protein (v11) · 121 kcal / 11 g protein (m186) · 121 kcal / 11 g protein (m189) · 121 kcal / 11 g protein (sn31)
- **Peanut Butter (natural)** — 588 kcal / 25 g protein (bf10) · 588 kcal / 25 g protein (pw1) · 588 kcal / 25 g protein (sm2) · 588 kcal / 25 g protein (sm3) · 588 kcal / 25 g protein (bf24) · 588 kcal / 25 g protein (ds5) · 623 kcal / 27.6 g protein (v11) · 588 kcal / 25 g protein (m107) · 588 kcal / 25 g protein (ds7) · 588 kcal / 25 g protein (m132) · 588 kcal / 25 g protein (bf58) · 588 kcal / 25 g protein (ds15) · 588 kcal / 25 g protein (ds17) · 588 kcal / 25 g protein (ds20)
- **Soy Sauce (low sodium)** — 53 kcal / 8.1 g protein (m35) · 53 kcal / 8.1 g protein (m51) · 53 kcal / 8.1 g protein (m61) · 53 kcal / 8.1 g protein (m20) · 53 kcal / 8.1 g protein (m44) · 53 kcal / 8.1 g protein (m24) · 53 kcal / 8.1 g protein (m47) · 53 kcal / 8.1 g protein (v2) · 53 kcal / 8.1 g protein (sn2) · 53 kcal / 8.1 g protein (sn6) · 53 kcal / 8.1 g protein (m66) · 53 kcal / 8.1 g protein (m68) · 53 kcal / 8.1 g protein (m74) · 53 kcal / 8.1 g protein (m75) · 53 kcal / 8.1 g protein (m76) · 53 kcal / 8.1 g protein (m79) · 53 kcal / 8.1 g protein (m88) · 53 kcal / 8.1 g protein (m94) · 53 kcal / 8.1 g protein (m95) · 60 kcal / 10.5 g protein (v10) · 60 kcal / 10.5 g protein (v11) · 53 kcal / 8.1 g protein (m107) · 53 kcal / 8.1 g protein (m108) · 53 kcal / 8.1 g protein (m114) · 53 kcal / 8.1 g protein (m127) · 53 kcal / 8.1 g protein (m132) · 53 kcal / 8.1 g protein (m139) · 53 kcal / 8.1 g protein (sn10) · 53 kcal / 8.1 g protein (m154) · 53 kcal / 8.1 g protein (sn14) · 53 kcal / 8.1 g protein (m155) · 53 kcal / 8.1 g protein (m168) · 53 kcal / 8.1 g protein (m176) · 53 kcal / 8.1 g protein (ds16) · 53 kcal / 8.1 g protein (m182)
- **Passata (tomato sauce)** — 27 kcal / 1.3 g protein (m14) · 27 kcal / 1.3 g protein (m11) · 27 kcal / 1.3 g protein (m58) · 27 kcal / 1.3 g protein (m06) · 27 kcal / 1.3 g protein (m16) · 27 kcal / 1.3 g protein (v1) · 27 kcal / 1.3 g protein (m23) · 27 kcal / 1.3 g protein (m50) · 27 kcal / 1.3 g protein (v6) · 27 kcal / 1.3 g protein (v5) · 27 kcal / 1.3 g protein (m63) · 29 kcal / 1.5 g protein (m97) · 27 kcal / 1.3 g protein (m111) · 27 kcal / 1.3 g protein (m112) · 27 kcal / 1.3 g protein (m124) · 27 kcal / 1.3 g protein (bf46) · 27 kcal / 1.3 g protein (m164) · 27 kcal / 1.3 g protein (m173) · 27 kcal / 1.3 g protein (m174) · 27 kcal / 1.3 g protein (m179) · 27 kcal / 1.3 g protein (m180) · 27 kcal / 1.3 g protein (m181) · 27 kcal / 1.3 g protein (m188) · 27 kcal / 1.3 g protein (m190)
- **Fat-Free Mozzarella (shredded)** — 163 kcal / 36 g protein (m16) · 163 kcal / 36 g protein (m29) · 163 kcal / 36 g protein (bf5) · 163 kcal / 36 g protein (m85) · 143 kcal / 32.1 g protein (m93) · 143 kcal / 32.1 g protein (m97) · 143 kcal / 32.1 g protein (m102)
- **Taco Seasoning (blend)** — 285 kcal / 11 g protein (m58) · 285 kcal / 11 g protein (m86) · 300 kcal / 10 g protein (m89) · 300 kcal / 10 g protein (m93) · 300 kcal / 10 g protein (m100)
- **Soba Noodles (dry)** — 336 kcal / 14 g protein (m66) · 336 kcal / 14.4 g protein (v11)

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
- **Pasta (dry, whole wheat)** — "High-protein pasta", "Protein pasta or wholegrain pasta (dry)", "High-protein pasta (dry)", "Chickpea / high-protein pasta", "Wholewheat lasagne sheets", "Whole-grain pasta", "Whole-grain spaghetti", "Whole wheat pasta"
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

## No findings (118)

`m38` `m39` `m53` `m60` `m32` `m92` `m104` `m105` `m108` `m111` `m112` `m113` `m117` `m121` `bf36` `bf37` `bf38` `ds8` `d6` `bf41` `m126` `m127` `m128` `m129` `bf43` `m134` `m135` `m136` `m138` `m140` `m141` `m144` `sm10` `bf45` `ds12` `bf46` `m150` `m151` `m153` `sn11` `bf47` `sn13` `bf48` `sn14` `sm11` `bf50` `bf52` `m157` `sn15` `bf53` `m159` `m160` `bf56` `bf57` `sn19` `sn21` `bf59` `m165` `bf60` `bf61` `sn22` `m167` `sn23` `bf62` `m170` `bf63` `sm12` `bf65` `bf66` `sm13` `m173` `sm14` `sm15` `sm16` `sm17` `sm19` `sm20` `m174` `m175` `sm21` `bf67` `m184` `m185` `sn29` `sm22` `bf69` `m187` `ds17` `bf71` `sm24` `bf72` `sn31` `sm25` `sn32` `sn33` `sn34` `bf73` `bf74` `ds19` `sn36` `sm28` `sn38` `sm29` `sm30` `ds21` `sm31` `bf76` `sn41` `sm33` `ds22` `sm34` `ds23` `sm37` `sm38` `sm39` `sm40` `sm42` `sm44`
