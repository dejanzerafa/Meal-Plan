#!/usr/bin/env node
// fix-uncooked-chicken-2026-09-08.mjs
//
// m150 and sn13 list raw chicken breast and never cook it — the method jumps
// straight to "Add the grilled chicken slices on top". Both subtitles promise
// 20–30 min of cooking and both existing tips assume the bird was cooked
// ("Cook and slice the chicken up to 4 days ahead"), so the cookbook PDF
// dropped a step rather than these being assembly salads. Insert it, at the
// house doneness temperature (75°C — see fix-doneness-2026-09-08.mjs).
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "index.html";
let src = readFileSync(PATH, "utf8");

const ADD = {
  m150: "Season the chicken breast, then grill or oven-bake at 200°C for 20–25 min until the thickest part reads 75°C. Rest 5 min and slice across the grain.",
  sn13: "Season the chicken breast and pan-fry over medium-high heat, 5–6 min per side, until the thickest part reads 75°C. Rest 5 min, then slice.",
};

function blockOf(id) {
  const re = new RegExp(`\\bid:\\s*"${id}"`, "g");
  const a = src.indexOf("const RECIPES ="), z = src.indexOf("\n];", src.indexOf("const PENDING_RECIPES"));
  let m, hits = []; while ((m = re.exec(src))) if (m.index > a && m.index < z) hits.push(m.index);
  if (hits.length !== 1) throw new Error(`id ${id}: ${hits.length} hits`);
  const start = Math.max(src.lastIndexOf("\n    {", hits[0]), src.lastIndexOf("\n{", hits[0])) + 1;
  const endA = src.indexOf("\n    },", hits[0]), endB = src.indexOf("\n    }\n", hits[0]);
  const end = (endA < 0 ? endB : endB < 0 ? endA : Math.min(endA, endB)) + 6;
  const blk = src.slice(start, end);
  const ids = blk.match(/\bid:\s*"[a-z0-9_]+"/g) || [];
  if (ids.length !== 1 || !ids[0].includes(`"${id}"`)) throw new Error(`id ${id}: block covers ${ids.length} recipes`);
  return [start, end];
}

const slice = (s, o, c) => { const i = src.indexOf(s); const a = src.indexOf(o, i); const b = src.indexOf(c, a); return src.slice(a, b + c.length); };
const PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));

for (const [id, step] of Object.entries(ADD)) {
  const r = PENDING.find(x => x.id === id);
  if (!r) throw new Error(`${id} not found in PENDING_RECIPES`);
  if (r.steps.some(s => /7[45]\s*°C/.test(s))) { console.log(`${id}: already cooks the chicken — skipped`); continue; }
  const steps = [step, ...r.steps];
  const [a, z] = blockOf(id); let blk = src.slice(a, z);
  const stepsRe = /\bsteps:\s*\[[\s\S]*?\n        \]/;
  if (!stepsRe.test(blk)) throw new Error(`${id}: steps block not found`);
  blk = blk.replace(stepsRe, () => "steps: [\n" + steps.map(s => "            " + JSON.stringify(s)).join(",\n") + "\n        ]");
  src = src.slice(0, a) + blk + src.slice(z);
  console.log(`${id} — ${r.name}\n    step 1 inserted: ${step}`);
}
if (!DRY) writeFileSync(PATH, src);
