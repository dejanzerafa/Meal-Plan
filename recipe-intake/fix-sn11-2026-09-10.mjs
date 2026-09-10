#!/usr/bin/env node
// sn11 "Citrus Shrimp Salad" served raw shrimp.
//
// The method went straight to "combine greens, orange segments, shrimp and
// avocado" — the shrimp is never cooked. The cooking instruction existed all
// along, but as a NOTE ("Cook the shrimp for 2 minutes per side until opaque
// and chill them fully before adding"), and notes are not steps: they are not
// numbered and not ticked off.
//
// This is the one group-A finding fixed without waiting for review, because it
// is a food-safety defect and the fix invents nothing — it promotes the
// recipe's own sentence into the method where it belongs.
import { readRecipes, setSteps, writeFile } from "../scripts/lib/recipe-file.mjs";
const f = readRecipes();
const r = f.ALL.find(x => x.id === "sn11");
const first = "Cook the shrimp 2 min per side until opaque, then chill them fully — warm shrimp wilt the greens.";
if (r.steps.some(s => String(s) === first)) { console.log("already fixed"); process.exit(0); }
const steps = [first, ...r.steps];
writeFile(setSteps(f.src, "sn11", steps));
console.log("sn11 — cooking step promoted out of the note and into the method");
