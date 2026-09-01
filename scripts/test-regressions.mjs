#!/usr/bin/env node
// test-regressions.mjs
//
// Every assertion here corresponds to a bug that actually shipped. The point is
// not coverage — it is that these specific failures cannot come back silently.
//
// Run: node scripts/test-regressions.mjs
// Add to CI alongside the guard scripts.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(ROOT, "index.html"), "utf8");

let pass = 0, fail = 0;
const t = (name, cond, detail) => {
  if (cond) { pass++; console.log("   PASS  " + name); }
  else { fail++; console.log("   FAIL  " + name + (detail ? "\n         " + detail : "")); }
};
const section = n => console.log("\n  " + n);

// Pull a top-level function's source out by brace matching.
const fnSrc = (name) => {
  const i = src.indexOf("function " + name);
  if (i < 0) return null;
  let d = 0, j = src.indexOf("{", i);
  for (; j < src.length; j++) {
    if (src[j] === "{") d++;
    else if (src[j] === "}") { d--; if (!d) break; }
  }
  return src.slice(i, j + 1);
};
const slice = (m, o, c) => {
  const i = src.indexOf(m), a = src.indexOf(o, i), b = src.indexOf(c, a);
  return src.slice(a, b + c.length);
};
const setOf = n => {
  const m = new RegExp("const\\s+" + n + "\\s*=\\s*new Set\\(").exec(src);
  if (!m) return new Set();
  const a = src.indexOf("[", m.index);
  let d = 0, b = a;
  for (; b < src.length; b++) { if (src[b] === "[") d++; else if (src[b] === "]") { d--; if (!d) break; } }
  return new Set(eval(src.slice(a, b + 1).replace(/\/\/[^\n]*/g, "")));
};

// ─────────────────────────────────────────────────────────────────────────────
section("Paywall — locked recipes must not leak ingredients");
// Shipped bug: the SHOP tab was filtered but the MEALS tab was not, so a lapsed
// subscriber kept the full ingredient list for paid recipes via "Fridge pull".
for (const slot of ["lr", "dr", "bfr", "prer", "desr"]) {
  t(`meal slot ${slot} passes through canView`,
     new RegExp("const " + slot + " = _vis\\(").test(src),
     "a slot read without _vis leaks batchItems to MealCard's Fridge pull");
}
t("_vis is defined before the slots use it",
   src.indexOf("const _vis =") > -1 && src.indexOf("const _vis =") < src.indexOf("const lr = _vis("));
t("_vis actually calls canView", /const _vis = r => \(r && canView\(r\.id\)\)/.test(src));

// ─────────────────────────────────────────────────────────────────────────────
section("Entitlement — _serverVerified must never be persisted");
const setUnlocks = src.slice(src.indexOf("const setUnlocks = (next, forUserId)"));
t("_serverVerified is destructured out before storing",
   /const \{ _serverVerified: _sv, \.\.\.toStore \} = next;/.test(setUnlocks),
   "persisting it would let localStorage alone grant a paid tier");
t("the stamp requires _sv AND a user id", /if \(_sv && _uid\)/.test(setUnlocks));

// ─────────────────────────────────────────────────────────────────────────────
section("Sign-out — no per-person data may survive on a shared device");
const pi = src.indexOf("PRESERVE_PREFIXES = [");
const preserved = (src.slice(pi, src.indexOf("];", pi)).match(/"[^"]+"/g) || []).map(x => x.slice(1, -1));
for (const k of ["mp_acc_email", "mp_calc_used_email", "mp_profile", "mp_basics",
                 "mp_cal_logs", "sg_supplements", "mp_history", "mp_redeemed_promos"]) {
  t(`${k} is not preserved`, !preserved.includes(k),
     "it would show the next person the previous user's data");
}
t("the Supabase auth token is cleared unconditionally",
   /\/\^sb-\.\*-auth-token\$\/\.test\(k\)/.test(src),
   "signOut() is wrapped in try/catch; on failure the session must still be dropped");

// ─────────────────────────────────────────────────────────────────────────────
section("Timezone — calendar dates are local days, not UTC instants");
const api = new Function(fnSrc("localDateKey") + "\n" + fnSrc("parseLocalDate") +
                         "\nreturn { localDateKey, parseLocalDate };")();
const start = api.parseLocalDate("2026-09-01");
const end = new Date(start); end.setDate(end.getDate() + 7);
t("prep 2026-09-01 + 7 days is 2026-09-08", api.localDateKey(end) === "2026-09-08",
   "toISOString() here fired the prep-ending banner a day early for every UTC+ user");
t("01:00 local still reports today", api.localDateKey(new Date(2026, 8, 1, 1, 0)) === "2026-09-01");
t("parseLocalDate gives local midnight, not UTC",
   api.parseLocalDate("2026-09-01").getHours() === 0 && api.parseLocalDate("2026-09-01").getDate() === 1);
t("round-trips", api.localDateKey(api.parseLocalDate("2026-03-14")) === "2026-03-14");
t("bad input yields null, not Invalid Date", api.localDateKey("nonsense") === null);
t("no calendar date is still built with toISOString().slice(0,10)",
   !/(prepEnd|coveredDates|past7)[^\n]*toISOString\(\)\.slice\(0, ?10\)/.test(src));

// ─────────────────────────────────────────────────────────────────────────────
section("Allergens — no wheat-bearing recipe may be badged Gluten-Free");
const A = eval(slice("const ALLERGEN_MAP = [", "[", "\n];").replace(/\n];$/, "\n]"));
const gluten = A.find(x => /Gluten/.test(x.name));
for (const term of ["teriyaki", "hoisin", "miso", "gochujang", "soy sauce"]) {
  t(`"${term}" is a gluten term`, gluten.terms.includes(term),
     "soy-derived sauces contain wheat; missing one badged m90 Gluten-Free");
}
const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
const PEND = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
const hit = (txt, e) => {
  const s2 = txt.toLowerCase();
  if ((e.not || []).some(n => s2.includes(n))) return false;
  return (e.terms || []).some(term => s2.includes(term));
};
const WHEAT = /teriyaki|hoisin|miso|soy sauce|gochujang|pasta|noodle|bread|panko|breadcrumb|tortilla|lasagne|gnocchi|\bflour|oats|granola|wrap|pita|couscous|cracker/i;
const NOT = /almond flour|coconut flour|chickpea flour|rice flour|gluten-free|corn tortilla|tamari|rice cake/i;
const leaky = [...RECIPES, ...PEND].filter(r => {
  const labels = (r.batchItems || []).map(b => b.label).join(" ");
  if (!WHEAT.test(labels) || NOT.test(labels)) return false;
  const txt = [labels, (r.steps || []).join(" "), r.subtitle || ""].join(" ");
  return !A.filter(e => hit(txt, e)).some(e => /Gluten/.test(e.name));
});
t(`0 wheat-bearing recipes lack a gluten flag (found ${leaky.length})`, leaky.length === 0,
   leaky.slice(0, 5).map(r => r.id + " " + r.name).join(", "));

// ─────────────────────────────────────────────────────────────────────────────
section("Tier sets — every recipe classified exactly once");
const F = setOf("RECIPE_TIER_FREE"), M = setOf("RECIPE_TIER_MONTHLY"),
      AN = setOf("RECIPE_TIER_ANNUAL"), P = setOf("RECIPE_TIER_PENDING");
const ids = [...RECIPES, ...PEND].map(r => r.id);
t("no duplicate recipe ids", ids.length === new Set(ids).size);
t("tier sets sum to the recipe count", F.size + M.size + AN.size + P.size === ids.length,
   `${F.size}+${M.size}+${AN.size}+${P.size} vs ${ids.length}`);
t("no recipe in two tiers", ids.filter(i => [F, M, AN, P].filter(S => S.has(i)).length > 1).length === 0);
t("no recipe unclassified", ids.filter(i => ![F, M, AN, P].some(S => S.has(i))).length === 0,
   "an unclassified recipe is locked for everyone, including annual");

// ─────────────────────────────────────────────────────────────────────────────
section("Dev tier override — must survive a restart");
t("the unlock flag is written to localStorage", /localStorage\.setItem\(DEV_SESSION_KEY/.test(src),
   "sessionStorage alone died on app close and silently reverted the tier to free");
t("clearing drops the authorisation too", /function clearDevSessionUnlock/.test(src));
t("getDevOverride validates against DEV_TIERS", /DEV_TIERS\.includes\(v\)/.test(src));

// ─────────────────────────────────────────────────────────────────────────────
section("Error handling — a failed fetch must not destroy the app");
t("unhandled rejections are filtered", /const RECOVERABLE = \//.test(src),
   "showOnScreenError wipes #root and offers a localStorage clear");
t("the clear button confirms first", /Clear cached app data and reload\?/.test(src));
t("it keeps user-generated content", /sg_custom_recipes\|sg_pantry\|mp_saved_plans/.test(src));

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
