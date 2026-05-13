#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// SoulGainz — Integrity Validator
// Run: node validate.js
// Checks every recipe, ingredient, and macro entry against the established
// baseline-v16 standards. All new additions must pass before committing.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'index.html');
const src = fs.readFileSync(SRC, 'utf8');

// ── Extract data blocks ───────────────────────────────────────────────────────
let ING_FLAT, INGREDIENT_MACROS, RECIPES;

try {
  // ING_FLAT
  const ingMatch = src.match(/const ING_FLAT\s*=\s*(\[[\s\S]*?\]);/);
  if (!ingMatch) throw new Error('ING_FLAT not found');
  ING_FLAT = eval(ingMatch[1]);

  // INGREDIENT_MACROS
  const imMatch = src.match(/const INGREDIENT_MACROS\s*=\s*(\{[\s\S]*?\});/);
  if (!imMatch) throw new Error('INGREDIENT_MACROS not found');
  INGREDIENT_MACROS = eval('(' + imMatch[1] + ')');

  // RECIPES
  const rMatch = src.match(/const RECIPES\s*=\s*(\[[\s\S]*?\]);/);
  if (!rMatch) throw new Error('RECIPES not found');
  RECIPES = eval(rMatch[1]);
} catch (e) {
  console.error('❌  FATAL: Could not parse index.html —', e.message);
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ingById   = Object.fromEntries(ING_FLAT.map(i => [i.id, i]));
const PASS = '✅';
const FAIL = '❌';
let errors = [], warnings = [];
const err  = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// ── CHECK 1 — Duplicate recipe IDs ───────────────────────────────────────────
console.log('\n── CHECK 1  Duplicate recipe IDs ──────────────────────────────');
const idCount = {};
RECIPES.forEach(r => { idCount[r.id] = (idCount[r.id] || 0) + 1; });
const dupes = Object.entries(idCount).filter(([, n]) => n > 1);
if (dupes.length) {
  dupes.forEach(([id, n]) => err(`Duplicate recipe id "${id}" appears ${n} times`));
  console.log(`${FAIL}  ${dupes.length} duplicate(s) found`);
} else {
  console.log(`${PASS}  All ${RECIPES.length} recipe IDs unique`);
}

// ── CHECK 2 — Required recipe fields ─────────────────────────────────────────
console.log('\n── CHECK 2  Required recipe fields ────────────────────────────');
// 'carb' is required for main/breakfast/dessert but optional for holiday (hol*) recipes
const REQUIRED = ['id', 'name', 'category', 'badge', 'portions', 'perPortion', 'batchItems', 'steps'];
let missingFields = 0;
RECIPES.forEach(r => {
  REQUIRED.forEach(f => {
    if (r[f] == null) {
      err(`Recipe "${r.id}" missing required field: ${f}`);
      missingFields++;
    }
  });
  // carb required for non-holiday recipes
  if (r.carb == null && !r.id.startsWith('hol')) {
    err(`Recipe "${r.id}" missing required field: carb`);
    missingFields++;
  }
  // portions must be a positive integer
  if (r.portions && (typeof r.portions !== 'number' || r.portions < 1)) {
    err(`Recipe "${r.id}" has invalid portions: ${r.portions}`);
    missingFields++;
  }
  // perPortion must have all 4 macro keys
  if (r.perPortion) {
    ['kcal','protein','carbs','fat'].forEach(k => {
      if (r.perPortion[k] == null) {
        err(`Recipe "${r.id}" perPortion missing "${k}"`);
        missingFields++;
      }
    });
  }
});
if (missingFields) {
  console.log(`${FAIL}  ${missingFields} missing field(s)`);
} else {
  console.log(`${PASS}  All recipes have required fields`);
}

// ── CHECK 3 — Duplicate batchItem keys (global) ───────────────────────────────
// Recipe-specific keys (starting with a recipe ID like "m52_", "hol3_", "bf3-") must be
// globally unique. Generic shared keys (e.g. "chicken_breast", "garlic") are intentionally
// reused across recipes and are allowed — they must all have the same ingId though.
console.log('\n── CHECK 3  Duplicate batchItem keys ──────────────────────────');
const keyMap = {}; // key → [{recipeId, ingId}]
RECIPES.forEach(r => {
  (r.batchItems || []).forEach(i => {
    if (!keyMap[i.key]) keyMap[i.key] = [];
    keyMap[i.key].push({ recipeId: r.id, ingId: i.ingId });
  });
});
// A key is "recipe-specific" if it starts with a known recipe ID prefix pattern
const recipeIdPrefixes = RECIPES.map(r => r.id);
const isRecipeSpecific = (key) => recipeIdPrefixes.some(id => key.startsWith(id + '_') || key.startsWith(id + '-'));
let dupeKeyErrors = 0, dupeKeyWarnings = 0;
Object.entries(keyMap).forEach(([key, uses]) => {
  if (uses.length <= 1) return;
  if (isRecipeSpecific(key)) {
    // Recipe-specific keys must NEVER be shared — this is a real bug
    err(`Recipe-specific key "${key}" appears in ${uses.length} recipes: ${uses.map(u=>u.recipeId).join(', ')}`);
    dupeKeyErrors++;
  } else {
    // Generic shared key — check all uses have the same ingId (consistency)
    const ingIds = [...new Set(uses.map(u => u.ingId))];
    if (ingIds.length > 1) {
      warn(`Shared key "${key}" used with different ingIds: ${ingIds.join(', ')} — pick one`);
      dupeKeyWarnings++;
    }
    // Otherwise shared keys are fine — they intentionally map to the same ingredient
  }
});
if (dupeKeyErrors) {
  console.log(`${FAIL}  ${dupeKeyErrors} recipe-specific key(s) duplicated across recipes`);
} else {
  const sharedKeys = Object.keys(keyMap).filter(k => keyMap[k].length > 1 && !isRecipeSpecific(k));
  console.log(`${PASS}  No recipe-specific key duplicates (${sharedKeys.length} shared generic keys, intentional)`);
}

// ── CHECK 4 — ingId validity ──────────────────────────────────────────────────
console.log('\n── CHECK 4  ingId → ING_FLAT validity ─────────────────────────');
let badIngId = 0;
RECIPES.forEach(r => {
  (r.batchItems || []).forEach(i => {
    if (i.ingId != null && !ingById[i.ingId]) {
      err(`Recipe "${r.id}" key "${i.key}" has ingId=${i.ingId} not in ING_FLAT`);
      badIngId++;
    }
  });
});
if (badIngId) {
  console.log(`${FAIL}  ${badIngId} invalid ingId(s)`);
} else {
  console.log(`${PASS}  All ingIds resolve in ING_FLAT`);
}

// ── CHECK 5 — INGREDIENT_MACROS coverage ─────────────────────────────────────
console.log('\n── CHECK 5  INGREDIENT_MACROS key coverage ─────────────────────');
let missingIM = 0;
RECIPES.forEach(r => {
  (r.batchItems || []).forEach(i => {
    if (!INGREDIENT_MACROS[i.key]) {
      err(`Recipe "${r.id}" key "${i.key}" ("${i.label}") has no INGREDIENT_MACROS entry`);
      missingIM++;
    }
  });
});
if (missingIM) {
  console.log(`${FAIL}  ${missingIM} key(s) missing from INGREDIENT_MACROS`);
} else {
  console.log(`${PASS}  All ${Object.values(RECIPES).reduce((s,r)=>s+(r.batchItems||[]).length,0)} batchItem keys covered`);
}

// ── CHECK 6 — Whole-unit items have unitG ────────────────────────────────────
console.log('\n── CHECK 6  unit=whole items have unitG > 0 ────────────────────');
let missingUnitG = 0;
RECIPES.forEach(r => {
  (r.batchItems || []).forEach(i => {
    if (i.unit === 'whole') {
      const md = INGREDIENT_MACROS[i.key];
      if (!md) return; // already caught in check 5
      if (!md.unitG || md.unitG <= 0) {
        err(`Recipe "${r.id}" key "${i.key}" unit=whole but INGREDIENT_MACROS missing unitG`);
        missingUnitG++;
      }
    }
  });
});
if (missingUnitG) {
  console.log(`${FAIL}  ${missingUnitG} whole-unit item(s) missing unitG — will show no macros`);
} else {
  console.log(`${PASS}  All whole-unit items have unitG`);
}

// ── CHECK 7 — getIngMacros will return non-null for every item ────────────────
console.log('\n── CHECK 7  Every batchItem will display macros in UI ──────────');
let noDisplay = 0;
RECIPES.forEach(r => {
  (r.batchItems || []).forEach(i => {
    if (r.category === 'preworkout') return; // preworkout uses hardcoded perPortion, skip
    const md = INGREDIENT_MACROS[i.key];
    let grams = 0;
    if (i.unit === 'whole') {
      if (!md || !md.unitG) { noDisplay++; warn(`No macro display: "${r.id}" "${i.key}" (whole, no unitG)`); return; }
      grams = (i.qty || 1) * md.unitG;
    } else {
      grams = i.qty || 0;
    }
    if (grams <= 0) { noDisplay++; warn(`No macro display: "${r.id}" "${i.key}" (qty=0)`); return; }
    const ing = i.ingId ? ingById[i.ingId] : null;
    const kcal = ing ? ing.kcal : (md ? md.kcal : null);
    if (kcal == null) { noDisplay++; err(`No macro display: "${r.id}" "${i.key}" — no kcal source`); }
  });
});
if (noDisplay) {
  console.log(`${FAIL}  ${noDisplay} item(s) will show no macros in UI`);
} else {
  const total = RECIPES.reduce((s,r)=>s+(r.category==='preworkout'?0:(r.batchItems||[]).length),0);
  console.log(`${PASS}  All ${total} non-preworkout items will display macros`);
}

// ── CHECK 8 — perPortion accuracy (bottom-up vs declared) ────────────────────
console.log('\n── CHECK 8  perPortion accuracy (±60 kcal / ±10P / ±12C / ±6F) ─');
const TOL = { kcal: 60, protein: 10, carbs: 12, fat: 6 };
let ppFails = 0;
RECIPES.forEach(r => {
  if (!r.batchItems || !r.perPortion) return;
  if (r.category === 'preworkout') return;
  const portions = r.portions || 7;
  let tKcal=0, tP=0, tC=0, tF=0, covered=0;
  (r.batchItems || []).forEach(i => {
    const md = INGREDIENT_MACROS[i.key];
    if (!md) return;
    let g = 0;
    if (i.unit === 'whole') { g = (i.qty||0) * (md.unitG||0); }
    else { g = i.qty||0; }
    if (g <= 0) return;
    tKcal += (md.kcal/100)*g; tP += (md.p/100)*g;
    tC += (md.c/100)*g;    tF += (md.f/100)*g;
    covered++;
  });
  if (covered < 3) return; // fallback recipe, skip
  const comp = { kcal: tKcal/portions, protein: tP/portions, carbs: tC/portions, fat: tF/portions };
  const pp   = r.perPortion;
  const diffs = {
    kcal:    Math.abs(comp.kcal    - pp.kcal),
    protein: Math.abs(comp.protein - pp.protein),
    carbs:   Math.abs(comp.carbs   - pp.carbs),
    fat:     Math.abs(comp.fat     - pp.fat),
  };
  const exceeded = Object.entries(diffs).filter(([k,v]) => v > TOL[k]);
  if (exceeded.length) {
    exceeded.forEach(([k,v]) => {
      warn(`Recipe "${r.id}" perPortion.${k}: declared=${pp[k]}, computed=${comp[k].toFixed(1)}, diff=${v.toFixed(1)} > tol=${TOL[k]}`);
    });
    ppFails++;
  }
});
if (ppFails) {
  console.log(`${FAIL}  ${ppFails} recipe(s) exceed perPortion tolerance`);
} else {
  console.log(`${PASS}  All perPortion values within tolerance`);
}

// ── CHECK 9 — ING_FLAT ID uniqueness ─────────────────────────────────────────
console.log('\n── CHECK 9  ING_FLAT ID uniqueness ────────────────────────────');
const ingIdCount = {};
ING_FLAT.forEach(i => { ingIdCount[i.id] = (ingIdCount[i.id]||0) + 1; });
const dupeIngIds = Object.entries(ingIdCount).filter(([,n])=>n>1);
if (dupeIngIds.length) {
  dupeIngIds.forEach(([id,n]) => err(`ING_FLAT id ${id} appears ${n} times`));
  console.log(`${FAIL}  ${dupeIngIds.length} duplicate ING_FLAT id(s)`);
} else {
  console.log(`${PASS}  All ${ING_FLAT.length} ING_FLAT ids unique`);
}

// ── CHECK 10 — Next safe IDs (informational) ──────────────────────────────────
console.log('\n── CHECK 10  Next safe IDs ─────────────────────────────────────');
const prefixMax = {};
RECIPES.forEach(r => {
  const pre = (r.id.match(/^[a-z]+/) || [''])[0];
  const num = parseInt((r.id.match(/\d+/) || [0])[0]);
  if (!prefixMax[pre] || num > prefixMax[pre]) prefixMax[pre] = num;
});
const maxIngId = Math.max(...ING_FLAT.map(i=>i.id));
console.log('  Next recipe IDs:');
Object.entries(prefixMax).sort().forEach(([p,n]) => console.log(`    ${p}${n+1}  (current max: ${p}${n})`));
console.log(`  Next ING_FLAT id: ${maxIngId + 1}  (current max: ${maxIngId})`);

// ── SUMMARY ───────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
if (errors.length === 0 && warnings.length === 0) {
  console.log(`\n${PASS}  ALL CHECKS PASSED — safe to commit\n`);
} else {
  if (errors.length) {
    console.log(`\n${FAIL}  ${errors.length} ERROR(S) — must fix before committing:`);
    errors.forEach(e => console.log(`   • ${e}`));
  }
  if (warnings.length) {
    console.log(`\n⚠️   ${warnings.length} WARNING(S) — review recommended:`);
    warnings.forEach(w => console.log(`   • ${w}`));
  }
  console.log('');
}
if (errors.length > 0) process.exit(1);
