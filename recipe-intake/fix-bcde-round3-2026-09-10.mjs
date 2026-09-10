#!/usr/bin/env node
// Two badges my own badge-vs-method rule caught after the first pass.
//   m131 — I rewrote this method as an oven bake in stage 4, and left the
//          Air Fryer badge pointing at a method that no longer exists.
//   sn25 — "Roasted Beet & Goat Cheese Salad" uses PRE-roasted beets; nothing
//          goes in an oven.
import { readRecipes, editRecipe, writeFile } from "../scripts/lib/recipe-file.mjs";
const f = readRecipes();
let src = f.src; const rep = [];
const set = (id, fields) => {
  src = editRecipe(src, id, blk => {
    let o = blk;
    for (const [k, v] of Object.entries(fields)) {
      const re = new RegExp(`\\b${k}:\\s*"[^"]*"`);
      if (!re.test(o)) throw new Error(`${id}: ${k} not found`);
      o = o.replace(re, `${k}: ${JSON.stringify(v)}`);
    }
    return o;
  });
  rep.push(`${id} — ${Object.entries(fields).map(([k, v]) => `${k}→${v}`).join(", ")}`);
};
set("m131", { badge: "🌬️ Oven", subtitle: "Oven · 50 min" });
set("sn25", { badge: "🥗 No-Cook", subtitle: "No-cook · 10 min" });
writeFile(src);
rep.forEach(l => console.log("  " + l));
