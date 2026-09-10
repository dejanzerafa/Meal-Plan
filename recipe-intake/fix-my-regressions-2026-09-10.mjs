#!/usr/bin/env node
// fix-my-regressions-2026-09-10.mjs
//
// Twelve recipes where MY OWN fixes from 7–8 Sep introduced new defects. Found
// by reading all 401 recipes end to end rather than by running the rules — the
// rules all passed, because each one only asked "does a cue exist?", never "is
// it in the right place, and does it make sense there?".
//
//   A. m96 — the reheat doneness landed on "No reheating needed; eat cold or at
//      room temperature", producing "...eat cold, until steaming hot all the
//      way through." The rule now ignores "no reheating".
//   B. m107, m115, m146 — the packet-time clause was appended to steps that
//      ALREADY deferred to the packet ("cook to just under the packet time"),
//      because DEFERS looked for "per the packet" and these said "the packet
//      time". Now recognised; the redundant clause is removed here.
//   C. m71, m85, m117 — the minced-meat cue. m71 is beef TENDERLOIN and m117 is
//      BRAISING beef: they were caught because "Coriander (ground)" and "Garlic
//      (minced)" satisfied a rule that scanned the whole ingredient list for a
//      mince word. m85 really is mince, but the cue landed on the bacon step.
//   D. m133, m139, m181, ds9, bf70 — a step added so a bought ingredient was
//      actually used, appended at the END of the method, which put it after
//      "Serve". Each is moved to where it belongs, or merged into the step that
//      should have named the ingredient.
import { readRecipes, setSteps, writeFile } from "../scripts/lib/recipe-file.mjs";

const DRY = process.argv.includes("--dry");
const f = readRecipes();
let src = f.src;
const report = [];

// [id, find, replace-with (null = drop the line), why]
const EDITS = [
  ["m96",  /,\s*until steaming hot all the way through\./, ".",
    "a no-cook jar salad was told to eat it cold until steaming hot"],
  ["m107", /\s*—\s*to the packet time, usually 8–11 min\./, ".",
    "the step already said 'to just under the packet time'"],
  ["m115", /\s*—\s*to the packet time, usually 8–11 min\./, ".",
    "the step already said 'to al dente'"],
  ["m146", /\s*—\s*to the packet time, usually 8–11 min\./, ".",
    "the step already deferred to the packet"],
  ["m71",  /\s*Cook the mince right through until no pink remains and it reads 75°C in the middle\./, "",
    "beef tenderloin, not mince — and the cue was on the rice step"],
  ["m117", /\s*Cook the mince right through until no pink remains and it reads 75°C in the middle\./, "",
    "braising beef, shredded — not mince"],
];

for (const [id, find, repl, why] of EDITS) {
  const r = f.ALL.find(x => x.id === id);
  const steps = r.steps.map(s => find.test(String(s)) ? String(s).replace(find, repl).replace(/\s+$/, "") : s);
  if (JSON.stringify(steps) === JSON.stringify(r.steps)) { report.push(`${id} — NOT MATCHED (already fixed?)`); continue; }
  src = setSteps(src, id, steps);
  report.push(`${id} — ${why}`);
}

// m85 really does use mince; the cue just belongs on the step that browns it.
{
  const r = f.ALL.find(x => x.id === "m85");
  const cue = " Cook the mince right through until no pink remains and it reads 75°C in the middle.";
  let steps = r.steps.map(s => String(s).replace(cue, ""));
  const i = steps.findIndex(s => /brown the lean ground beef/i.test(String(s)));
  if (i < 0) throw new Error("m85: could not find the step that browns the mince");
  steps[i] = String(steps[i]).replace(/\s*$/, "") + cue;
  src = setSteps(src, "m85", steps);
  report.push("m85 — mince cue moved from the bacon step to the step that browns the mince");
}

// Steps that were appended after "Serve". Each is replaced by editing the step
// that should have named the ingredient in the first place.
const RELOCATE = {
  m133: { drop: /^Add the minced garlic clove with the spices and fry 1 min until fragrant\.$/,
          into: [/^Rub chicken with turmeric, cumin, and salt\.$/,
                 "Rub the chicken with turmeric, cumin, salt and the minced garlic clove."] },
  m139: { drop: /^Whisk the sesame oil into the miso glaze before it goes on the salmon\.$/,
          into: [/^Mix miso paste, soy sauce, honey, and ginger into a glaze\.$/,
                 "Mix the miso paste, soy sauce, honey, ginger and sesame oil into a glaze."] },
  m181: { drop: /^Scatter the shredded mozzarella over the top before it goes in the oven\.$/,
          into: [/^Layer with marinara and cheese; bake another 10 minutes\.$/,
                 "Layer with the marinara and scatter the shredded mozzarella over the top, then bake another 10 minutes."] },
  ds9:  { drop: /^Stir the brown sugar substitute into the batter with the other dry ingredients\.$/,
          into: [/^Combine the oat flour, protein powder, cinnamon, ginger, baking powder and baking soda\.$/,
                 "Combine the oat flour, protein powder, brown sugar substitute, cinnamon, ginger, baking powder and baking soda."] },
  bf70: { drop: /^Stir the honey and vanilla extract into the wet mixture before it goes in\.$/,
          into: [/^In a bowl, mix the oats and baking powder, then stir in the almond milk and egg\.$/,
                 "In a bowl, mix the oats and baking powder, then stir in the almond milk, egg, honey and vanilla extract."] },
};
for (const [id, { drop, into }] of Object.entries(RELOCATE)) {
  const r = f.ALL.find(x => x.id === id);
  const [findStep, newText] = into;
  if (!r.steps.some(s => drop.test(String(s).trim()))) { report.push(`${id} — stray step NOT FOUND`); continue; }
  if (!r.steps.some(s => findStep.test(String(s).trim()))) { report.push(`${id} — target step NOT FOUND`); continue; }
  const steps = r.steps
    .filter(s => !drop.test(String(s).trim()))
    .map(s => findStep.test(String(s).trim()) ? newText : s);
  src = setSteps(src, id, steps);
  report.push(`${id} — ingredient folded into the step that uses it, instead of a line after "Serve"`);
}

if (!DRY) writeFile(src);
console.log(`${report.length} recipe(s) corrected${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
