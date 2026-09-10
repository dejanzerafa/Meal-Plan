# Technique & healthy-cooking audit — all 401 recipes

2026-09-10. **Applied 2026-09-10** — 51 mechanical fixes across 51 recipes
(`fix-technique-2026-09-10.mjs`). Fourteen findings were deliberately NOT applied
because their fix is a change of step order rather than a text addition; they are
listed at the end and wait for a decision.

Rules were researched from Serious Eats / Kenji López-Alt, America's Test Kitchen,
Harold McGee's *On Food and Cooking*, USDA FSIS, the UK Food Standards Agency,
EFSA, the US National Cancer Institute and Harvard's Nutrition Source, then
implemented and — this is the part that matters — **validated against the actual
recipes before being believed.**

## The false positives I caught before reporting them

The first run produced 87 findings. Six were wrong, and I only found that by
reading the flagged recipes in full:

| recipe | rule | why it was wrong |
|---|---|---|
| m123 | dairy-added-to-boiling-liquid | the yogurt goes into **drained, mashed** potato, after the boil — not into boiling liquid |
| m85 | garlic-added-with-onion | it is garlic **powder** and onion **powder**, not fresh alliums |
| m44 | green-vegetables-not-shocked | the blanched broccoli goes **straight into a hot wok** — shocking would be pointless |
| m66 | carotenoids-without-fat | the recipe contains **flank steak**; my fat-source list simply did not include meat |
| ds16 | tofu-not-drained-before-searing | the recipe **does** say to press the tofu — but only in a tip, which became a better finding (below) |
| ingId 97 | "firm tofu macros look wrong" | I suspected an error at 76 kcal / 8.1 g protein. USDA lists **two** firm tofu entries — nigari-set at 78/9.0 and calcium-sulfate-set at 144/17.3. The row is defensible. |

The pattern is the one this project keeps re-learning: **the lookalike clause
matters more than the detect pattern.** Every one of those six was a rule firing
on text that looked like the error without being it.

## Myths deliberately NOT encoded

The research surfaced eleven pieces of received kitchen wisdom that are false or
overstated. None became a rule; several became **inverse** checks that flag a
recipe for *repeating* the myth. The library repeats none of them — 0 findings.

- "Searing seals in the juices" — disproved; searing is for crust, not moisture.
- "The alcohol all cooks off" — ~40% remains after 15 min simmering (USDA retention factors).
- "Add oil to the pasta water" — it floats, then makes sauce slide off.
- "Salt makes beans tough" — backwards; salt softens the skins, **acid** is what keeps them firm.
- "Never wash mushrooms" — they absorb only a few percent by weight.
- "Resting lets the juices redistribute" — wrong mechanism, and the sensory benefit is disputed.
- "Rinsing rice removes the arsenic" — removes ~10%; cooking in excess water removes 40–60%.
- "Bring meat to room temperature first" — a thick steak rises only a few degrees in an hour.
- "Salt makes water boil faster" — boiling-point elevation works the other way.
- "Never cook with extra-virgin olive oil" — smoke point is a poor ranking metric; EVOO is oxidatively stable.
- "Keep potatoes out of the fridge (acrylamide)" — FSA **withdrew** this advice.

Three further rules were researched and deliberately left as advisory rather than
failures, because their evidence is genuinely contested: resting meat, charring
meat (HCAs/PAHs), and smoke points.

---

## Retired before use: `no-acid-to-finish`

Researched, implemented, ran clean at 21 findings — and dropped on review.

Every other rule here traces to a measurement: a temperature, a vitamin-retention
percentage, a curdling threshold. This one traced to Samin Nosrat's *Salt Fat
Acid Heat* and chef consensus. Real cooking, but a taste judgement rather than a
fact, and 21 recipes is too many to change on one.

It also could not distinguish *no acid at all* from *acid, added early*. m05
French Onion Pasta was flagged despite containing both Worcestershire and Dijon,
purely because they go into the slow cooker at step 1 — which, for a dish built
on 45 minutes of caramelised onions, is arguably where they belong.

If the idea is wanted later it belongs in a general cooking-tips section, not as
per-recipe edits.

---

## Findings

── pasta-water-not-salted  (31)  live 17 / staged 14
   m02    🥩 Big Mac Protein Pasta             no salted-water instruction
   m09    🍗 Buffalo Ranch Chicken Pasta       no salted-water instruction
   m14    🍗 Chicken Alfredo Red Sauce         no salted-water instruction
   m12    🍗 Chicken Bacon Mac                 no salted-water instruction
   m26    🥩 Creamy Steak Pasta                no salted-water instruction
   m05    🍗 French Onion Pasta                no salted-water instruction
   … 25 more

── technique-only-in-a-note  (18)  live 4 / staged 14
   m37    🐟 Baked Cod & Roasted Baby Potato   pat dry before searing — appears only in a tip, not in the method
   m04    🥩 Beef Mince Bake                   cook in batches — appears only in a tip, not in the method
   m53    🍗 Italian Herb Chicken, Sweet Pot   cook in batches — appears only in a tip, not in the method
   m69    🎃 Roasted Pumpkin Power Bowl        cook in batches — appears only in a tip, not in the method
   m142   🐟 Baked Lemon Dill Cod with Garli   pat dry before searing — appears only in a tip, not in the method
   m143   🐟 One-Pan Lemon Garlic Tilapia wi   cook in batches — appears only in a tip, not in the method
   … 12 more

── rice-not-rinsed  (11)  live 0 / staged 11
   m88    🍯 Honey Garlic Chicken & Rice       basmati/jasmine with no rinse step
   m89    🥩 Steak Burrito Meal Prep Bowls     basmati/jasmine with no rinse step
   m92    🌶️ Lemon Pepper Chicken Rice Bowl   basmati/jasmine with no rinse step
   m94    🍚 Crispy Garlic Chicken & Fried R   basmati/jasmine with no rinse step
   m100   🌮 Chicken Burrito Bowl              basmati/jasmine with no rinse step
   m105   🐟 BBQ Salmon with Mango Avocado S   basmati/jasmine with no rinse step
   … 5 more

── spices-not-bloomed-in-fat  (8)  live 3 / staged 5
   hol6   🍗 🇺🇸 BBQ Chicken & Corn Rice Bo   Drain corn and black beans. Mix with diced tomatoes, cumin, smoked paprika, salt, and a sq
   m45    🍗 Chicken & Red Lentil Soup         Add canned tomatoes, lentils, chicken broth, turmeric, cumin, paprika, salt, and pepper. S
   m50    🍗 Slow-Cooked Pulled Chicken & Ri   In a slow cooker, add the chicken breasts, broth, passata, onion, garlic, diced bell peppe
   m167   🌿 Creamy Coconut Lentil Curry       Add lentils, coconut milk, broth, curry powder, and salt.
   sn26   🌿 Savory Mushroom Lentil Stew       Add lentils, thyme, paprika, and broth.
   m174   🫘 Chickpea & Spinach Coconut Stew   Add tomatoes, chickpeas, and curry powder; simmer 5 minutes.
   … 2 more

── green-vegetables-not-shocked  (4)  live 4 / staged 0
   m40    🍗 Baked Chicken Breast & Potato     Steam or blanch green beans 4 min. Season with salt and pepper.
   hol2   🦃 Slow-Cooker Turkey & Butternut    Meanwhile, steam or blanch green beans until just tender, about 5 min. Season with salt an
   m70    🥩 Seared Steak & Garlicky Greens    Trim green beans and asparagus, blanch 3 min.
   m73    🍗 Herb Green Rice Chicken Bowl      Cook rice. Once done, stir through blanched and pureed spinach + herbs to make green rice 

── seasoning-only-at-the-end  (3)  live 0 / staged 3
   m104   🥔 Japanese Potato Salad             salt appears once, in the last step
   m160   🐟 Creamy Tuna & Spinach Pasta       salt appears once, in the last step
   m171   🌾 Broccoli & Cheddar Quinoa Bowl    salt appears once, in the last step

── delicate-herbs-added-at-start  (2)  live 0 / staged 2
   m128   🧆 Greek Turkey Meatballs & Tzatzi   Mix the turkey with the panko, garlic, parsley, oregano, cumin, 3 g salt and plenty of pep
   m142   🐟 Baked Lemon Dill Cod with Garli   Place the cod on a parchment-lined baking sheet; drizzle with the olive oil and scatter ov

── garlic-added-with-onion  (1)  live 1 / staged 0
   m38    🍗 Chicken & Cauliflower Rice Bowl   In the same pan, cook diced onion and garlic 3 min. Add canned tomatoes and simmer 5 min.

── carotenoids-without-fat  (1)  live 1 / staged 0
   sn6    🍗 Minced Chicken Thai Herb Salad    no fat source for carotenoid absorption

── tofu-not-drained-before-searing  (1)  live 0 / staged 1
   ds16   🌱 Crispy Air-Fried Tofu Bites       Arrange the tofu pieces in a single layer in your air fryer basket and cook at 190°C for 1

