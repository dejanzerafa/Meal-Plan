#!/usr/bin/env node
// Trace garnishes the method calls for that are not on the shopping list, in
// the two recipes group A had already opened. Same treatment as sn7's lemon:
// the recipe works without them, and putting capers on a shopping list for a
// maybe is worse than not mentioning them.
import { readRecipes, setSteps, writeFile } from "../scripts/lib/recipe-file.mjs";
const f = readRecipes();
let src = f.src; const rep = [];
const stepsOf = (source, id) => {
  const m = source.match(new RegExp(`\\bid:\\s*"${id}"[\\s\\S]*?steps:\\s*\\[([\\s\\S]*?)\\n        \\]`));
  return JSON.parse("[" + m[1].replace(/,\s*$/, "") + "]");
};
const EDITS = [
  ["bf26", "Mash avocado with lemon, salt, and pepper.", "Mash the avocado with salt and pepper.", "lemon is not an ingredient"],
  ["bf26", "Top with super seeds, capers if available, and a lemon wedge.", "Finish with a grind of black pepper.", "seeds, capers and lemon are not ingredients"],
  ["bf30", "Wilt spinach in a non-stick pan with garlic and a splash of water.", "Wilt the spinach in a non-stick pan with a splash of water.", "garlic is not an ingredient"],
];
for (const [id, find, repl, why] of EDITS) {
  const cur = stepsOf(src, id);
  if (!cur.some(s => String(s) === find)) { rep.push(`${id} — NOT MATCHED`); continue; }
  src = setSteps(src, id, cur.map(s => String(s) === find ? repl : s));
  rep.push(`${id} — ${why}`);
}
writeFile(src);
rep.forEach(l => console.log("  " + l));
