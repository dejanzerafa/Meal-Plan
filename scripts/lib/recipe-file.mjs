#!/usr/bin/env node
// recipe-file.mjs — the only safe way to edit a recipe inside index.html.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
// ─────────────────────────────────────────────────────────────────────────────
// Every fixer needs to rewrite one recipe object in a 1.8 MB HTML file, and
// each one grew its own copy of "find the block". The first copy anchored the
// start on `"\n    {"` — four spaces — because that is how every recipe in the
// file is indented.
//
// Two are not. sn2 and m78 open at column zero. For those the anchor walked
// back past their own opening brace to the PREVIOUS recipe's, so the block
// spanned two recipes, and every regex edit below hit the first match in the
// combined text — which was the neighbour's. sn2's unit conversion landed in
// sm9; m78's in m76.
//
// Nothing caught it. The tests passed, the guards passed, the macros
// reconciled — because writing valid data into the wrong recipe produces a
// perfectly valid file. It surfaced only because a later assertion happened to
// check the recipes that had been skipped.
//
// So: one implementation, and it REFUSES to return a block containing more than
// one `id:`. A fixer that would corrupt a neighbour now throws instead.
//
//   import { readRecipes, editRecipe, writeFile } from "./lib/recipe-file.mjs";
//   const file = readRecipes();                       // { src, RECIPES, PENDING, IM, ING }
//   file.src = editRecipe(file.src, "m40", blk => blk.replace(...));
//   writeFile(file.src);
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const INDEX = join(ROOT, "index.html");

const sliceOf = (src, marker, open, close) => {
  const i = src.indexOf(marker);
  const a = src.indexOf(open, i);
  const b = src.indexOf(close, a);
  return src.slice(a, b + close.length);
};

/** Parse index.html: the two recipe arrays and both macro banks. */
export function readRecipes(path = INDEX) {
  const src = readFileSync(path, "utf8");
  const arr = (marker) => eval(sliceOf(src, marker, "[", "\n];").replace(/\n];$/, "\n]"));
  return {
    src,
    RECIPES: arr("const RECIPES ="),
    PENDING: arr("const PENDING_RECIPES"),
    IM: eval("(" + sliceOf(src, "const INGREDIENT_MACROS = {", "{", "\n};").replace(/\n};$/, "\n}") + ")"),
    ING: arr("const ING_FLAT"),
    get ALL() { return [...this.RECIPES, ...this.PENDING]; },
  };
}

/**
 * Byte range of one recipe object. Throws rather than returning a range that
 * covers more than one recipe — see the comment at the top of this file.
 */
export function blockRange(src, id) {
  const re = new RegExp(`\\bid:\\s*"${id}"`, "g");
  const from = src.indexOf("const RECIPES =");
  const to = src.indexOf("\n];", src.indexOf("const PENDING_RECIPES"));
  if (from < 0 || to < 0) throw new Error("recipe arrays not found in the file");

  let m, hits = [];
  while ((m = re.exec(src))) if (m.index > from && m.index < to) hits.push(m.index);
  if (hits.length !== 1) throw new Error(`id "${id}": ${hits.length} matches in the recipe arrays (expected 1)`);

  // Whichever opening brace is NEARER — four-space or column-zero.
  const start = Math.max(src.lastIndexOf("\n    {", hits[0]), src.lastIndexOf("\n{", hits[0])) + 1;
  const endA = src.indexOf("\n    },", hits[0]);
  const endB = src.indexOf("\n    }\n", hits[0]);
  const end = (endA < 0 ? endB : endB < 0 ? endA : Math.min(endA, endB)) + 6;
  if (start <= 0 || end <= start) throw new Error(`id "${id}": could not resolve the block boundaries`);

  const block = src.slice(start, end);
  const ids = block.match(/\bid:\s*"[a-z0-9_]+"/g) || [];
  if (ids.length !== 1)
    throw new Error(`id "${id}": the resolved block contains ${ids.length} recipes (${ids.join(", ")}) — ` +
                    `editing it would write into a neighbouring recipe`);
  if (!ids[0].includes(`"${id}"`))
    throw new Error(`id "${id}": the resolved block is ${ids[0]}`);
  return { start, end, block };
}

/** Run `fn(blockText)` over one recipe and splice the result back in. */
export function editRecipe(src, id, fn) {
  const { start, end, block } = blockRange(src, id);
  const next = fn(block);
  if (typeof next !== "string") throw new Error(`id "${id}": edit function returned ${typeof next}`);
  return src.slice(0, start) + next + src.slice(end);
}

/** Replace a recipe's steps array. */
export function setSteps(src, id, steps) {
  return editRecipe(src, id, (blk) => {
    const stepsRe = /\bsteps:\s*\[[\s\S]*?\n        \]/;
    if (!stepsRe.test(blk)) throw new Error(`id "${id}": steps array not found`);
    return blk.replace(stepsRe, () => "steps: [\n" + steps.map(s => "            " + JSON.stringify(s)).join(",\n") + "\n        ]");
  });
}

/** Patch one ingredient row in place: { qty, unit, label, share, ingId }. */
export function setItem(src, id, key, patch) {
  return editRecipe(src, id, (blk) => {
    const lineRe = new RegExp(`^.*\\bkey:\\s*"${key}".*$`, "m");
    const line = blk.match(lineRe);
    if (!line) throw new Error(`id "${id}": ingredient row "${key}" not found`);
    let l = line[0];
    if (patch.qty != null)   l = l.replace(/\bqty:\s*[\d.]+/, `qty: ${patch.qty}`);
    if (patch.unit != null)  l = l.replace(/\bunit:\s*"[^"]*"/, `unit: ${JSON.stringify(patch.unit)}`);
    if (patch.label != null) l = l.replace(/\blabel:\s*"[^"]*"/, `label: ${JSON.stringify(patch.label)}`);
    if (patch.share != null) l = l.replace(/\bshare:\s*[\d.]+/, `share: ${patch.share}`);
    if (patch.ingId != null) l = l.replace(/\bingId\s*:\s*\d+/, `ingId: ${patch.ingId}`);
    return blk.replace(lineRe, () => l);
  });
}

export function writeFile(src, path = INDEX) { writeFileSync(path, src); }

/**
 * Every recipe block in the file resolves to exactly one recipe.
 * Cheap, and it is the check that would have caught the sn2/m78 corruption on
 * the day it happened rather than a week later.
 */
export function verifyBlocks(src) {
  const from = src.indexOf("const RECIPES =");
  const to = src.indexOf("\n];", src.indexOf("const PENDING_RECIPES"));
  const region = src.slice(from, to);
  const bad = [];
  for (const m of region.matchAll(/\bid:\s*"([a-z0-9_]+)"/g)) {
    try { blockRange(src, m[1]); } catch (e) { bad.push(`${m[1]}: ${e.message}`); }
  }
  return bad;
}
