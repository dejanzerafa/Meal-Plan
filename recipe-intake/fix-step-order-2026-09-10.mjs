#!/usr/bin/env node
// fix-step-order-2026-09-10.mjs
//
// The findings the mechanical technique fixer deliberately left alone, because
// the fix is a change of step ORDER rather than a sentence you can append.
// Written out by hand, one recipe at a time, after reading each in full.
//
// SPICES INTO THE FAT (5 recipes)
// Most of the aroma in ground cumin, paprika, turmeric and curry powder is
// fat-soluble. Tipped straight into stock or coconut milk they taste raw and
// dusty; 30–60 seconds in the hot oil first extracts and distributes them. This
// is the tarka principle, and it costs nothing but the order of two lines.
//
// THREE FLAGGED RECIPES ARE NOT FIXED, AND SHOULD NOT BE:
//   hol6  the cumin goes into a COLD bean-and-corn salsa — there is no fat stage
//         to bloom in, and a cold salsa is a legitimate place for raw spice.
//   m50   a slow cooker with no frying stage at all. Blooming would mean adding
//         a pan the recipe does not use.
//   sn39  a cold tahini dip. Tahini is already the fat, and the dip is never
//         heated.
//
// SEASON IN LAYERS (2 recipes)
// Salt added only in the last line sits on the surface. These two get a pinch at
// the earlier stages and a taste-and-adjust at the end instead.
import { readRecipes, setSteps, writeFile, verifyBlocks } from "../scripts/lib/recipe-file.mjs";

const DRY = process.argv.includes("--dry");
let file = readRecipes();
let src = file.src;
const report = [];

// [recipe, [exact old step, new step], …]
const EDITS = {
  m45: [
    ["Set Instant Pot to Sauté. Cook onion, garlic, carrot, and celery in a spray of oil for 5 min.",
     "Set Instant Pot to Sauté. Cook onion, garlic, carrot, and celery in a spray of oil for 5 min, then stir in the turmeric, cumin and paprika and cook 30–60 seconds until fragrant."],
    ["Add canned tomatoes, lentils, chicken broth, turmeric, cumin, paprika, salt, and pepper. Stir well.",
     "Add canned tomatoes, lentils, chicken broth, salt, and pepper. Stir well."],
  ],
  m167: [
    ["Heat coconut oil in a pot, sauté onion and garlic until soft.",
     "Heat coconut oil in a pot and sauté the onion and garlic until soft, then stir in the curry powder and cook 30–60 seconds until fragrant."],
    ["Add lentils, coconut milk, broth, curry powder, and salt.",
     "Add lentils, coconut milk, and broth."],
  ],
  sn26: [
    ["Heat olive oil in a pot; sauté onion, garlic, and mushrooms until golden.",
     "Heat olive oil in a pot; sauté onion, garlic, and mushrooms until golden, then stir in the paprika and thyme and cook 30–60 seconds until fragrant."],
    ["Add lentils, thyme, paprika, and broth.", "Add the lentils and broth."],
  ],
  m174: [
    ["Heat olive oil, sauté garlic until fragrant.",
     "Heat olive oil and sauté the garlic until fragrant, then stir in the curry powder and cook 30 seconds more until it smells toasted rather than dusty."],
    ["Add tomatoes, chickpeas, and curry powder; simmer 5 minutes.",
     "Add the tomatoes and chickpeas; simmer 5 minutes."],
  ],
  m175: [
    ["Heat olive oil in a pot; sauté onion and garlic until fragrant.",
     "Heat olive oil in a pot; sauté onion and garlic until fragrant, then stir in the cumin and cook 30–60 seconds until it smells toasted."],
    ["Add lentils, broth, carrots, celery, cumin, salt, and pepper.",
     "Add lentils, broth, carrots, celery, salt, and pepper."],
  ],
  // ── season in layers ──────────────────────────────────────────────────────
  m104: [
    ["Boil the potato cubes 15–18 min until a knife slides in with no resistance. Drain and let the steam dry off.",
     "Boil the potato cubes in well-salted water 15–18 min until a knife slides in with no resistance. Drain and let the steam dry off — potato takes salt while it is cooking far better than after."],
    ["Fold in the chicken, cucumber, spring onion and quartered eggs. Season and chill at least 30 min before eating.",
     "Fold in the chicken, cucumber, spring onion and quartered eggs. Taste, adjust the salt and pepper, and chill at least 30 min before eating."],
  ],
  m171: [
    ["In a skillet, heat olive oil and sauté garlic for 1 minute.",
     "In a skillet, heat olive oil and sauté the garlic with a pinch of salt for 1 minute."],
    ["Season with salt and pepper, then serve warm.",
     "Taste, adjust the salt and pepper, and serve warm."],
  ],
};

for (const [rid, pairs] of Object.entries(EDITS)) {
  const r = [...file.RECIPES, ...file.PENDING].find(x => x.id === rid);
  if (!r) throw new Error(`${rid}: not found`);
  const steps = (r.steps || []).slice();
  for (const [oldS, newS] of pairs) {
    const i = steps.findIndex(s => s.trim() === oldS.trim());
    // Fail loudly rather than silently skipping — a fixer that reports success
    // while changing nothing is the failure mode this project keeps hitting.
    if (i < 0) throw new Error(`${rid}: step not found verbatim:\n  ${oldS}`);
    steps[i] = newS;
    report.push(`${rid} step ${i + 1}: "${oldS.slice(0, 52)}…" → "${newS.slice(0, 52)}…"`);
  }
  src = setSteps(src, rid, steps);
}

const bad = verifyBlocks(src);
if (bad.length) throw new Error("block corruption:\n" + bad.join("\n"));
if (!DRY) writeFile(src);
console.log(`${report.length} change(s) across ${Object.keys(EDITS).length} recipes${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
