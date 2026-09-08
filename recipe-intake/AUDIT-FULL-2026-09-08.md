# Full recipe audit — 2026-09-08

Every recipe in the app: **401** (171 live, 230 staged). This is a fresh pass, not a re-run — the 2026-09-07 findings are now assertions in the regression suite and pass by construction. `*` marks a staged recipe.

Nothing here has been changed.

## Summary

| Finding | Recipes |
|---|---|
| duplicate recipe names | 0 |
| same food, different macros between recipes | 0 |
| the two macro banks disagree on protein/carbs/fat | 0 foods |

**Total findings: 0** across 0 recipes.

Severity: **safety** first, then **wrong** (the recipe misstates itself), **nutrition**, **quality**, **cosmetic**.

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

## No findings (401)

`hol10` `m40` `m37` `hol6` `m13` `m04` `m02` `hol4` `m09` `m28` `m38` `m45` `m14` `m12` `m18` `v3` `m07` `m31` `m26` `m21` `m43` `m05` `m10` `m35` `m46` `v4` `m11` `hol9` `m39` `hol3` `m51` `m52` `m53` `m54` `m55` `m56` `m57` `m58` `m59` `m60` `m61` `m62` `m25` `m06` `m16` `hol8` `m22` `m20` `m44` `m15` `m08` `m30` `m33` `v1` `m01` `m03` `m23` `m41` `m49` `m29` `hol1` `hol7` `m19` `m34` `m48` `m32` `m24` `m50` `hol2` `hol5` `m27` `m47` `v2` `m36` `v9` `v6` `v8` `v5` `v7` `m42` `bf1` `bf2` `bf3` `bf4` `bf5` `bf6` `bf7` `bf8` `bf9` `bf10` `bf11` `bf12` `bf13` `bf14` `bf15` `d5` `ds2` `d4` `d1` `pw2` `pw0` `pw6` `pw4` `pw3` `pw5` `pw1` `sm1` `sm2` `sm3` `sm4` `sm5` `sm6` `sm7` `sm8` `sm9` `sn2` `sn3` `sn4` `sn5` `sn6` `sn7` `sn8` `bf16` `bf17` `bf18` `bf19` `bf20` `bf21` `bf22` `bf23` `bf24` `bf25` `bf26` `bf27` `bf28` `bf29` `bf30` `bf31` `bf32` `m63` `m64` `m65` `m66` `m67` `m68` `m69` `m70` `m71` `m72` `m73` `m74` `m75` `m76` `m78` `m79` `m80` `m81` `m82` `m83` `m84` `ds3` `ds4` `m85` `m86` `sn9` `bf33` `pw7` `ds5` `ds6` `bf34` `bf35` `m88` `m89` `m90` `m91` `m92` `m93` `m94` `m95` `m96` `m97` `m98` `m99` `m100` `m101` `m102` `m103` `v10` `v11` `m104` `m105` `m106` `m107` `m108` `m109` `m110` `m111` `m112` `m113` `m114` `m115` `m116` `m117` `m118` `m119` `m120` `m121` `m122` `m123` `bf36` `bf37` `bf38` `bf39` `ds7` `m124` `ds8` `bf40` `d6` `bf41` `ds9` `m125` `m126` `m127` `m128` `m129` `ds10` `bf43` `bf44` `m131` `ds11` `m132` `m133` `m134` `m135` `m136` `m137` `m138` `m139` `m140` `m141` `m142` `m143` `m144` `m145` `m146` `m147` `sm10` `m148` `bf45` `ds12` `m149` `bf46` `m150` `sn10` `m151` `m152` `m153` `sn11` `m154` `sn12` `bf47` `sn13` `bf48` `sn14` `sm11` `m155` `bf49` `bf50` `bf51` `m156` `bf52` `m157` `sn15` `bf53` `m158` `m159` `sn16` `bf54` `m160` `sn17` `sn18` `bf55` `ds13` `bf56` `bf57` `m161` `ds14` `sn19` `bf58` `m162` `m163` `sn20` `sn21` `bf59` `m164` `m165` `bf60` `bf61` `m166` `sn22` `m167` `m168` `m169` `sn23` `bf62` `m170` `sn24` `bf63` `bf64` `sm12` `sn25` `bf65` `m171` `m172` `bf66` `sm13` `m173` `ds15` `sm14` `sm15` `sm16` `sm17` `sm18` `sm19` `sn26` `sm20` `m174` `m175` `sm21` `m176` `sn27` `m177` `sn28` `ds16` `m178` `m179` `m180` `m181` `bf67` `m182` `m183` `m184` `bf68` `m185` `m186` `sn29` `sn30` `sm22` `bf69` `m187` `sm23` `bf70` `m188` `m189` `ds17` `bf71` `sm24` `bf72` `m190` `sn31` `sm25` `sn32` `sn33` `sn34` `sm26` `m191` `sn35` `bf73` `ds18` `bf74` `ds19` `sn36` `sn37` `sm27` `sm28` `sn38` `sm29` `sm30` `bf75` `ds20` `sn39` `sn40` `ds21` `sm31` `bf76` `sn41` `sm32` `sm33` `ds22` `sm34` `sm35` `ds23` `sm36` `sm37` `sm38` `sm39` `sm40` `sm41` `sm42` `sm43` `sm44`
