#!/usr/bin/env node
// fix-doneness-2026-09-08.mjs — put the poultry doneness cue on the step that
// actually cooks the bird, and take it off recipes that never cook one.
//
// The 2026-09-07 fixer appended "Cook until the thickest part reads 74°C." to
// the first step that mentioned poultry. For 20 recipes that step was prep or
// assembly ("Season the chicken breasts…", "Toss lettuce and chicken with the
// dressing…"), and for 6 it was a salad or wrap built from ready-cooked or
// rotisserie chicken, where the instruction is simply wrong.
//
// Research behind the number (2026-09-08):
//   USDA FSIS         165°F = 74°C, all poultry, instantaneous, no rest.
//   Health Canada     74°C for pieces (82°C whole birds — none in this library).
//   UK FSA            70°C for 2 min, or 75°C/30 s, 80°C/6 s.
// 74°C therefore clears the US and Canadian standard outright and sits between
// the FSA's 70°C/2 min and 75°C/30 s rows.
//
// Usage: node recipe-intake/fix-doneness-2026-09-08.mjs [--dry] [--temp 74|75]
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const TEMP = (process.argv.includes("--temp") ? process.argv[process.argv.indexOf("--temp") + 1] : "74");
const OLD_CUE = /\s*Cook (?:until the thickest part|through until the centre of the thickest piece) reads 7[45]°C\.(?=$|\s)/g;
const PATH = "index.html";
let src = readFileSync(PATH, "utf8");
const slice = (s, o, c) => { const i = src.indexOf(s); const a = src.indexOf(o, i); const b = src.indexOf(c, a); return src.slice(a, b + c.length); };
const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
const PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));

const POULTRY   = /\b(chicken|turkey|duck)\b/i;
// Things that are poultry but are not a raw bird you have to cook.
const NOT_RAW   = /broth|stock|knorr|bouillon|stock cube|smoked|deli|rotisserie|pre-?cooked|\bcooked\b|jerky|bacon/i;
const COOK_VERB = /\b(cook|grill|bake|roast|sear|air[- ]?fry|pan[- ]?fry|fry|brown|saut[ée]|simmer|poach|griddle|barbecue|bbq|boil|steam|braise)\b/i;
const GROUND    = /\b(ground|mince[d]?|meatball|patt(?:y|ies)|nugget|burger|kofta|sausage)\b/i;
const HAS_CUE   = /\b(7[45]|8[02])\s*°?\s*C\b|\b16[5-9]\s*°?\s*F\b|internal temp/i;
const isTip = s => /^[\u{1F4A1}\u{1F7E1}\u{23F1}]/u.test(s);

const report = [];
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

// Hand-written poultry doneness readings, so the whole library quotes one
// number. Only inside recipes whose protein is poultry — hol3 says "74°C for
// well-done" about a leg of lamb, which is a doneness preference, not a
// pathogen threshold, and must not be touched.
const HAND_WRITTEN = /\b74\s*°C\b|\b165\s*°F\b/g;

for (const r of [...RECIPES, ...PENDING]) {
  const original = r.steps.slice();
  let steps = r.steps.map(s => s.replace(OLD_CUE, ""));
  const anyPoultry = (r.batchItems || []).some(i => POULTRY.test(i.label || "")) || POULTRY.test(r.name);
  const otherMeat = (r.batchItems || []).some(i => /\b(beef|lamb|steak|pork|mutton|veal)\b/i.test(i.label || ""));
  if (anyPoultry && !otherMeat && TEMP !== "74") {
    steps = steps.map(s => s.replace(HAND_WRITTEN, `${TEMP}°C`).replace(new RegExp(`${TEMP}°C\\s*/\\s*${TEMP}°C`, "g"), `${TEMP}°C`));
  }
  const hadCue = original.some(s => OLD_CUE.test(s));
  OLD_CUE.lastIndex = 0;

  const rawPoultry = (r.batchItems || []).filter(i => POULTRY.test(i.label || "") && !NOT_RAW.test(i.label || ""));
  const bodyIdx = steps.map((s, i) => [s, i]).filter(([s]) => !isTip(s));

  let why = null, target = -1;
  if (!rawPoultry.length) {
    why = hadCue ? `no raw poultry (${(r.batchItems || []).filter(i => POULTRY.test(i.label || "")).map(i => i.label).join(", ") || "—"}) — cue removed` : null;
  } else if (bodyIdx.some(([s]) => HAS_CUE.test(s))) {
    const has = bodyIdx.find(([s]) => HAS_CUE.test(s));
    why = hadCue ? `already stated a temperature in step ${bodyIdx.indexOf(has) + 1} — duplicate cue removed` : null;
  } else {
    // The cue belongs on the step that cooks the bird — which is neither "the
    // first step that mentions chicken" (usually seasoning) nor "the last step
    // with a cooking verb" (usually the pasta, or toasting the assembled wrap).
    // Walk forward from where the bird first appears to the first real cooking
    // step, then prefer a later step that states doneness, for recipes that
    // brown first and finish in a sauce.
    const ASSEMBLY = /\b(layer|portion|divide|assemble|fold|roll|wrap|spoon|plate|container|serve|garnish|drizzle|sprinkle|top with|toss)\b/i;
    const DONE = /\b(cooked through|until done|no longer pink|shreds? easily|falls? apart|tender|opaque|crisp)\b/i;
    // What the bird is called once it is off the chopping board — "the meatballs",
    // "the patties" — so a step that never says "chicken" still counts.
    const ALIAS = /\b(meatball|patt(?:y|ies)|nugget|burger|kofta|fillet|breast|thigh|mince|sausage)s?\b/i;
    const isBird = s => POULTRY.test(s) || ALIAS.test(s);
    const first = bodyIdx.findIndex(([s]) => POULTRY.test(s));
    const from = first < 0 ? 0 : first;
    // "Toss chicken and sweet potatoes in the mixture and roast for 25 minutes"
    // is a cooking step that happens to start with an assembly verb, so the
    // assembly filter only applies to steps with no time or temperature in them.
    const TIMED = /\d+\s*(?:min|minute|hour|hr|h\b|°C)/i;
    const cookable = bodyIdx.map((e, n) => [e, n])
      .filter(([[s], n]) => n >= from && COOK_VERB.test(s) && !(ASSEMBLY.test(s) && !TIMED.test(s)));
    // Only a step that cooks the BIRD can carry the cue. Steaming the broccoli
    // "until tender" is a doneness phrase about the broccoli.
    const onBird = cookable.filter(([[s]]) => isBird(s));
    let pick = null;
    if (onBird.length) {
      const done = onBird.filter(([[s]]) => DONE.test(s));
      pick = (done.length ? done[done.length - 1] : onBird[0])[0];
    } else if (cookable.length) pick = cookable[0][0];
    if (!pick) { const any = bodyIdx.filter(([s]) => COOK_VERB.test(s)); pick = any.length ? any[any.length - 1] : null; }
    if (!pick) { why = "no cooking step found — NOT CUED, needs a look"; }
    else {
      target = pick[1];
      const ground = rawPoultry.some(i => GROUND.test(i.label || "")) || GROUND.test(r.name);
      const cue = ground
        ? ` Cook through until the centre of the thickest piece reads ${TEMP}°C.`
        : ` Cook until the thickest part reads ${TEMP}°C.`;
      steps[target] = steps[target].replace(/\s*$/, "") + cue;
      const wasOn = original.findIndex(s => OLD_CUE.test(s)); OLD_CUE.lastIndex = 0;
      const bodyPos = bodyIdx.findIndex(([, i]) => i === target) + 1;
      why = hadCue && wasOn !== target ? `moved to step ${bodyPos}: "${steps[target].slice(0, 70)}…"`
          : !hadCue ? `cue added at step ${bodyPos}`
          : TEMP !== "74" || ground ? `reworded at step ${bodyPos}` : null;
    }
  }
  if (JSON.stringify(steps) === JSON.stringify(original)) continue;
  if (why) report.push(`${r.id} — ${r.name}\n    ${why}`);

  const [a, z] = blockOf(r.id); let blk = src.slice(a, z);
  const stepsRe = /\bsteps:\s*\[[\s\S]*?\n        \]/;
  if (!stepsRe.test(blk)) throw new Error(`${r.id}: steps block not found`);
  blk = blk.replace(stepsRe, () => "steps: [\n" + steps.map(s => "            " + JSON.stringify(s)).join(",\n") + "\n        ]");
  src = src.slice(0, a) + blk + src.slice(z);
}
if (!DRY) writeFileSync(PATH, src);
console.log(`${report.length} recipes adjusted${DRY ? " (dry)" : ""} — cue temperature ${TEMP}°C\n`);
report.forEach(r => console.log("  " + r));
