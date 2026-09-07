// insert-2026-09-07.mjs — writes the 2026-09-07 batch into index.html:
// registry rows 371–411, INGREDIENT_MACROS, PENDING_RECIPES objects (with
// allergens from the app's own detectAllergens), RECIPE_TIER_PENDING ids.
import { readFileSync, writeFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url).pathname;
let raw = readFileSync(ROOT + "index.html", "utf8");
const arrAt = (mark) => { const a = raw.indexOf(mark); const s = raw.indexOf("[", a); let d = 0, b = s; for (; b < raw.length; b++) { if (raw[b] === "[") d++; else if (raw[b] === "]") { d--; if (!d) break; } } return eval(raw.slice(s, b + 1)); };
const braceBody = (from) => { let d = 0, j = raw.indexOf("{", from); for (; j < raw.length; j++) { if (raw[j] === "{") d++; else if (raw[j] === "}") { d--; if (!d) break; } } return raw.slice(from, j + 1); };
const fnSrc = (n) => braceBody(raw.indexOf("function " + n));
const ALLERGEN_MAP = arrAt("const ALLERGEN_MAP = [");
const detectAllergens = new Function("ALLERGEN_MAP", fnSrc("_allergenHit") + "\n" + fnSrc("detectAllergens") + "\nreturn detectAllergens;")(ALLERGEN_MAP);

// registry rows from ingmap.NEW_ROWS (python) — read via a small export
const NEW_ROWS = JSON.parse(readFileSync("/tmp/newrows.json", "utf8")).filter(r => r.id !== 398);
const ING = new Map(arrAt("const ING_FLAT = [").map(i => [i.id, i]));
for (const r of NEW_ROWS) ING.set(r.id, r);

const built = JSON.parse(readFileSync(ROOT + "recipe-intake/build-2026-09-07.json", "utf8"));
const pre = JSON.parse(readFileSync("/tmp/prebuilt.json", "utf8"));
const esc = s => JSON.stringify(s);
const macroLines = [], blocks = [], ids = [], report = [];
const tips = JSON.parse(readFileSync("/tmp/tips-0907.json", "utf8"));

function emit(r) {
  const items = r.batchItems.map(i => ({ key: `${r.id}_${i.key}`, label: i.label, qty: i.qty, unit: i.unit, cat: i.cat, ingId: i.ingId }));
  let kcal = 0, p = 0, c = 0, f = 0;
  for (const i of items) { const ing = ING.get(i.ingId); if (!ing) throw new Error(r.id + " unknown ingId " + i.ingId); const g = i.unit === "whole" ? i.qty * ing.unitG : i.qty; kcal += ing.kcal * g / 100; p += ing.p * g / 100; c += ing.c * g / 100; f += ing.f * g / 100;
    macroLines.push(`    "${i.key}": { kcal: ${ing.kcal}, p: ${ing.p}, c: ${ing.c}, f: ${ing.f}${ing.unitG ? `, unitG: ${ing.unitG}` : ""} },`); }
  const n = r.portions || 1; const per = { kcal: Math.round(kcal / n), protein: Math.round(p / n * 10) / 10, carbs: Math.round(c / n * 10) / 10, fat: Math.round(f / n * 10) / 10 };
  const steps = [...r.steps, ...(tips[r.id] || [])];
  const allergens = detectAllergens({ batchItems: items, steps, subtitle: r.subtitle }).map(a => a.name).sort();
  ids.push(r.id); report.push({ id: r.id, name: r.name, source: r.source || r.id, per, claim: r.claim || null, scaled: r.scaled || null, issues: r.issues || [], replaces: r.replaces || null, allergens });
  blocks.push(`    {
        category: ${esc(r.category)},
        id: ${esc(r.id)},
        name: ${esc(r.name)},
        subtitle: ${esc(r.subtitle)},
        badge: ${esc(r.badge)},
        carb: ${esc(r.carb)},
        portions: ${n},
        perPortion: { kcal: ${per.kcal}, protein: ${per.protein}, carbs: ${per.carbs}, fat: ${per.fat} },
        allergens: [${allergens.map(esc).join(", ")}],
        batchItems: [
${items.map(i => `            { key: ${esc(i.key)}, label: ${esc(i.label)}, qty: ${i.qty}, unit: ${esc(i.unit)}, cat: ${esc(i.cat)}, ingId: ${i.ingId} },`).join("\n")}
        ],
        steps: [
${steps.map(s => `            ${esc(s)},`).join("\n")}
        ],
    },`);
}
for (const r of pre) emit({ ...r, batchItems: r.batchItems.map(i => ({ ...i, key: i.key.replace(r.id + "_", "") })), source: "prebuilt" });
for (const r of built) emit(r);

const ingBlock = NEW_ROWS.map(i => `    { id: ${i.id}, name: ${esc(i.name)}, cat: ${esc(i.cat)}, kcal: ${i.kcal}, p: ${i.p}, c: ${i.c}, f: ${i.f}${i.unitG ? `, unitG: ${i.unitG}` : ""} },`).join("\n");
// 1. ING_FLAT
{ const a = '    { id: 370, name: "Maple Syrup (sugar-free)", cat: "Condiments", kcal: 30, p: 0, c: 12, f: 0 },\n'; if (raw.split(a).length !== 2) throw new Error("ING anchor"); raw = raw.replace(a, a + "    // 2026-09-07 intake — sources in recipe-intake/PREBUILD-CHECK-2026-09-07.md\n" + ingBlock + "\n"); }
// 2. INGREDIENT_MACROS
{ const a = '    "ds9_fsweet": { kcal: 0, p: 0, c: 0, f: 0, unitG: 30 },\n'; if (raw.split(a).length !== 2) throw new Error("macro anchor"); raw = raw.replace(a, a + "    // 2026-09-07 intake — emitted by recipe-intake/insert-2026-09-07.mjs\n" + macroLines.join("\n") + "\n"); }
// 3. PENDING_RECIPES
{ const i = raw.indexOf("const PENDING_RECIPES = ["); const j = raw.indexOf("\n];\n", i); raw = raw.slice(0, j) + "\n    // ── 2026-09-07 intake (" + ids.length + "): recipe-intake/BUILD-REPORT-2026-09-07.md ──\n" + blocks.join("\n") + raw.slice(j); }
// 4. RECIPE_TIER_PENDING
{ const a = '    "m124","ds8","bf40","d6","bf41","ds9",\n'; if (raw.split(a).length !== 2) throw new Error("tier anchor"); raw = raw.replace(a, a + "    // 2026-09-07 intake — " + ids.length + " recipes\n" + ids.map(esc).join(", ") + ",\n"); }
writeFileSync(ROOT + "index.html", raw);
writeFileSync(ROOT + "recipe-intake/build-report-2026-09-07.json", JSON.stringify(report, null, 1));
console.log("inserted", ids.length, "recipes,", NEW_ROWS.length, "registry rows,", macroLines.length, "macro lines");
