#!/usr/bin/env node
// fix-2026-09-07.mjs — applies the approved audit fixes to every recipe in
// index.html (live + pending), in place, and writes a per-recipe diff report.
//
// Groups (see AUDIT-ALL-401-2026-09-07.md and the approval in chat):
//   1. US units inside method text → g / ml / cm
//   2. Missing time in subtitle → estimated "~N min"
//   3. Poultry without a doneness cue → "74°C in the thickest part"
//   4. Countable ingredient units (cans / slices / tsp / whole) → grams; "pinch" qty 0 → 0.5 g
//   5. No 💡 tip → parked tips from recipe-intake/proposed/
//   6. Staged recipes with non-standard allergen labels → detectAllergens() vocabulary
//   7. m51 °F-only → °C; hol6 name → emoji
//   8. Under protein target → primary protein source scaled (≤ ×2), macros recomputed
//   9. (found while fixing) cookbook steps split at PDF line-wraps → rebuilt from the
//      numbered source steps
//
// Usage: node recipe-intake/fix-2026-09-07.mjs [--dry]
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "index.html";
let src = readFileSync(PATH, "utf8");

// ── Data ────────────────────────────────────────────────────────────────────
const slice = (s, o, c) => { const i = src.indexOf(s); const a = src.indexOf(o, i); const b = src.indexOf(c, a); return src.slice(a, b + c.length); };
const IM = eval("(" + slice("const INGREDIENT_MACROS = {", "{", "\n};").replace(/\n};$/, "\n}") + ")");
const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
const PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
const ALL = [...RECIPES, ...PENDING];
const LIVE = new Set(RECIPES.map(r => r.id));
// detectAllergens, verbatim from the app
const ALLERGEN_MAP = eval(slice("const ALLERGEN_MAP", "[", "\n];").replace(/\n];$/, "\n]"));
const hitSrc = src.slice(src.indexOf("function _allergenHit"), src.indexOf("function detectAllergens"));
const _allergenHit = eval("(" + hitSrc.trim().replace(/;$/, "") + ")");
const detectAllergens = r => {
  const text = [r.batchItems.map(i => i.name || i.label || "").join(" "), (r.steps || []).join(" "), r.subtitle || ""].join(" ");
  return ALLERGEN_MAP.filter(a => _allergenHit(text, a)).map(a => a.name);
};
const COOK = Object.fromEntries(JSON.parse(readFileSync("recipe-intake/cookbook-2026-09-06.json", "utf8")).map(p => [String(p.page), p]));
const BUILD = Object.fromEntries(JSON.parse(readFileSync("recipe-intake/build-2026-09-07.json", "utf8")).map(b => [b.id, b]));
const TIPS = {};
for (const f of readdirSync("recipe-intake/proposed")) {
  const j = JSON.parse(readFileSync("recipe-intake/proposed/" + f, "utf8"));
  if (Array.isArray(j)) for (const t of j) TIPS[t.id] = t.tips || t; else Object.assign(TIPS, j);
}

const report = {};   // id → [changes]
const note = (id, group, msg) => { (report[id] = report[id] || []).push({ group, msg }); };

// ── 1. Unit conversion inside text ──────────────────────────────────────────
const FRAC = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };
const num = s => {
  s = s.trim().toLowerCase();
  if (s === "a" || s === "an" || s === "one") return 1;
  if (s === "two") return 2; if (s === "half a" || s === "half") return 0.5;
  let t = 0;
  for (const part of s.split(/[\s-]+/)) {
    if (FRAC[part] != null) t += FRAC[part];
    else if (/^\d+\/\d+$/.test(part)) { const [a, b] = part.split("/"); t += a / b; }
    else if (/^\d+(\.\d+)?$/.test(part)) t += +part;
    else if (part.length === 2 && FRAC[part[1]] != null && /\d/.test(part[0])) t += +part[0] + FRAC[part[1]];
  }
  return t;
};
const LIQUID = /water|oil|milk|juice|vinegar|broth|stock|sauce|syrup|cream\b|batter|wine|aminos|tamari|dressing|marinade|coffee|espresso|extract|kefir|liquid|lemon|lime|teriyaki|soy|drizzle|glaze/i;
// grams per tsp / tbsp / cup for dry things (default = spice-like)
const DENS = [
  [/salt/, 6, 18, 290], [/sugar|sweetener|erythritol|monk/, 4, 12, 200], [/honey/, 7, 21, 340], [/peanut butter|almond butter|nut butter|tahini/, 5.5, 16, 256],
  [/yogurt|yoghurt/, 5, 15, 245], [/flour/, 2.6, 8, 120], [/cocoa/, 2.2, 6, 90], [/protein powder|whey/, 3, 8, 120], [/chia|flax/, 4, 12, 170],
  [/oats?/, 2, 6, 80], [/cheese|parmesan|pecorino|feta/, 2.5, 6, 110], [/seeds?|nuts?|almonds?|walnuts?|pecans?/, 3.3, 10, 140], [/butter/, 4.7, 14, 227],
  [/rice|quinoa|pasta|couscous/, 4, 12, 160], [/spinach|greens|herbs?|parsley|cilantro|basil|mint|dill/, 0.7, 2, 30], [/berries|fruit|banana|mango/, 5, 15, 150],
  [/garlic/, 2.8, 8.5, 136], [/ginger/, 2, 6, 96], [/breadcrumbs?|panko/, 2.5, 7.5, 60],
];
const fmtG = g => g >= 10 ? String(Math.round(g)) : g >= 2 ? String(Math.round(g * 2) / 2).replace(/\.0$/, "") : String(Math.max(0.5, Math.round(g * 2) / 2));
const fmtMl = m => m >= 20 ? String(Math.round(m / 5) * 5) : String(Math.round(m));
const UNIT_RE = /(?<![\w])((?:\d+\s*)?(?:[½¼¾⅓⅔⅛]|\d+\/\d+|\d+(?:\.\d+)?)|\ba\b|\ban\b|\bone\b|\btwo\b|\bhalf a\b)[\s-]*(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|ounces?|oz|pounds?|lbs?)\b(\s+of)?(\s+(?:the\s+)?[a-zA-Z-]+(?:\s+[a-zA-Z-]+)?)?/gi;
function metricise(text, log) {
  let out = text.replace(UNIT_RE, (m, q, unit, of, follow, offset) => {
    const n = num(q); if (!n) return m;
    const u = unit.toLowerCase().replace(/s$/, "");
    let ctx = (follow || "").trim();
    // "add almond milk one tablespoon at a time" — the noun is before the unit
    if (/^(at a|at a time|per|each|more|extra|or so)?$/.test(ctx) || !ctx) ctx = text.slice(Math.max(0, offset - 40), offset) + " " + ctx;
    const liquid = LIQUID.test(ctx) && !/powder|flakes|zest/.test(ctx);
    let rep;
    if (/^(cup)$/.test(u)) rep = liquid ? fmtMl(n * 240) + " ml" : fmtG(n * (DENS.find(d => d[0].test(ctx))?.[3] ?? 120)) + " g";
    else if (/^(tbsp|tablespoon)$/.test(u)) rep = liquid ? fmtMl(n * 15) + " ml" : fmtG(n * (DENS.find(d => d[0].test(ctx))?.[2] ?? 7.5)) + " g";
    else if (/^(tsp|teaspoon)$/.test(u)) rep = liquid ? fmtMl(n * 5) + " ml" : fmtG(n * (DENS.find(d => d[0].test(ctx))?.[1] ?? 2.5)) + " g";
    else if (/^(oz|ounce)$/.test(u)) rep = liquid ? fmtMl(n * 30) + " ml" : fmtG(n * 28) + " g";
    else if (/^(lb|pound)$/.test(u)) rep = fmtG(n * 454) + " g";
    else return m;
    const r = rep + (of || "") + (follow || "");
    log && log.push(`${m.trim()} → ${r.trim()}`);
    return r;
  });
  // inches (skip when a cm figure already follows in brackets)
  out = out.replace(/((?:[½¼¾]|\d+(?:\.\d+)?)(?:\s*[½¼¾])?)[\s-]*(inch|inches|in\.)\b(?!\s*\()/gi, (m, q, unit) => {
    const n = num(q); if (!n) return m;
    const cm = n * 2.54; const r = (cm >= 5 ? Math.round(cm) : Math.round(cm * 2) / 2) + " cm";
    log && log.push(`${m.trim()} → ${r}`); return r;
  });
  out = out.replace(/(\d+)×(\d+)\s*inch\b(?!\s*\()/gi, (m, a, b) => { const r = `${Math.round(a * 2.54)}×${Math.round(b * 2.54)} cm`; log && log.push(`${m} → ${r}`); return r; });
  // "350°F (175°C)" — keep the author's °C (that is the oven dial), drop the °F.
  // Converting the °F arithmetically produced "175°C (175°C)" and "205°C (200°C)".
  out = out.replace(/\b\d{3}\s*°\s*F\s*\(\s*(\d{2,3})\s*°\s*C\s*\)/g, (m, c) => { log && log.push(`${m} → ${c}°C`); return c + "°C"; });
  out = out.replace(/\b(\d{2,3})\s*°\s*C\s*\(\s*\d{3}\s*°\s*F\s*\)/g, (m, c) => { log && log.push(`${m} → ${c}°C`); return c + "°C"; });
  // bare unit with no quantity ("another tsp maple syrup")
  out = out.replace(/\b(another|an extra|extra|a further)\s+(tsp|teaspoon|tbsp|tablespoon)\b/gi, (m, w, u) => {
    const r = `${w} ${/tsp|teaspoon/i.test(u) ? "5 ml" : "15 ml"}`; log && log.push(`${m} → ${r}`); return r; });
  // °F only (leave "180°C (350°F)" alone)
  out = out.replace(/(?<!\()\b(\d{3})\s*°\s*F\b(?!\))/g, (m, f, off) => {
    // "reduce heat to 180°F" is a cookbook artefact — a hob has no °F. Say what it means.
    if (+f < 250 && /(heat to|over|to)\s*$/i.test(out.slice(Math.max(0, off - 12), off))) { log && log.push(`${m} → low heat`); return "low"; }
    const c = Math.round((f - 32) * 5 / 9 / 5) * 5 + "°C"; log && log.push(`${m} → ${c}`); return c;
  });
  out = out.replace(/\b(?:heat to|over|to) low(?! heat)\b/gi, m => m + " heat");
  return out;
}

// ── 9. Rebuild cookbook steps from the numbered source ──────────────────────
function cookbookSteps(page) {
  const out = []; let cur = "";
  for (const raw of page.steps_raw) {
    const line = raw.trim(); if (!line) continue;
    const m = line.match(/^(\d+)\s*[.)]\s*(.*)$/);
    if (m) { if (cur) out.push(cur); cur = m[2]; }
    else cur = cur ? (cur.endsWith("-") ? cur + line : cur + " " + line) : line;
  }
  if (cur) out.push(cur);
  return out.map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean);
}
// Generic fallback: glue fragments (no terminal punctuation → continues on next)
function glueFragments(steps) {
  const out = [];
  for (const s of steps) {
    const prev = out[out.length - 1];
    if (prev && !/^[💡🟡]/.test(s) && !/^[💡🟡]/.test(prev) && (!/[.!?:)"”]$/.test(prev.trim()) || /^[a-z]/.test(s))) out[out.length - 1] = prev.replace(/\s+$/, "") + " " + s.trim();
    else out.push(s);
  }
  return out;
}

// ── 10. PDF artefacts: junk lines and column-edge truncations ───────────────
// The cookbook is a two-column PDF; a handful of steps were cut at the column
// edge and one page leaked its nutrition panel into the method. Completions are
// written by hand from the surrounding steps — see FIX-REPORT group 10.
const JUNK_LINE = /^[\d.]+\s*m?g\b|N\s*u\s*t\s*r\s*i\s*t\s*i\s*o\s*n\s*a\s*l|^(?:[A-Za-z]\s){4,}[A-Za-z]\s*$/;
const TRUNCATED = {
  m140: { "Preheat your grill or grill pan to": "Preheat your grill or grill pan to medium-high." },
  bf46: { "Heat olive oil in a nonstick pan over": "Heat olive oil in a nonstick pan over medium heat." },
  bf52: { "In a saucepan, cook oats in vegetable broth until creamy (about 10 minutes) over medium heat (about": "In a saucepan, cook oats in vegetable broth over medium heat until creamy, about 10 minutes." },
  bf53: { "Warm the tortilla in a dry skillet over": "Warm the tortilla in a dry skillet over medium heat, about 30 seconds each side." },
  sm27: { "Taste and adjust ginger or liquid consistency as desired. Enjoy immediately to preserve the vitamin": "Taste and adjust ginger or liquid consistency as desired. Drink straight away to preserve the vitamin C." },
  sm31: { "Pour into glasses; the result should be cool, thick, and naturally sweet": "Pour into glasses; the result should be cool, thick, and naturally sweet." },
};

// ── 2. Time estimate ────────────────────────────────────────────────────────
function estimateTime(r) {
  // cooking lines only: no tips, no ⏱️ timing notes, and no storage / "before
  // training" durations ("up to 4 days", "2–3 hours before training")
  const body = r.steps.filter(s => !/^[💡🟡⏱]/.test(s)).join(" ")
    .replace(/\b(?:up to|at least|keeps?(?: for)?|store(?:s)?(?: for)?|refrigerate(?: for)?|lasts?|for up to)\s+\d+(?:\s*[–-]\s*\d+)?\s*(?:hours?|hrs?|days?|min(?:ute)?s?)\b/gi, " ")
    .replace(/\d+(?:\s*[–-]\s*\d+)?\s*(?:hours?|hrs?|min(?:ute)?s?)\s+(?:before|prior|ahead)\b/gi, " ");
  let max = 0;
  for (const m of body.matchAll(/(\d+)(?:\s*[–-]\s*(\d+))?\s*(?:min|mins|minutes)\b/gi)) max = Math.max(max, +(m[2] || m[1]));
  // hours: a slow-cooker "Low 6–8 h or High 3–4 h" is one job with two settings —
  // quote the quicker one, and the lower bound of a range
  const hrs = [...body.matchAll(/(\d+(?:\.\d+)?)(?:\s*[–-]\s*\d+(?:\.\d+)?)?\s*(?:hr|hrs|hours?)\b/gi)].map(m => m[1] * 60);
  if (hrs.length) max = Math.max(max, /\bor (?:on )?(?:high|low)\b/i.test(body) ? Math.min(...hrs) : Math.max(...hrs));
  const badge = r.badge || "";
  const base = /Slow/i.test(badge) ? 240 : /Oven/i.test(badge) ? 40 : /Air/i.test(badge) ? 25 : /Blender|Smoothie/i.test(badge) ? 5 : /No-Cook|Cold/i.test(badge) ? 10 : 25;
  const quick = /Blender|Smoothie|No-Cook|Cold|No cook/i.test(badge + " " + (r.subtitle || ""));
  const prep = quick ? 5 : Math.min(20, 8 + 2 * r.steps.length);
  let t = max ? max + prep : base + (r.portions >= 5 && !quick ? 10 : 0);
  t = Math.max(5, Math.round(t / 5) * 5);
  const fmt = t >= 120 ? `~${Math.floor(t / 60)} h${t % 60 ? " " + (t % 60) + " min" : ""}` : `~${t} min`;
  const chill = /overnight|chill|refrigerate (?:for )?(?:at least )?\d|set in the fridge/i.test(body) && !/overnight/i.test(r.subtitle || "");
  return `${fmt}${/overnight/i.test(body) ? " + overnight" : chill ? " + chill" : ""}`;
}

// ── Per-recipe planning ─────────────────────────────────────────────────────
// Protein targets apply to a *meal*. A 62 kcal cucumber cup filed under "salad"
// is a side, and doubling its hummus to chase 25 g would just make a different
// (and worse) dish — so the target is gated on the plate being a meal-sized
// portion, and a scale-up is only kept when it actually reaches the target.
const TARGET = { main: 30, salad: 25, breakfast: 20 };
const MEAL_KCAL = { main: 300, salad: 220, breakfast: 250 };
const POULTRY = /chicken|turkey/i;
const COOK_VERB = /\b(cook|grill|bake|roast|sear|air[- ]?fry|pan[- ]?fry|fry|brown|saut[ée]|simmer|poach|griddle|barbecue|bbq)\b/i;

function macrosOf(r) {
  let k = 0, p = 0, c = 0, f = 0, covered = 0;
  for (const it of r.batchItems) {
    const md = IM[it.key]; if (!md) continue;
    const u = String(it.unit || "g").toLowerCase(); let g;
    if (u === "g" || u === "ml") g = it.qty; else { if (!md.unitG) continue; g = it.qty * md.unitG; }
    if (g <= 0) continue;
    covered++; k += md.kcal / 100 * g; p += md.p / 100 * g; c += md.c / 100 * g; f += md.f / 100 * g;
  }
  const n = r.portions || 1;
  return { covered, kcal: Math.round(k / n), protein: +(p / n).toFixed(1), carbs: +(c / n).toFixed(1), fat: +(f / n).toFixed(1) };
}
const gramsOf = it => { const md = IM[it.key]; const u = String(it.unit || "g").toLowerCase(); return (u === "g" || u === "ml") ? it.qty : it.qty * (md?.unitG || 0); };

const plans = [];
for (const r of ALL) {
  const plan = { id: r.id, steps: null, subtitle: null, name: null, perPortion: null, allergens: null, items: [] };
  const live = LIVE.has(r.id);
  let steps = r.steps.slice();
  const tips = steps.filter(s => /^[💡🟡]/.test(s));
  let body = steps.filter(s => !/^[💡🟡]/.test(s));

  // 9. fragmented steps
  const b = BUILD[r.id];
  const frag = body.some((s, i) => /^[a-z]/.test(s) || (i < body.length - 1 && !/[.!?:)"”]$/.test(s.trim())));
  if (frag) {
    if (b && /^cb\d+$/.test(b.source) && COOK[b.source.slice(2)]) {
      body = cookbookSteps(COOK[b.source.slice(2)]);
      note(r.id, 9, `method rebuilt from cookbook p.${b.source.slice(2)}: ${r.steps.length - tips.length} fragments → ${body.length} steps`);
    } else {
      const before = body.length; body = glueFragments(body);
      note(r.id, 9, `fragments glued: ${before} → ${body.length} steps`);
    }
  }

  // 10. junk lines and truncations
  {
    const dropped = body.filter(x => JUNK_LINE.test(x.trim()));
    if (dropped.length) { body = body.filter(x => !JUNK_LINE.test(x.trim())); note(r.id, 10, `dropped PDF artefact: ${JSON.stringify(dropped[0].slice(0, 40))}`); }
    const map = TRUNCATED[r.id];
    if (map) body = body.map(x => { const k = x.trim(); if (map[k]) { note(r.id, 10, `truncated step completed: …${k.slice(-28)} → …${map[k].slice(-32)}`); return map[k]; } return x; });
  }

  // 1 + 7. units and °F in every line (body and tips)
  const log = [];
  body = body.map(s => metricise(s, log));
  const tips2 = tips.map(s => metricise(s, log));
  if (log.length) note(r.id, 1, log.join("; "));

  // 3. doneness cue
  const hasPoultry = r.batchItems.some(i => POULTRY.test(i.label || "")) || POULTRY.test(r.name);
  if (hasPoultry && !body.some(s => /74\s*°?\s*C|165\s*°?\s*F/.test(s))) {
    let idx = body.findIndex(s => POULTRY.test(s) && COOK_VERB.test(s));
    if (idx < 0) idx = body.findIndex(s => POULTRY.test(s));
    // "Combine all ingredients … bake 20 min" never names the turkey — use the
    // last cooking step, which is the one the cue belongs on anyway.
    if (idx < 0) { for (let i = body.length - 1; i >= 0; i--) if (COOK_VERB.test(body[i])) { idx = i; break; } }
    if (idx >= 0) { body[idx] = body[idx].replace(/\s*$/, "") + " Cook until the thickest part reads 74°C."; note(r.id, 3, `doneness cue added to step ${idx + 1}`); }
  }

  // 5. tips
  let tipsOut = tips2;
  if (!tips.some(s => /^💡/.test(s)) && TIPS[r.id]) {
    const t = (Array.isArray(TIPS[r.id]) ? TIPS[r.id] : TIPS[r.id].tips || []).map(s => metricise(/^💡/.test(s) ? s : "💡 " + s));
    tipsOut = [...tips2, ...t]; note(r.id, 5, `${t.length} tip(s) added`);
  }
  const newSteps = [...body, ...tipsOut];
  if (JSON.stringify(newSteps) !== JSON.stringify(r.steps)) plan.steps = newSteps;

  // 2. time
  if (!/\d+\s*(?:min|hr|hour)|overnight/i.test(r.subtitle || "")) {
    const t = estimateTime({ ...r, steps: newSteps });
    plan.subtitle = (r.subtitle ? r.subtitle + " · " : "") + t; note(r.id, 2, `time added: ${t}`);
  }

  // 7. hol6 emoji, m51 handled by metricise
  if (!/^\p{Extended_Pictographic}/u.test(r.name)) {
    const e = /bbq|pulled|chicken/i.test(r.name) ? "🍗" : /beef|chili|chilli/i.test(r.name) ? "🥩" : "🍽️";
    plan.name = e + " " + r.name.trim(); note(r.id, 7, `emoji added: ${plan.name}`);
  }

  // 4. countable units → grams; pinch 0 → 0.5 g
  const items = r.batchItems.map(i => ({ ...i }));
  for (const it of items) {
    const u = String(it.unit || "g").toLowerCase(); const md = IM[it.key] || {};
    if (["cans", "can", "slices", "slice", "tsp", "tbsp"].includes(u) || (u === "whole" && /\(400g cans?\)|chilli/.test(it.label))) {
      if (!md.unitG) { note(r.id, 4, `SKIPPED ${it.key}: no unitG`); continue; }
      const g = Math.round(it.qty * md.unitG * 2) / 2;
      let label = it.label.replace(/\s*\(400g cans?\)/, " (canned, drained)").replace(/^Tuna \(canned in water\)$/, "Tuna (canned in water, drained)");
      plan.items.push({ key: it.key, qty: g, unit: "g", label, from: `${it.qty} ${it.unit}` });
      it.qty = g; it.unit = "g"; it.label = label;
      note(r.id, 4, `${it.key}: ${plan.items.at(-1).from} → ${g} g`);
    }
    if (!it.qty) { plan.items.push({ key: it.key, qty: 0.5, unit: "g", label: it.label, from: "0 g" }); it.qty = 0.5; note(r.id, 4, `${it.key}: 0 g → 0.5 g (pinch)`); }
  }

  // 8. protein target
  const target = TARGET[r.category];
  const before = macrosOf({ ...r, batchItems: items });
  const mealSized = before.kcal >= (MEAL_KCAL[r.category] ?? Infinity);
  if (target && !mealSized && before.covered >= 3 && before.protein < target - 0.05)
    note(r.id, 8, `side portion (${before.kcal} kcal, protein ${before.protein} g) — meal protein target not applied`);
  if (target && mealSized && before.covered >= 3 && before.protein < target - 0.05) {
    const cands = items.filter(i => { const md = IM[i.key]; return md && gramsOf(i) > 0 && !/powder|whey|parmesan|pecorino|feta|goat|cheddar|blue cheese|gouda|brie|halloumi|nuts?\b|seeds?\b|quinoa|oats?\b|walnut|almond|pecan|peanut/i.test(i.label)
      && ((["Protein", "Dairy"].includes(i.cat) && md.p >= 10) || (i.cat === "Legumes" && md.p >= 6)) && (i.role ? i.role === "protein" : true); })
      .sort((a, b) => (IM[b.key].p * gramsOf(b)) - (IM[a.key].p * gramsOf(a)));
    const it = cands[0];
    if (it) {
      const md = IM[it.key]; const perG = md.p / 100; const unitG = String(it.unit).toLowerCase() === "g" || String(it.unit).toLowerCase() === "ml" ? 1 : md.unitG;
      const need = (target - before.protein) * (r.portions || 1);
      let newQty = it.qty + need / (perG * unitG);
      newQty = Math.min(newQty, it.qty * 2);
      // grams round to 5; countable things (eggs, cloves) must stay whole
      newQty = unitG === 1 ? Math.ceil(newQty / 5) * 5 : Math.ceil(newQty);
      if (newQty > it.qty) {
        const from = it.qty; it.qty = newQty;
        const after = macrosOf({ ...r, batchItems: items });
        if (after.protein < target - 0.05) {
          // Doubling the protein source still misses — that is a recipe-design
          // question, not an arithmetic one. Leave the dish as written.
          it.qty = from;
          note(r.id, 8, `NOT CHANGED — ${it.label} at ×2 reaches only ${after.protein} g of ${target} g; needs a recipe-level decision`);
        } else {
        // keep shares honest when the recipe declares them
        const prot = items.filter(i => i.role === "protein");
        if (prot.length > 1 && prot.some(i => i.share != null)) {
          const tot = prot.reduce((s, i) => s + IM[i.key].p * gramsOf(i), 0);
          for (const p of prot) { p.share = +(IM[p.key].p * gramsOf(p) / tot).toFixed(6); plan.items.push({ key: p.key, share: p.share }); }
        }
        plan.items.push({ key: it.key, qty: newQty, unit: it.unit, label: it.label, from: `${from} ${it.unit}` });
        note(r.id, 8, `${it.label}: ${from} → ${newQty} ${it.unit} (protein ${before.protein} → ${after.protein} g, target ${target})`);
        }
      } else note(r.id, 8, `no scalable protein source (protein ${before.protein} g)`);
    } else note(r.id, 8, `no scalable protein source (protein ${before.protein} g)`);
  }

  // recompute macros when anything countable changed
  if (plan.items.length) {
    const m = macrosOf({ ...r, batchItems: items });
    if (m.covered >= 3) {
      const d = r.perPortion;
      if (Math.abs(m.kcal - d.kcal) > 0.5 || Math.abs(m.protein - d.protein) > 0.05 || Math.abs(m.carbs - d.carbs) > 0.05 || Math.abs(m.fat - d.fat) > 0.05) {
        plan.perPortion = { kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat };
        note(r.id, 8, `macros ${d.kcal}/${d.protein}/${d.carbs}/${d.fat} → ${m.kcal}/${m.protein}/${m.carbs}/${m.fat}`);
      }
    }
  }

  // 6. allergens field
  if (r.allergens) {
    const det = detectAllergens({ ...r, batchItems: items, steps: newSteps, subtitle: plan.subtitle || r.subtitle });
    const same = det.length === r.allergens.length && det.every(a => r.allergens.includes(a));
    if (!same) { plan.allergens = det; note(r.id, 6, `allergens ${r.allergens.join(",") || "—"} → ${det.join(",") || "—"}`); }
  }

  if (plan.steps || plan.subtitle || plan.name || plan.perPortion || plan.allergens || plan.items.length) plans.push(plan);
}

// ── Apply to source ─────────────────────────────────────────────────────────
const q = s => JSON.stringify(s);
function blockOf(id) {
  const re = new RegExp(`\\bid:\\s*"${id}"`, "g");
  const a = src.indexOf("const RECIPES ="), z = src.indexOf("\n];", src.indexOf("const PENDING_RECIPES"));
  let m, hits = [];
  while ((m = re.exec(src))) if (m.index > a && m.index < z) hits.push(m.index);
  if (hits.length !== 1) throw new Error(`id ${id}: ${hits.length} hits`);
  // Two recipe objects in this file open at column 0 rather than four spaces
  // (sn2 and m78). Anchoring on "\n    {" swallowed the PREVIOUS recipe as well,
  // and every regex edit below then hit that recipe's first matching line
  // instead. Take whichever opening brace is nearest, and refuse to write a
  // block that does not contain exactly one recipe.
  const start = Math.max(src.lastIndexOf("\n    {", hits[0]), src.lastIndexOf("\n{", hits[0])) + 1;
  const endA = src.indexOf("\n    },", hits[0]), endB = src.indexOf("\n    }\n", hits[0]);
  const end = (endA < 0 ? endB : endB < 0 ? endA : Math.min(endA, endB)) + 6;
  const blk = src.slice(start, end);
  const ids = blk.match(/\bid:\s*"[a-z0-9_]+"/g) || [];
  if (ids.length !== 1 || !ids[0].includes(`"${id}"`)) throw new Error(`id ${id}: block covers ${ids.length} recipes (${ids.join(",")})`);
  return [start, end];
}
let applied = 0;
for (const p of plans) {
  const [a, z] = blockOf(p.id);
  let blk = src.slice(a, z), orig = blk;
  if (p.name) blk = blk.replace(/\bname:\s*"[^"]*"/, `name: ${q(p.name)}`);
  if (p.subtitle) blk = blk.replace(/\bsubtitle:\s*"[^"]*"/, `subtitle: ${q(p.subtitle)}`);
  if (p.perPortion) blk = blk.replace(/\bperPortion:\s*\{[^}]*\}/, `perPortion: {kcal:${p.perPortion.kcal}, protein:${p.perPortion.protein}, carbs:${p.perPortion.carbs}, fat:${p.perPortion.fat}}`);
  if (p.allergens) blk = blk.replace(/\ballergens:\s*\[[^\]]*\]/, `allergens: [${p.allergens.map(q).join(", ")}]`);
  for (const it of p.items) {
    const lineRe = new RegExp(`^.*\\bkey:\\s*"${it.key}".*$`, "m");
    const line = blk.match(lineRe); if (!line) throw new Error(`${p.id}: item ${it.key} line not found`);
    let l = line[0];
    if (it.qty != null) l = l.replace(/\bqty:\s*[\d.]+/, `qty: ${it.qty}`).replace(/\bunit:\s*"[^"]*"/, `unit: ${q(it.unit)}`).replace(/\blabel:\s*"[^"]*"/, `label: ${q(it.label)}`);
    if (it.share != null) l = l.replace(/\bshare:\s*[\d.]+/, `share: ${it.share}`);
    blk = blk.replace(lineRe, () => l);
  }
  if (p.steps) {
    const stepsRe = /\bsteps:\s*\[[\s\S]*?\n        \]/;
    if (!stepsRe.test(blk)) throw new Error(`${p.id}: steps block not found`);
    blk = blk.replace(stepsRe, () => "steps: [\n" + p.steps.map(s => "            " + q(s)).join(",\n") + "\n        ]");
  }
  if (blk !== orig) { src = src.slice(0, a) + blk + src.slice(z); applied++; }
}

// ── Report ──────────────────────────────────────────────────────────────────
const GROUPS = { 1: "US units → metric", 2: "time added to subtitle", 3: "poultry doneness cue", 4: "countable units → grams", 5: "tips added", 6: "allergen labels normalised", 7: "emoji / °F", 8: "protein target + macro recompute", 9: "fragmented method rebuilt", 10: "PDF artefact / truncated step" };
const counts = {}; for (const id in report) for (const c of report[id]) counts[c.group] = (counts[c.group] || new Set()).add(id);
let md = `# Recipe fix report — ${new Date().toISOString().slice(0, 10)}\n\n${applied} recipes changed${DRY ? " (DRY RUN — nothing written)" : ""}.\n\n| Group | Recipes |\n|---|---|\n`;
for (const g of Object.keys(GROUPS)) md += `| ${g}. ${GROUPS[g]} | ${counts[g] ? counts[g].size : 0} |\n`;
md += "\n## Per recipe\n\n";
for (const r of ALL) { if (!report[r.id]) continue; md += `### ${r.id}${LIVE.has(r.id) ? "" : "*"} — ${r.name}\n`; for (const c of report[r.id]) md += `- [${c.group}] ${c.msg}\n`; md += "\n"; }
writeFileSync("recipe-intake/FIX-REPORT-2026-09-07.md", md);
writeFileSync("recipe-intake/fix-plan-2026-09-07.json", JSON.stringify(plans, null, 1));
if (!DRY) writeFileSync(PATH, src);
console.log(`${applied} recipes changed${DRY ? " (dry)" : ""}`);
for (const g of Object.keys(GROUPS)) console.log(`  ${g}. ${GROUPS[g]}: ${counts[g] ? counts[g].size : 0}`);
