#!/usr/bin/env node
// fix-technique-2026-09-10.mjs
//
// Applies the MECHANICAL findings from TECHNIQUE-AUDIT-2026-09-10.md.
//
// WHAT THIS DELIBERATELY DOES NOT DO
// ──────────────────────────────────
// Only rules whose fix is an unambiguous text addition are applied here.
// Four rules were left as report items because their fix is a change of step
// ORDER, and appending a sentence would produce a step that contradicts itself:
//
//   spices-not-bloomed-in-fat (8)  — the fix is to move the spices earlier, into
//                                    the fat. Two of the eight are slow-cooker
//                                    recipes where there is no frying stage at
//                                    all, so the "fix" does not even apply.
//   seasoning-only-at-the-end (3)  — needs a judgement about which stages to
//                                    season, per dish.
//   delicate-herbs-added-at-start (2) — needs to know whether the herb is meant
//                                    to break down (a paste) or stay fresh.
//   carotenoids-without-fat (1)    — adding fat changes the macros, so it is a
//                                    recipe decision, not a text edit.
//
// Writing those blind is how a previous pass produced "eat cold … until steaming
// hot". Text that reads fine and means nothing.
import { readRecipes, setSteps, writeFile, verifyBlocks } from "../scripts/lib/recipe-file.mjs";
import { isNote } from "../scripts/lib/recipe-rules.mjs";

const DRY = process.argv.includes("--dry");
const file = readRecipes();
let src = file.src;
const ALL = [...file.RECIPES, ...file.PENDING];
const report = [];

const PASTA = /\b(pasta|spaghetti|penne|fusilli|linguine|orzo|macaroni|rigatoni|farfalle)\b/i;
const LONGRICE = /\b(basmati|jasmine|long.grain|long grain)\b/i;

for (const r of ALL) {
  const steps = r.steps || [];
  const bodyIdx = steps.map((s, i) => (isNote(s) ? -1 : i)).filter(i => i >= 0);
  let out = steps.slice();
  let touched = false;
  const ingTxt = (r.batchItems || []).map(i => i.label || "").join(" ");
  const bodyTxt = bodyIdx.map(i => steps[i]).join(" ");

  // ── 1. salt the pasta water ────────────────────────────────────────────────
  // Pasta absorbs its cooking water, so salt there seasons the pasta itself.
  // Salting only the sauce leaves the pasta bland under a seasoned coating.
  if (PASTA.test(ingTxt) && /\b(cook|boil)\b[^]{0,60}\b(pasta|spaghetti|penne|orzo|macaroni|noodles|rigatoni)\b/i.test(bodyTxt)
      && !/salt(ed)?\s+(the\s+)?water|water[^]{0,30}salt|season the water/i.test(bodyTxt)
      && !/\b(udon|ramen|somen|soba|rice noodle|vermicelli)\b/i.test(ingTxt + bodyTxt)) {
    const i = bodyIdx.find(i => /\b(cook|boil)\b/i.test(steps[i]) && PASTA.test(steps[i]));
    if (i != null) {
      out[i] = out[i].replace(/\s*$/, "") + " Salt the water well once it boils — about 10 g per litre — so the pasta is seasoned through and not just its sauce.";
      touched = true; report.push(`${r.id} pasta-water-not-salted: step ${i + 1}`);
    }
  }

  // ── 2. rinse long-grain rice ───────────────────────────────────────────────
  // Milling leaves loose surface starch; unrinsed basmati and jasmine cook gummy
  // instead of separate. (Rinsing is NOT an arsenic measure — that needs excess
  // water and draining, and rinsing removes only about 10%.)
  if (LONGRICE.test(ingTxt) && !/rins|wash|runs clear/i.test(bodyTxt)) {
    const i = bodyIdx.find(i => /\brice\b/i.test(steps[i]) && /\b(cook|boil|simmer|steam|rinse|add)\b/i.test(steps[i]));
    if (i != null) {
      out[i] = "Rinse the rice in cold water until it runs nearly clear, then drain well — loose surface starch is what makes long-grain rice gummy. " + out[i];
      touched = true; report.push(`${r.id} rice-not-rinsed: step ${i + 1}`);
    }
  }

  // ── 3. shock blanched greens ───────────────────────────────────────────────
  // Held hot, they keep cooking and their chlorophyll degrades to olive-brown.
  // Only applied where the greens are portioned for later, not tossed straight
  // into a hot pan.
  {
    const i = bodyIdx.find(i => /blanch/i.test(steps[i]) && /green bean|broccoli|asparagus|peas|spinach|kale|chard|mangetout|sugar snap/i.test(steps[i]));
    if (i != null && !/ice bath|iced water|cold water|refresh|shock|plunge/i.test(bodyTxt)
        && !/\b(wok|stir.fry|return to the pan)\b/i.test(bodyTxt)) {
      out[i] = out[i].replace(/\s*$/, "") + " Drain and plunge straight into iced water, then drain again — held hot they carry on cooking and go olive-brown by midweek.";
      touched = true; report.push(`${r.id} green-vegetables-not-shocked: step ${i + 1}`);
    }
  }

  // ── 4. onion before garlic ─────────────────────────────────────────────────
  // Garlic scorches in under a minute at sauté heat; onion needs 5–8. Together
  // you get one or the other wrong.
  {
    const i = bodyIdx.find(i => {
      const l = steps[i].toLowerCase();
      return /\bgarlic\b/.test(l) && /\b(diced|chopped|sliced|minced)?\s*(onion|shallot|leek)s?\b/.test(l)
        && !/garlic powder|onion powder/.test(l) && /\b(cook|sauté|saute|fry)\b/.test(l)
        && !/\b(stock|broth|water|slow cooker)\b/.test(l);
    });
    if (i != null) {
      out[i] = out[i].replace(/\b(cook|sauté|saute|fry)(\s+(?:the\s+)?(?:diced\s+|chopped\s+|sliced\s+)?onion)\s+and\s+garlic\b/i,
        "$1$2 first until softened, then add the garlic and cook 30–60 seconds more");
      if (out[i] !== steps[i]) { touched = true; report.push(`${r.id} garlic-added-with-onion: step ${i + 1}`); }
    }
  }

  // ── 5. promote a technique instruction out of a collapsed tip ──────────────
  // The tips block is collapsed behind "STORAGE & TIPS". An instruction that
  // changes the outcome — press the tofu, pat the fish dry, cook in batches —
  // is not a tip, and hiding it there means most cooks never see it.
  {
    const notes = steps.filter(isNote).join(" ").toLowerCase();
    const low = bodyTxt.toLowerCase();
    const PROMOTE = [
      [/press the tofu|pressing the tofu/, /tofu/i, "Press the tofu between kitchen paper under a weighted plate for 15 minutes and pat it dry — wet tofu steams instead of crisping."],
      [/pat .{0,14}dry|blot .{0,14}dry/, /\b(cod|salmon|tilapia|haddock|fish|fillet|chicken|steak)\b/i, "Pat the surface completely dry before it goes in — surface water has to boil off before anything can brown."],
      [/in batches|do not crowd|single layer/, /\b(brown|sear|fry|sauté|saute)\b/i, "Work in batches, keeping everything in a single layer — a crowded pan traps steam and the food greys instead of browning."],
      [/against the grain/, /\b(slice|carve)\b/i, "Slice against the grain — across the fibres, not along them."],
    ];
    for (const [inNote, anchor, text] of PROMOTE) {
      if (!inNote.test(notes) || inNote.test(low)) continue;
      const at = bodyIdx.find(i => anchor.test(steps[i]));
      if (at == null) continue;
      const pos = out.indexOf(steps[at]);
      out.splice(pos, 0, text);
      touched = true; report.push(`${r.id} technique-only-in-a-note: promoted "${text.slice(0, 42)}…" to step ${pos + 1}`);
      break; // one promotion per recipe; a wall of new steps is its own problem
    }
  }

  if (touched) { src = setSteps(src, r.id, out); }
}

const bad = verifyBlocks(src);
if (bad.length) throw new Error("block corruption:\n" + bad.join("\n"));
if (!DRY) writeFile(src);
console.log(`${report.length} change(s) across ${new Set(report.map(l => l.split(" ")[0])).size} recipes${DRY ? " (dry)" : ""}\n`);
report.forEach(l => console.log("  " + l));
