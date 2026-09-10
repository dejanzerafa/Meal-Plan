#!/usr/bin/env node
// fix-groupF-2026-09-10.mjs — technique, quantities and data tagging.
//
// The soft group, but most of it is not soft at all once you look:
//
//   EGGS FILED AS DAIRY   28 ingredient rows across 26 recipes tagged Dairy,
//                         Vegetables or Carbs. 60 rows use Protein. The tag
//                         drives the shopping-list grouping, so eggs were
//                         landing under Dairy on a quarter of the recipes that
//                         use them. Normalised to Protein.
//   PHANTOM GARNISHES     23 more of the same defect group A dealt with: the
//                         method finishes a dish with something nobody bought.
//   COUNT CONTRADICTIONS  a recipe that says portions: 1 and then fills two
//                         glasses, or slices into nine squares.
//   TECHNIQUE             whey blended into hot espresso, carrots stirred in
//                         raw, rare tuna in a meal-prep box, a doneness range
//                         that counts downwards.
//
// Left alone and reported instead: portion sizes that are merely large or small
// (m121, m162, m188, sn30, sn35). Those are recipe-design opinions, not errors.
import { readRecipes, editRecipe, setSteps, setItem, writeFile } from "../scripts/lib/recipe-file.mjs";

const DRY = process.argv.includes("--dry");
const f = readRecipes();
let src = f.src;
const report = [];
const stepsOf = (source, id) => {
  const m = source.match(new RegExp(`\\bid:\\s*"${id}"[\\s\\S]*?steps:\\s*\\[([\\s\\S]*?)\\n        \\]`));
  if (!m) throw new Error(`${id}: steps not found`);
  return JSON.parse("[" + m[1].replace(/,\s*$/, "") + "]");
};

// ── 1. eggs are a protein, not a dairy ──────────────────────────────────────
{
  let n = 0; const recipes = new Set();
  for (const r of f.ALL) for (const it of r.batchItems || []) {
    if (!/\begg/i.test(it.label || "")) continue;
    if (/eggplant|aubergine|egg noodle|tagliatelle/i.test(it.label || "")) continue;
    if (it.cat === "Protein") continue;
    src = setItem(src, r.id, it.key, {});          // ensure the row exists
    src = editRecipe(src, r.id, blk => {
      const lineRe = new RegExp(`^.*\\bkey:\\s*"${it.key}".*$`, "m");
      const line = blk.match(lineRe);
      return blk.replace(lineRe, () => line[0].replace(/\bcat:\s*"[^"]*"/, `cat: "Protein"`));
    });
    n++; recipes.add(r.id);
  }
  report.push(`${n} egg rows re-tagged Protein across ${recipes.size} recipes (they were filed under Dairy, Vegetables or Carbs)`);
}

// ── 2. text fixes ───────────────────────────────────────────────────────────
const TEXT = [
  // phantom garnishes — the method finishes with something nobody bought
  ["m63", "Serve topped with pickled cherry tomatoes and parmesan crumbs.", "Serve topped with the parmesan.", "cherry tomatoes are not an ingredient"],
  ["m64", "Drizzle with balsamic glaze and basil oil to serve.", "Finish with a grind of black pepper to serve.", "balsamic glaze and basil oil are not ingredients"],
  ["m65", "Finish with spinach, spring onion, sesame seeds, and crispy leeks.", "Finish with the spinach and spring onion.", "sesame seeds and crispy leeks are not ingredients"],
  ["m66", "Toss noodles with dressing, cucumber, cherry tomatoes, and fresh herbs.", "Toss the noodles with the dressing, cucumber and cherry tomatoes.", "fresh herbs are not an ingredient"],
  ["m66", "Top with sliced steak and shallots.", "Top with the sliced steak.", "shallots are not an ingredient"],
  ["m68", "Top with crushed cashews and wonton skin strips (baked, not fried).", "Top with the crushed cashews.", "wonton skins are not an ingredient"],
  ["m69", "Cube pumpkin and roast at 200°C with a light mist of cooking spray, cumin, and paprika for 25 min.", "Cube the pumpkin and roast at 200°C with a light mist of cooking spray and the cumin for 25 min.", "paprika is not an ingredient"],
  ["m69", "Build bowl: kale base, roasted pumpkin and chickpeas, feta, pumpkin seeds, and cranberries.", "Build the bowl: kale base, roasted pumpkin and chickpeas, feta and pumpkin seeds.", "cranberries are not an ingredient"],
  ["m74", "Build bowl: rice, sliced glazed chicken, veggies, pickled slaw, and crushed cashews.", "Build the bowl: rice, sliced glazed chicken, vegetables and crushed cashews.", "pickled slaw is not an ingredient"],
  ["m76", "Top each bowl with a fried egg, crispy shallots, and pickles.", "Top each bowl with a fried egg.", "crispy shallots and pickles are not ingredients"],
  ["m78", "Serve chicken over rice with peppers and corn. Top with super seeds and crispy garlic.", "Serve the chicken over rice with the peppers and corn.", "super seeds and crispy garlic are not ingredients"],
  ["m82", "Top generously with chicken-egg mixture. Add chimichurri drizzle.", "Top generously with the chicken and egg mixture.", "chimichurri is not an ingredient"],
  ["m83", "Layer: lettuce, tomato, sliced chicken, avocado, and tomato relish.", "Layer: lettuce, tomato, sliced chicken and avocado.", "tomato relish is not an ingredient"],
  ["sm1", "Add protein powder and a pinch of cinnamon and Himalayan salt.", "Add the protein powder with a pinch of cinnamon and salt.", "Himalayan salt is not an ingredient; salt is a store-cupboard trace"],
  ["sm6", "Add a pinch of Himalayan salt.", "Add a pinch of salt.", "Himalayan salt is not an ingredient"],
  ["v6",  "Portion equal eggs + sauce into each container. Serve with wholegrain pita or rice cakes.", "Portion the eggs and sauce equally into each container.", "pita and rice cakes are not ingredients"],
  ["sn2", "Shred chicken and mix with julienned pickled carrot and fresh herbs.", "Shred the chicken and mix it with the julienned carrot and spring onion.", "nothing is pickled and no herb is on the list; the spring onion is"],
  ["sn16","Grill zucchini and bell peppers until tender.", "Grill the zucchini until tender and lightly charred.", "bell peppers are not an ingredient"],
  ["sn28","Drizzle olive oil and balsamic glaze over the top.", "Drizzle the olive oil over the top.", "balsamic glaze is not an ingredient"],
  ["sn37","Sprinkle the chopped bell pepper and olives on top, distributing them so each bite has a mix of flavors and colors.", "Scatter the chopped olives on top, distributing them so each bite gets some.", "bell pepper is not an ingredient"],
  ["v2",  "Portion rice into containers, top with tofu/veggie mix, and sprinkle sesame seeds. Add a spoonful of cottage cheese to each portion.", "Portion the rice into containers and top with the tofu and vegetable mix. Add a spoonful of cottage cheese to each portion.", "sesame seeds are not an ingredient; only sesame oil is"],
  ["m50", "In a slow cooker, add chicken breasts, broth, passata, onion, garlic, diced bell pepper, smoked paprika, cumin, garlic powder, and chilli powder.", "In a slow cooker, add the chicken breasts, broth, passata, onion, garlic, diced bell pepper, smoked paprika and cumin.", "garlic powder and chilli powder are not ingredients"],
  ["d1",  "In a large bowl, mix together: Greek yogurt, pumpkin purée, self-rising flour, coconut flour, cocoa powder, protein powder, baking powder, vanilla extract, Truvia brown sugar, and egg.", "In a large bowl, mix together: Greek yogurt, pumpkin purée, self-rising flour, coconut flour, cocoa powder, protein powder, baking powder, vanilla extract, brown sugar alternative and egg.", "the method used a brand name the ingredient list does not"],
  ["d1",  "Frost cooled cookies. Top with crushed chocolate sandwich cookies if desired.", "Frost the cooled cookies.", "chocolate sandwich cookies are not an ingredient and carried no 'not counted' note"],
  ["ds6", "Blend cottage cheese, cocoa powder, maple syrup, vanilla extract, and a pinch of salt until completely smooth and mousse-like (about 60 seconds).", "Blend the cottage cheese, cocoa powder and maple syrup with a pinch of salt until completely smooth and mousse-like, about 60 seconds.", "vanilla extract is not an ingredient"],
  ["m142","Place cod on parchment-lined baking sheet; drizzle with olive oil and sprinkle with dill, salt, and pepper.", "Place the cod on a parchment-lined baking sheet; drizzle with the olive oil and scatter over the dill, salt and pepper.", "tidy"],

  // count contradictions
  ["bf56","In two clear glasses, layer yogurt, mango, pineapple, and granola.", "In a glass, layer the yogurt, mango, pineapple and granola.", "portions is 1 but the method filled two glasses"],
  ["bf75","In two glasses, layer coconut yogurt, granola, and mixed fruits.", "In a glass, layer the coconut yogurt, granola and mixed fruit.", "portions is 1 but the method filled two glasses"],
  ["bf75","Repeat the layers until the glasses are full.", "Repeat the layers until the glass is full.", "same"],

  // technique
  ["bf9", "Blend the whey protein with the espresso-milk for the protein hit.", "Let the espresso-milk cool to lukewarm, then whisk in the whey — hot liquid makes whey clump rather than dissolve.", "whey denatures and clumps in hot liquid"],
  ["m01", "Cook brown rice. Stir in peas, carrots and spinach off heat — 35–40 min.", "Cook the brown rice 35–40 min, adding the diced carrots for the last 10 min and stirring the peas and spinach through off the heat.", "carrots stirred in off the heat stay raw"],
  ["m25", "Air fry at 190°C for 12–15 min until crispy and cooked through. OR oven bake at 190°C for 18–22 min. Cook until the thickest part reads 75°C.", "Spray the coated pieces lightly with oil, then air fry at 190°C for 12–15 min until crispy, or oven bake at 190°C for 18–22 min. Cook until the thickest part reads 75°C.", "a dry flour coating stays pale in an air fryer — the near-identical m21 sprays it"],
  ["m48", "Heat a heavy pan or grill pan over very high heat. Sear tuna 90 seconds per side for rare, or 2.5 min per side for cooked through.", "Heat a heavy pan or grill pan over very high heat. Sear the tuna 2.5 min per side until cooked through — this is a meal-prep dish that will be chilled and eaten over several days, so cook it through rather than leaving it rare.", "rare fish stored for days is a food-safety risk this app should not offer"],
  ["m51", "Remove rice from pan. Sear steak cubes over high heat until medium-rare (130–60°C internal).", "Remove the rice from the pan. Sear the steak cubes over high heat until medium-rare, 54–57°C internally.", "the range counted downwards and both figures were wrong"],
  ["hol3","Crumble feta and add a dollop of mint yogurt sauce over each container.", "Crumble over the feta and spoon the mint yogurt sauce over each container — it is a full sauce serving, not a garnish.", "171 g per portion is a third of the plate, not a dollop"],
  ["sm43","Add the honeydew or cantaloupe to the blender with everything else.", "", "the melon was already added in step 1; this line added it again after blending and chilling"],
  ["sn31","Steam the edamame for about 5 minutes, or just until the pods become bright green and tender, making sure they stay slightly firm.", "Steam the shelled edamame for about 5 minutes, until bright green and tender but still slightly firm.", "the recipe buys shelled edamame; the method described pods"],
  ["sn31","Sprinkle with sea salt, letting it cling lightly to the warm pods.", "Sprinkle with sea salt while the beans are still warm so it clings.", "same"],
  ["sn31","💡 Pull the steamer off the heat the moment the pods turn vivid green; another 2 minutes and the beans go dull, mealy and lose their bite.", "💡 Pull the steamer off the heat the moment the beans turn vivid green; another 2 minutes and they go dull, mealy and lose their bite.", "same"],
];
for (const [id, find, repl, why] of TEXT) {
  const cur = stepsOf(src, id);
  if (!cur.some(s => String(s) === find)) { report.push(`${id} — NOT MATCHED: ${find.slice(0, 50)}…`); continue; }
  const next = repl === "" ? cur.filter(s => String(s) !== find) : cur.map(s => String(s) === find ? repl : s);
  src = setSteps(src, id, next);
  report.push(`${id} — ${why}`);
}

// ── 3. cheese slices for every sandwich ─────────────────────────────────────
for (const [id, key, qty, portions] of [["bf2", "bf2_cheese", 3, 3], ["bf12", "bf12_cheese", 4, 4]]) {
  const r = f.ALL.find(x => x.id === id);
  const it = (r.batchItems || []).find(i => /cheese/i.test(i.label || "") && i.unit === "whole");
  if (!it) { report.push(`${id} — cheese row not found`); continue; }
  if (it.qty === qty) continue;
  src = setItem(src, id, it.key, { qty });
  report.push(`${id} — cheese ${it.qty} → ${qty} slices (the method puts one on each of ${portions} sandwiches)`);
}

// ── 4. m19: cubed salmon does not need 15–20 min ────────────────────────────
{
  const cur = stepsOf(src, "m19");
  const i = cur.findIndex(s => /air.?fry/i.test(String(s)) && /1[05]\s*[–-]\s*20/.test(String(s)));
  if (i >= 0) {
    const before = cur[i];
    cur[i] = String(cur[i]).replace(/1[05]\s*[–-]\s*20\s*min/i, "8–10 min");
    src = setSteps(src, "m19", cur);
    report.push(`m19 — cubed salmon 15–20 min → 8–10 min at 180°C (it was drying out before the wrap step)`);
  } else report.push("m19 — air-fry time not found, skipped");
}

if (!DRY) writeFile(src);
console.log(`${report.length} change(s)${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
