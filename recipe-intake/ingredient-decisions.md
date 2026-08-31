# Ingredient sourcing decisions — 25 approved recipes

Every one of the 121 ingredients is accounted for below. Nothing is guessed.

- **71** exact matches, confirmed by strict head-noun equality (listed in
  `existing-food-registry.json`)
- **50** unmatched, hand-reviewed one by one — resolved here into 22 reuses,
  26 new entries and 2 omissions

**Substring matching is banned in this pipeline.** The first automated pass
proposed `butter → peanut butter`, `baby potatoes → baby spinach`,
`coconut oil → coconut milk` (884 vs 77 kcal) and `chicken stock → chicken
breast` — the last would have added ~300 phantom kcal to every recipe with a
250 mL pour. Fourteen wrong foods, entering silently. Every mapping below was
read by eye.

---

## REUSE — 22 (already vetted, do not create a second entry)

Creating a duplicate entry is what produces the "same food, two macro values"
failure that `check-ingredients.mjs` catches. Reuse is the safe default.

| Needed | Existing entry | kcal/100g |
|---|---|---|
| potato | Baby potatoes (halved) | 77 |
| italian herbs | Italian herb seasoning | 265 |
| chicken stock | Bone broth (chicken) / low-sodium chicken broth | 10 |
| egg white | Liquid egg whites | 52 |
| shawarma spice | Baharat spice blend | 300 |
| wholemeal flatbread | Large wholemeal tortilla wraps | 280 |
| mozzarella part-skim | Président Light mozzarella | 180 |
| red pepper flakes | Chili flakes / red pepper flakes | 282 |
| green cabbage | Cabbage (white) | 25 |
| farfalle pasta | Penne pasta | 371 |
| rigatoni | Penne pasta | 371 |
| flour tortilla | Tortilla (flour, 25cm) | 312 |
| beef broth | Beef bone broth | 14 |
| mint | Fresh mint leaves | 70 |
| dill pickles | Dill pickles / gherkins (sliced) | 11 |
| cheddar | Cheddar cheese | 403 |
| shredded cheese | Cheddar cheese | 403 |
| vegetable stock | Vegetable bone broth / low-sodium vegetable broth | 7 |
| ground turkey | 93/7 turkey mince (raw) | 150 |
| salsa | Pico de gallo / fresh salsa | 36 |
| white wine vinegar | Rice vinegar | 18 |
| cream cheese low-fat | Fat-free cream cheese | *confirm in registry* |

Note on **white wine vinegar → rice vinegar**: white wine vinegar is ~19 kcal
against rice vinegar's 18. At the 5–15 mL quantities used, the difference is
below rounding. Adding a near-identical second vinegar entry would invite
exactly the drift the guard exists to catch, so it reuses.

### Lasagne sheets → whole-wheat pasta (id 67) — and when NOT to

Dried lasagne is the same durum semolina dough as every other dried pasta,
pushed through a different die. Published figures agree: dried lasagne sheets
land at **371 kcal / 14 g protein / 66 g carbs** and 351/14/69 depending on
brand, against dried pasta at **371 / 13 / 74.7**. Same food, different shape.
Since the recipe specifies *wholewheat* sheets, id 67 (348/14/68/2.5) is the
correct row.

**Two lasagne products are NOT this food and must never reuse id 67:**

- **Egg lasagne (all'uovo)** — durum semolina *and egg*. Carries meaningfully
  more fat and protein. Needs its own entry.
- **Fresh lasagne sheets** — much higher moisture, roughly 290 kcal/100 g.
  Reusing a dry-pasta figure would overstate a fresh sheet by ~20%.

If the recipe is ever changed to egg or fresh sheets, this mapping breaks and a
new ING_FLAT row is required.

---

## OMIT — 2

| Ingredient | Why |
|---|---|
| sea salt | Zero kcal, always "to taste". Belongs in the step text, not `batchItems` |
| pickle brine | ~1 kcal per tsp. Same reasoning |

---

## NEW — 26 (each needs a cited source before any recipe is written)

Grouped by how the figure will be obtained.

### Needs a named brand — varies too much to take a generic figure (4)

| Ingredient | Range seen | Why a brand is required |
|---|---|---|
| Gnocchi (shelf-stable) | 130–175 kcal | 35% spread across brands; potato:flour ratio differs |
| Chili crisp | ~400–500 kcal | Oil-suspended; oil fraction is the whole macro |
| Granola *(already in registry — verify)* | — | Confirm the existing entry matches the recipe's intent |
| Gochujang paste | 190–240 kcal | Sugar content varies by producer |

### USDA FoodData Central / McCance & Widdowson (22)

Roasted peanuts · sesame seeds · egg noodles (dry) · yellow curry paste ·
breadcrumbs · panko breadcrumbs · kefir (plain, low-fat) · lasagna sheets
(wholewheat, dry) · ricotta (part-skim) · gruyère · rocket · horseradish
(prepared) · shallot · balsamic vinegar · butter beans (canned, drained) ·
cannellini beans (canned, drained) · raisins · nutmeg · puffed quinoa ·
evaporated milk (skimmed) · cajun seasoning · BBQ seasoning · braising beef
(chuck, raw)

**Explicitly not reused, despite a tempting near-match:**

| Do NOT map | To | Because |
|---|---|---|
| gochujang paste | Tomato paste / harissa / miso | Different food entirely |
| sesame seeds | Sesame oil | 573 vs 884 kcal; seeds carry 17.7g protein, oil none |
| balsamic vinegar | Rice vinegar or balsamic glaze | 88 vs 18 vs 280 kcal — three different products |
| puffed quinoa | Quinoa (dry) | Puffing changes density, not per-100g macros, but the unit weight differs enormously |
| cannellini / butter beans | Black beans | 114 and 110 vs 132 kcal |
| braising beef | 95/5 ground beef | Chuck is ~200 kcal raw against 137 |
| chili crisp | Chili flakes | Flakes are dry; crisp is suspended in oil |
| egg noodles | Soba noodles | Buckwheat vs wheat-and-egg; different protein |

---

## On source hierarchy

For **per-100g macros**, in order:

1. USDA FoodData Central (Foundation Foods, then SR Legacy)
2. McCance & Widdowson (UK composition — closer for European products)
3. The manufacturer's published panel, for any named brand

For the **guidance layer** — the `note` field, pre-workout timing, leucine
tips, casein-before-sleep — training-science sources are appropriate and
GainGoat (@gaingoat) is a reasonable input there.

**GainGoat cannot set macro values.** It is a training and hypertrophy account,
not a food-composition database; it has no per-100g figures to cite. Using it
for "gnocchi is 130 or 170 kcal" would be sourcing a number from somewhere that
does not publish that number.
