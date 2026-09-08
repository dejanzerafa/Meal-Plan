#!/usr/bin/env node
// fix-safety-round2-2026-09-08.mjs
//
// A second safety pass, on findings the FIRST pass could not see because its
// own rules were too loose:
//
//   - reheat-doneness tested the whole recipe for "75°C", so any poultry
//     doneness cue anywhere satisfied it. "Reheat in a pan with a splash of
//     water." passed on every chicken recipe in the library.
//   - cold-marinade tested the whole recipe for "refrigerate", so the rice
//     storage note counted as refrigerating the marinade.
//
// Both were caught by scripts/test-recipe-rules.mjs, which feeds every rule a
// recipe that should trip it. Three marinades and nine reheat instructions were
// hiding behind them.
import { readRecipes, setSteps, writeFile } from "../scripts/lib/recipe-file.mjs";
import { checkRecipe } from "../scripts/lib/recipe-rules.mjs";

const DRY = process.argv.includes("--dry");
const f = readRecipes();
let src = f.src;
const report = [];

for (const r of f.ALL) {
  const findings = checkRecipe(r, { IM: f.IM, ING: f.ING }).map(x => x.id);
  if (!findings.includes("reheat-doneness") && !findings.includes("cold-marinade")) continue;

  let steps = r.steps.slice();
  let changed = false;

  if (findings.includes("reheat-doneness")) {
    steps = steps.map(s => {
      const parts = String(s).split(/(?<=[.!?])\s+/);
      let touched = false;
      const out = parts.map(x => {
        if (!/\breheat\b/i.test(x) || /\b(after|when|before|while|during|than)\s+reheat/i.test(x)) return x;
        if (/(steaming hot|piping hot|hot (?:all the way )?through|75\s*°C|until hot)/i.test(x)) return x;
        if (/\d+\s*W\b/i.test(x) || /\d+\s*(?:[–-]\s*\d+\s*)?%[^.]{0,20}\bpower\b/i.test(x) || /\d+\s*[-–]?\s*(?:min|sec)/i.test(x)) return x;
        touched = true;
        return x.replace(/\s*$/, "").replace(/\.$/, "") + ", until steaming hot all the way through.";
      });
      if (touched) { changed = true; return out.join(" "); }
      return s;
    });
    if (changed) report.push(`${r.id} — reheat doneness added`);
  }

  if (findings.includes("cold-marinade")) {
    let done = false;
    steps = steps.map(s => {
      if (done || !/\bmarinate\b/i.test(s)) return s;
      done = true; changed = true;
      // "Marinate X in Y" → "Marinate X in the fridge in Y" reads badly, so the
      // qualifier goes on the duration, which is the part that matters.
      return String(s).replace(/\bmarinate\b/i, "Marinate in the fridge:").replace(/Marinate in the fridge:\s*/i, "Marinate in the fridge — ");
    });
    if (done) report.push(`${r.id} — marinade moved to the fridge`);
  }

  if (changed) src = setSteps(src, r.id, steps);
}
if (!DRY) writeFile(src);
console.log(`${report.length} change(s)${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
