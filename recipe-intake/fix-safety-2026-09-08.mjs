#!/usr/bin/env node
// fix-safety-2026-09-08.mjs — the food-safety findings from AUDIT-FULL-2026-09-08.
//
//   A. Cooked rice kept for meal prep, with no rapid-cool note. Uncooked rice
//      carries Bacillus cereus spores that SURVIVE cooking; left to cool slowly
//      they germinate and produce a heat-stable toxin that reheating does not
//      destroy. The FSA's advice is to cool it fast, chill within an hour, never
//      leave it standing in the pan or cooker, and reheat once until steaming
//      hot. This is the single most likely way a meal-prep app gives someone
//      food poisoning, and 27 recipes said nothing about it.
//      https://www.food.gov.uk/safety-hygiene/home-food-fact-checker
//   B. Minced beef and lamb with no cooked-through cue. Whole muscle is
//      sterile inside so a steak can be rare; mincing spreads surface bacteria
//      right through the meat, so mince has to be cooked all the way.
//      USDA: 71°C for ground beef. The house cue is 75°C, which clears it.
//   C. Reheat instructions with neither a time nor "until hot through".
//   D. A long marinade with no refrigeration note.
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "index.html";
let src = readFileSync(PATH, "utf8");
const slice = (s, o, c) => { const i = src.indexOf(s); const a = src.indexOf(o, i); const b = src.indexOf(c, a); return src.slice(a, b + c.length); };
const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
const PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
const ALL = [...RECIPES, ...PENDING];

const RICE_TIP = "💡 Rice safety: cool the cooked rice quickly — spread it out rather than leaving it in the pan or cooker, and get it into the fridge within an hour. Uncooked rice carries spores that survive cooking, and slow cooling is what lets them produce a toxin reheating cannot destroy. Reheat once, until steaming hot all the way through.";
const MINCE_CUE = " Cook the mince right through until no pink remains and it reads 75°C in the middle.";
const REHEAT_CUE = ", until steaming hot all the way through";

const isTip = s => /^[\u{1F4A1}\u{1F7E1}\u{23F1}]/u.test(s);
const COOK_VERB = /\b(cook|brown|fry|saut[ée]|simmer|sear|grill|bake|boil)\b/i;
const report = [];

function writeSteps(rid, steps) {
  const re = new RegExp(`\\bid:\\s*"${rid}"`, "g");
  const a = src.indexOf("const RECIPES ="), z = src.indexOf("\n];", src.indexOf("const PENDING_RECIPES"));
  let m, hits = []; while ((m = re.exec(src))) if (m.index > a && m.index < z) hits.push(m.index);
  if (hits.length !== 1) throw new Error(`${rid}: ${hits.length} id hits`);
  const start = Math.max(src.lastIndexOf("\n    {", hits[0]), src.lastIndexOf("\n{", hits[0])) + 1;
  const endA = src.indexOf("\n    },", hits[0]), endB = src.indexOf("\n    }\n", hits[0]);
  const end = (endA < 0 ? endB : endB < 0 ? endA : Math.min(endA, endB)) + 6;
  let blk = src.slice(start, end);
  const ids = blk.match(/\bid:\s*"[a-z0-9_]+"/g) || [];
  if (ids.length !== 1) throw new Error(`${rid}: block covers ${ids.length} recipes`);
  const stepsRe = /\bsteps:\s*\[[\s\S]*?\n        \]/;
  if (!stepsRe.test(blk)) throw new Error(`${rid}: steps block not found`);
  blk = blk.replace(stepsRe, () => "steps: [\n" + steps.map(s => "            " + JSON.stringify(s)).join(",\n") + "\n        ]");
  src = src.slice(0, start) + blk + src.slice(end);
}

for (const r of ALL) {
  let steps = r.steps.slice();
  const before = JSON.stringify(steps);
  const T = () => steps.join(" ");
  const labels = (r.batchItems || []).map(i => i.label || "").join(" ");

  // A. rice
  // Same predicate as the assertion in scripts/test-regressions.mjs, so the two
  // cannot disagree about which recipes need the note.
  const cooksOwnRice = (r.batchItems || []).some(i => /\brice\b/i.test(i.label || "")
      && !/rice (?:cake|paper|vinegar|wine|milk|flour|noodle)|\bcooked\b/i.test(i.label || ""))
    && /\brice\b/i.test(T()) && /\b(cook|boil|steam|simmer)\b/i.test(T());
  if (cooksOwnRice && !/cool[^.]{0,40}\b(quickly|fast|within an hour)\b|within an hour|spores/i.test(T())) {
    steps.push(RICE_TIP);
    report.push(`${r.id} — rice safety tip added`);
  }

  // B. minced red meat
  const hasMince = /\b(beef|lamb|pork)\b/i.test(labels) && /\b(mince|minced|ground)\b/i.test(labels);
  if (hasMince && !/(7[0-9]|8\d)\s*°C|no (?:longer )?pink|right through|cooked through|fully browned|until browned/i.test(T())) {
    const body = steps.map((s, i) => [s, i]).filter(([s]) => !isTip(s));
    const idx = (body.filter(([s]) => /\b(mince|ground|beef|lamb|pork)\b/i.test(s) && COOK_VERB.test(s))[0]
              || body.filter(([s]) => COOK_VERB.test(s))[0] || [])[1];
    if (idx != null) {
      steps[idx] = steps[idx].replace(/\s*$/, "") + MINCE_CUE;
      report.push(`${r.id} — mince doneness cue on step ${idx + 1}`);
    } else report.push(`${r.id} — mince, but no cooking step found (SKIPPED)`);
  }

  // C. reheat with no doneness and no time
  const hasReheat = /\breheat/i.test(T());
  if (hasReheat) {
    const tail = T().slice(T().search(/\breheat/i));
    const ok = /(steaming hot|piping hot|hot (?:all the way )?through|through(?:out)?|75\s*°C|until hot)/i.test(T())
            || /\d+\s*W\b|\d+\s*%\s*power|\d+\s*(?:min|sec)/i.test(tail);
    if (!ok) {
      let done = false;
      steps = steps.map(s => {
        if (done || !/\breheat/i.test(s)) return s;
        done = true;
        return s.replace(/(reheat[^.!?]*)/i, (m2) => m2.replace(/\s*$/, "") + REHEAT_CUE);
      });
      if (done) report.push(`${r.id} — reheat doneness added`);
    }
  }

  // D. marinade left out of the fridge
  if (/\bmarinate\b/i.test(T()) && /\b(overnight|\d+\s*h(?:ours?|rs?)?)\b/i.test(T()) && !/fridge|refrigerat|chill|cold/i.test(T())) {
    let done = false;
    steps = steps.map(s => {
      if (done || !/\bmarinate\b/i.test(s)) return s;
      done = true;
      return s.replace(/\bmarinate\b/i, "marinate in the fridge");
    });
    if (done) report.push(`${r.id} — marinade moved to the fridge`);
  }

  if (JSON.stringify(steps) !== before) writeSteps(r.id, steps);
}
if (!DRY) writeFileSync(PATH, src);
console.log(`${report.length} change(s)${DRY ? " (dry)" : ""}\n`);
const byKind = {};
for (const l of report) { const k = l.split("— ")[1]; (byKind[k] = byKind[k] || []).push(l.split(" —")[0]); }
for (const k in byKind) console.log(`  ${byKind[k].length}  ${k}\n      ${byKind[k].join(", ")}`);
