#!/usr/bin/env node
// sn30 and sn35 promised vegetables and delivered a pinch.
//
//   sn30 "Savory Egg Muffins"   90 g egg · 0.9 g spinach · 1.8 g cheese
//   sn35 "Mini Veggie Frittatas" 60 g egg · 6 g pepper · 1.2 g spinach
//
// 0.9 g of spinach is one leaf and 1.8 g of cheese is a pinch — below what a
// kitchen scale resolves, and nothing a cook would notice in the finished
// muffin. The library's own comparable recipe, bf64 Spinach & Feta Egg Muffins,
// uses 7.5 g of spinach and 9.5 g of feta against 60 g of egg. These two look
// like a scaling slip rather than a choice, and a frittata named for its
// vegetables should contain some. Scaled to bf64's ratio and macros recomputed.
import { readRecipes, setItem, writeFile } from "../scripts/lib/recipe-file.mjs";
const f = readRecipes();
let src = f.src;
const EDITS = [
  ["sn30", [["Spinach", 20], ["Shredded cheese", 15]]],
  ["sn35", [["Chopped bell peppers", 40], ["Spinach", 20], ["Milk", 15]]],
];
for (const [id, rows] of EDITS) {
  const r = f.ALL.find(x => x.id === id);
  for (const [label, qty] of rows) {
    const it = (r.batchItems || []).find(i => (i.label || "") === label);
    if (!it) { console.log(`  ${id} — "${label}" not found`); continue; }
    src = setItem(src, id, it.key, { qty });
    console.log(`  ${id} — ${label}: ${it.qty} → ${qty} ${it.unit}`);
  }
}
writeFile(src);
