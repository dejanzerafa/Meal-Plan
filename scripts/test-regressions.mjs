#!/usr/bin/env node
// test-regressions.mjs
//
// Every assertion here corresponds to a bug that actually shipped. The point is
// not coverage — it is that these specific failures cannot come back silently.
//
// Run: node scripts/test-regressions.mjs
// CI runs it once per timezone (see .github/workflows/guards.yml).
//
// ─────────────────────────────────────────────────────────────────────────────
// TWO RULES, both learned the hard way by auditing this file:
//
//   1. GREP THE CODE, NOT THE COMMENTS. An audit reverted five fixes while
//      leaving each fix's explanatory comment in place. All five passed. Every
//      assertion below therefore runs against `src`, which has had its comments
//      blanked out by acorn — not against `raw`.
//
//   2. PREFER BEHAVIOUR TO REGEX. A regex asserts that some text is present,
//      which is not the same as asserting the code is correct. The same audit
//      defeated the paywall check by changing `? r : null` to `? r : r` — the
//      regex only matched up to `canView(r.id)`. Where a function can be pulled
//      out and executed, it is executed. Regexes are the fallback, not the norm.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as acorn from "acorn";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(ROOT, "index.html"), "utf8");

let pass = 0, fail = 0;
const t = (name, cond, detail) => {
  if (cond) { pass++; console.log("   PASS  " + name); }
  else { fail++; console.log("   FAIL  " + name + (detail ? "\n         " + detail : "")); }
};
const section = n => console.log("\n  " + n);

// ── Comment stripping, exactly ───────────────────────────────────────────────
// A regex stripper mangles `https://`, regex literals and strings containing
// "//", which produces false failures — and a suite that cries wolf gets turned
// off. acorn already reports precise comment ranges, and acorn is already a
// dependency (the CI helpers use it). Comments are replaced with spaces rather
// than removed so every byte offset and line number is preserved.
function stripJS(code, sourceType = "script") {
  const comments = [];
  try { acorn.parse(code, { ecmaVersion: "latest", sourceType, onComment: comments }); }
  catch { return code; }              // syntax errors are the other guard's job
  const a = code.split("");
  for (const c of comments) for (let i = c.start; i < c.end; i++) if (a[i] !== "\n") a[i] = " ";
  return a.join("");
}
function stripHTML(html) {
  const RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  let out = "", last = 0, m;
  while ((m = RE.exec(html)) !== null) {
    const attrs = m[1] || "", block = m[2] || "";
    if (/\bsrc\s*=/i.test(attrs) || !block.trim()) continue;
    const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    if (type && !/^(text\/javascript|application\/javascript|module)$/i.test(type)) continue;
    const start = m.index + m[0].indexOf(block);
    out += html.slice(last, start) + stripJS(block, type === "module" ? "module" : "script");
    last = start + block.length;
  }
  return out + html.slice(last);
}
const src = stripHTML(raw);
t("comment stripping preserved every byte offset", src.length === raw.length,
   "assertions compare indexOf positions; a length change would silently skew them");

// ── Extraction helpers (these read `raw` — comments inside a body are inert) ──
const braceBody = (from) => {
  let d = 0, j = raw.indexOf("{", from);
  for (; j < raw.length; j++) {
    if (raw[j] === "{") d++;
    else if (raw[j] === "}") { d--; if (!d) break; }
  }
  return raw.slice(from, j + 1);
};
const fnSrc = (name) => { const i = raw.indexOf("function " + name); return i < 0 ? null : braceBody(i); };
const constFnSrc = (decl) => { const i = raw.indexOf(decl); return i < 0 ? null : braceBody(i); };
const lineWith = (needle) => raw.split("\n").find(l => l.includes(needle));
const slice = (m, o, c) => { const i = raw.indexOf(m), a = raw.indexOf(o, i), b = raw.indexOf(c, a); return raw.slice(a, b + c.length); };
const setOf = n => {
  const m = new RegExp("const\\s+" + n + "\\s*=\\s*new Set\\(").exec(raw);
  if (!m) return new Set();
  const a = raw.indexOf("[", m.index);
  let d = 0, b = a;
  for (; b < raw.length; b++) { if (raw[b] === "[") d++; else if (raw[b] === "]") { d--; if (!d) break; } }
  return new Set(eval(raw.slice(a, b + 1).replace(/\/\/[^\n]*/g, "")));
};

// ─────────────────────────────────────────────────────────────────────────────
section("Paywall — locked recipes must not leak ingredients");
// Shipped bug: the SHOP tab was filtered but the MEALS tab was not, so a lapsed
// subscriber kept the full ingredient list for paid recipes via "Fridge pull".
{
  const line = lineWith("const _vis = r =>");
  t("_vis exists", !!line);
  if (line) {
    // Executed, not grepped. An audit defeated the old regex by changing the
    // alternate branch from `null` to `r` — every character the regex checked
    // was still present and the paywall was wide open.
    const vis = new Function("canView",
      "return " + line.trim().replace(/^const _vis = /, "").replace(/;\s*$/, ""))(id => id === "OPEN");
    t("a locked recipe returns null", vis({ id: "LOCKED", batchItems: [1] }) === null,
       "anything non-null here reaches MealCard, which renders batchItems in Fridge pull");
    t("an unlocked recipe passes through", (vis({ id: "OPEN", batchItems: [1] }) || {}).id === "OPEN");
    t("a null slot stays null", vis(null) === null);
  }
}
for (const slot of ["lr", "dr", "bfr", "prer", "desr"]) {
  t(`meal slot ${slot} passes through _vis`, new RegExp("const " + slot + " = _vis\\(").test(src));
}
t("_vis is defined before the slots use it",
   src.indexOf("const _vis =") > -1 && src.indexOf("const _vis =") < src.indexOf("const lr = _vis("));

// ─────────────────────────────────────────────────────────────────────────────
section("Entitlement — _serverVerified must never be persisted");
{
  const body = constFnSrc("const setUnlocks = (next, forUserId)");
  t("setUnlocks is extractable", !!body);
  if (body) {
    const stored = {};
    const setUnlocks = new Function("setUnlocksState", "safeSet", "currentUserRef",
      body + "\nreturn setUnlocks;"
    )(() => {}, (k, v) => { stored[k] = v; }, { current: { id: "user-1" } });

    setUnlocks({ tier: "annual", allRecipes: true, _serverVerified: true });
    const blob = JSON.parse(stored["mp_unlocks"] || "{}");
    // The old assertion grepped for the destructure. An audit kept that line
    // verbatim and re-added the field on the way into JSON.stringify.
    t("_serverVerified is absent from the persisted blob", !("_serverVerified" in blob),
       "persisting it lets localStorage alone grant a paid tier: " + JSON.stringify(blob));
    t("the tier itself is persisted", blob.tier === "annual");
    t("a verification stamp is written", typeof blob._verifiedAt === "number" && blob._verifiedFor === "user-1");

    setUnlocks({ tier: "free", _serverVerified: false });
    const blob2 = JSON.parse(stored["mp_unlocks"] || "{}");
    t("an unverified write carries no stamp", !("_verifiedAt" in blob2) && !("_verifiedFor" in blob2));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section("Sign-out — no per-person data may survive on a shared device");
{
  const pi = src.indexOf("PRESERVE_PREFIXES = [");
  const preserved = (src.slice(pi, src.indexOf("];", pi)).match(/"[^"]+"/g) || []).map(x => x.slice(1, -1));
  // PREFIX semantics, matching the app: clearSessionState keeps a key when
  // `k === p || k.startsWith(p)`. An exact-match test was defeated by adding
  // the single entry "mp_", which preserved every one of these at once.
  const isPreserved = k => preserved.some(p => k === p || k.startsWith(p));
  for (const k of ["mp_acc_email", "mp_calc_used_email", "mp_profile", "mp_basics",
                   "mp_cal_logs", "sg_supplements", "mp_history", "mp_redeemed_promos",
                   "sg_supp_reminders", "mp_logs_unsynced", "mp_logs_tombstone"]) {
    t(`${k} is not preserved`, !isPreserved(k),
       "it would show the next person the previous user's data");
  }
  t("no catch-all prefix was added", !preserved.some(p => p === "mp_" || p === "sg_" || p === ""),
     "a bare namespace prefix preserves everything under it");
  t("the Supabase auth token is cleared unconditionally",
     /\/\^sb-\.\*-auth-token\$\/\.test\(k\)/.test(src));
}

// ─────────────────────────────────────────────────────────────────────────────
section("Timezone — calendar dates are local days, not UTC instants");
const api = new Function(fnSrc("localDateKey") + "\n" + fnSrc("parseLocalDate") +
                         "\nreturn { localDateKey, parseLocalDate };")();
{
  const start = api.parseLocalDate("2026-09-01");
  const end = new Date(start); end.setDate(end.getDate() + 7);
  t("prep 2026-09-01 + 7 days is 2026-09-08", api.localDateKey(end) === "2026-09-08");
  t("01:00 local still reports today", api.localDateKey(new Date(2026, 8, 1, 1, 0)) === "2026-09-01");
  // Evening local — this is what bites in NEGATIVE offsets, where a morning-only
  // fixture maps to the same UTC day and a UTC implementation looks correct.
  t("22:00 local still reports today", api.localDateKey(new Date(2026, 8, 1, 22, 0)) === "2026-09-01",
     "toISOString() here rolls FORWARD a day west of Greenwich");
  t("parseLocalDate gives local midnight", api.parseLocalDate("2026-09-01").getHours() === 0 &&
     api.parseLocalDate("2026-09-01").getDate() === 1);
  t("round-trips", api.localDateKey(api.parseLocalDate("2026-03-14")) === "2026-03-14");
  t("bad input yields null, not Invalid Date", api.localDateKey("nonsense") === null);
}

section("Access expiry — the two writers store different things");
{
  // Executed, not grepped. The previous version of this section asserted
  // `new Date("...T23:59:59").getHours() === 23` against a literal in THIS file
  // — a test that V8 implements ECMA-262, incapable of failing on any commit.
  const lines = raw.split("\n");
  const a = lines.findIndex(l => l.includes("const _expiryVal = row.tier_expires"));
  t("the expiry computation is extractable", a >= 0);
  if (a >= 0) {
    const expiryOf = new Function("row", lines.slice(a, a + 6).join("\n") + "\nreturn _expiry;");

    // redeem-promo writes a bare calendar date. The promise is "through the end
    // of that day" in the USER's timezone.
    const bare = expiryOf({ tier_expires: "2026-09-01" });
    t("a bare date expires at LOCAL end of day", bare.getHours() === 23 && bare.getDate() === 1,
       "T23:59:59Z, or Date.parse(d)+86399000, cuts Los Angeles off at 16:59 on a day they paid for");
    t("access is still live at 20:00 local on the expiry day",
       new Date(2026, 8, 1, 20, 0, 0) < bare);
    t("and dead at 00:30 local the next day", new Date(2026, 8, 2, 0, 30, 0) > bare);

    // The Stripe webhook writes a full ISO timestamp — already an exact instant.
    const iso = "2026-09-01T23:00:00.000Z";
    const stamp = expiryOf({ tier_expires: iso });
    t("a timestamp is used as the exact instant", stamp.getTime() === Date.parse(iso),
       "slicing it to a date and re-reading that as local EOD revoked access ~27h early in UTC+14");
    t("no expiry is NaN", !isNaN(bare.getTime()) && !isNaN(stamp.getTime()),
       "an Invalid Date compares false, so no tier ever expires");
    t("no tier_expires means no expiry", expiryOf({ tier_expires: null }) === null);
  }
}
t("promo codes are issued with localDateKey",
   /expires: redeemByKey/.test(src) && /const redeemByKey = localDateKey\(redeemBy\)/.test(src),
   "toISOString() in Qatar (UTC+3) issued a code that expired a day early");
t("no toISOString date-slicing remains",
   !/toISOString\(\)\.(split\("T"\)\[0\]|slice\(0, ?10\))/.test(src));

// ─────────────────────────────────────────────────────────────────────────────
section("Allergens — no wheat-bearing recipe may be badged Gluten-Free");
const A = eval(slice("const ALLERGEN_MAP = [", "[", "\n];").replace(/\n];$/, "\n]"));
const gluten = A.find(x => /Gluten/.test(x.name));
for (const term of ["teriyaki", "hoisin", "miso", "gochujang", "soy sauce"]) {
  t(`"${term}" is a gluten term`, gluten.terms.includes(term),
     "soy-derived sauces contain wheat; missing one badged m90 Gluten-Free");
}
{
  const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
  const PEND = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
  // The app's OWN detector, extracted and executed — not a copy.
  //
  // The copy that used to live here was wrong in the dangerous direction and
  // reported four false positives. It treated `not` as "any match suppresses the
  // whole recipe"; the app REMOVES the excluded phrase and keeps matching, so
  // "Self-rising flour + Coconut flour" correctly still flags gluten. A test that
  // re-implements the logic it is checking tests the re-implementation.
  const detectAllergens = new Function("ALLERGEN_MAP",
    fnSrc("_allergenHit") + "\n" + fnSrc("detectAllergens") + "\nreturn detectAllergens;")(A);
  t("the extracted detector works on a known case",
     detectAllergens({ batchItems: [{ label: "Self-rising flour" }, { label: "Coconut flour" }] })
       .some(x => /Gluten/.test(x.name)),
     "an excluded phrase must neutralise ITSELF, not the whole recipe");
  // Independent cross-check list. An audit slipped `seitan`, `barley`, `semolina`
  // and `farro` past the previous version — all wheat or wheat-protein, all
  // badged Gluten-Free, none in the list.
  const WHEAT = new RegExp([
    "teriyaki","hoisin","miso","soy sauce","gochujang","pasta","noodle","udon","ramen",
    "bread","panko","breadcrumb","crouton","tortilla","lasagne","gnocchi","\\bflour",
    "oats","granola","wrap","pita","naan","bagel","brioche","couscous","cous cous",
    "cracker","semolina","farro","bulgur","orzo","seitan","barley","\\brye\\b","spelt",
    "\\bbeer\\b","\\bmalt","wonton","filo","phyllo","puff pastry","tortellini","ravioli",
    "dumpling","seitan",
  ].join("|"), "i");
  const NOT = /almond flour|coconut flour|chickpea flour|rice flour|gluten-free|corn tortilla|tamari|rice cake|buckwheat|rice noodle/i;
  const leaky = [...RECIPES, ...PEND].filter(r => {
    const items = (r.batchItems || []).map(b => b.label);
    // PER ITEM, not against the joined string. Joining let one "gluten-free
    // stock" whitelist an entire recipe, pasta and all.
    if (!items.some(l => WHEAT.test(l) && !NOT.test(l))) return false;
    return !detectAllergens(r).some(e => /Gluten/.test(e.name));
  });
  t(`0 wheat-bearing recipes lack a gluten flag (found ${leaky.length})`, leaky.length === 0,
     leaky.slice(0, 5).map(r => r.id + " " + r.name).join(", "));
}

// ─────────────────────────────────────────────────────────────────────────────
section("Tier sets — every recipe classified exactly once");
{
  const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
  const PEND = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
  const F = setOf("RECIPE_TIER_FREE"), M = setOf("RECIPE_TIER_MONTHLY"),
        AN = setOf("RECIPE_TIER_ANNUAL"), P = setOf("RECIPE_TIER_PENDING");
  const ids = [...RECIPES, ...PEND].map(r => r.id);
  t("no duplicate recipe ids", ids.length === new Set(ids).size);
  t("tier sets sum to the recipe count", F.size + M.size + AN.size + P.size === ids.length,
     `${F.size}+${M.size}+${AN.size}+${P.size} vs ${ids.length}`);
  t("no recipe in two tiers", ids.filter(i => [F, M, AN, P].filter(S => S.has(i)).length > 1).length === 0);
  t("no recipe unclassified", ids.filter(i => ![F, M, AN, P].some(S => S.has(i))).length === 0);
}

// ─────────────────────────────────────────────────────────────────────────────
section("Dev tier override — must survive a restart");
t("the unlock flag is written to localStorage", /localStorage\.setItem\(DEV_SESSION_KEY/.test(src),
   "sessionStorage alone died on app close and silently reverted the tier to free");
t("clearing drops the authorisation too", /function clearDevSessionUnlock/.test(src));
t("getDevOverride validates against DEV_TIERS", /DEV_TIERS\.includes\(v\)/.test(src));

// ─────────────────────────────────────────────────────────────────────────────
section("Error handling — a failed fetch must not destroy the app");
t("unhandled rejections are filtered", /const RECOVERABLE = \//.test(src));
t("the clear button confirms first", /Clear cached app data and reload\?/.test(src));
t("it keeps user-generated content", /sg_custom_recipes\|sg_pantry\|mp_saved_plans/.test(src));

// ─────────────────────────────────────────────────────────────────────────────
section("Meal-log durability ledger");
// Shipped bug: `window._sg_pending_logs` was an in-memory Set meaning only "a
// write is in flight". loadUserData deletes any local date the server lacks, so
// anything logged offline, logged signed-out, or logged before a reload was
// destroyed on the next focus.
{
  // LITERALS, not values read out of source. Deriving the key from the file made
  // the test follow a rename — while the KEEP regex in index.html still listed
  // the old name, which is exactly the breakage the assertion claimed to prevent.
  const KU = "mp_logs_unsynced", KT = "mp_logs_tombstone";
  t("the ledger keys are the expected literals",
     new RegExp(`const LOGS_UNSYNCED = "${KU}"`).test(src) &&
     new RegExp(`const LOGS_TOMBSTONE = "${KT}"`).test(src),
     "renaming one desynchronises it from the KEEP regex and from clearSessionState");

  const names = ["_readDateSet", "_writeDateSet", "markLogUnsynced", "markLogSynced",
                 "markLogTombstoned", "clearLogTombstone", "unsyncedLogDates", "tombstonedLogDates"];
  const bodies = names.map(fnSrc);
  t("every ledger helper exists", bodies.every(Boolean),
     "missing: " + names.filter((_, i) => !bodies[i]).join(", "));

  if (bodies.every(Boolean)) {
    const store = {};
    const mk = (st) => new Function("localStorage", "safeSet",
      `const LOGS_UNSYNCED=${JSON.stringify(KU)};const LOGS_TOMBSTONE=${JSON.stringify(KT)};\n` +
      bodies.join("\n") +
      "\nreturn {markLogUnsynced,markLogSynced,markLogTombstoned,clearLogTombstone,unsyncedLogDates,tombstonedLogDates};"
    )({ getItem: k => (k in st ? st[k] : null) }, (k, v) => { st[k] = v; });
    const L = mk(store);

    L.markLogUnsynced("2026-09-01");
    t("an unsynced date is recorded", L.unsyncedLogDates().has("2026-09-01"));
    t("and it is PERSISTED, not held in memory", typeof store[KU] === "string");
    t("it survives a fresh page load", mk({ ...store }).unsyncedLogDates().has("2026-09-01"));
    L.markLogSynced("2026-09-01");
    t("a confirmed write clears it", !L.unsyncedLogDates().has("2026-09-01"));
    L.markLogTombstoned("2026-09-02");
    t("a delete is tombstoned", L.tombstonedLogDates().has("2026-09-02"));
    L.clearLogTombstone("2026-09-02");
    t("a confirmed delete clears the tombstone", !L.tombstonedLogDates().has("2026-09-02"));
    store[KU] = "{not json";
    t("corrupt ledger JSON degrades to empty", L.unsyncedLogDates().size === 0);
  }

  // ── Write serialisation ──
  const qBody = fnSrc("queueLogWrite");
  t("queueLogWrite exists", !!qBody);
  if (qBody) {
    const q = new Function("const _logWriteChains = new Map();\n" + qBody + "\nreturn queueLogWrite;")();
    const order = [];
    const slow = (tag, ms) => () => new Promise(r => setTimeout(() => { order.push(tag); r(); }, ms));
    await Promise.all([
      q("2026-09-01", slow("log", 30)),       // DELETE+INSERT, slow
      q("2026-09-01", slow("unlog", 1)),      // DELETE, fast — must still run second
      q("2026-09-05", slow("other", 1)),
    ]);
    t("same-date writes run in issue order", order.indexOf("log") < order.indexOf("unlog"),
       "a double-tap interleaved as log-DELETE, unlog-DELETE, log-INSERT left the row ALIVE " +
       "with the tombstone already cleared — the un-logged day came back permanently. Got: " + order.join(","));
    // A rejected link must not strand the queue for that date.
    let ran = false;
    await q("2026-09-09", () => Promise.reject(new Error("boom"))).catch(() => {});
    await q("2026-09-09", async () => { ran = true; });
    t("a failed write does not strand later writes for that date", ran);
  }

  t("the in-memory pending Set is gone", !/_sg_pending_logs/.test(src));
  t("only a CONFIRMED write clears the ledger", /if \(ok\) markLogSynced/.test(src) &&
     !/\.finally\(\s*\(\)\s*=>\s*markLogSynced/.test(src),
     "saveMealLogToSupabase swallows its own error; an unconditional clear marks failures as durable");
  // Return contracts — flushPendingMealLogs and the setCalLogs handlers both
  // branch on these. `return;` instead of `return false;` clears the ledger on
  // a failed write.
  for (const fn of ["saveMealLogToSupabase", "removeMealLogFromSupabase"]) {
    const b = fnSrc(fn) || "";
    t(`${fn} returns true on success and false on failure`,
       /return true;/.test(b) && (b.match(/return false;/g) || []).length >= 2,
       "a bare `return` is undefined, which is falsy for success and clears nothing — or worse, truthy-tested");
  }
  t("the ledger is written even when signed out",
     /markLogUnsynced\(l\.date\);[\s\S]{0,400}if \(!signedIn\) continue;/.test(src),
     "a prep day logged before sign-in was deleted by the first sync");
  // The flush body is checked as a UNIT. Grepping only for the signature let an
  // audit put the `currentUser` guard back inside it — the signature was intact,
  // every assertion passed, and the entire replay was dead code again.
  {
    const body = fnSrc("flushPendingMealLogs") || "";
    // fnSrc anchors on "function <name>", so `body` starts after the `async`.
    t("the flush takes userId as a parameter",
       /^function flushPendingMealLogs\(userId, logs\)/.test(body) &&
       /async function flushPendingMealLogs\(userId, logs\)/.test(src));
    t("its body NEVER reads currentUser", !!body && !/currentUser/.test(body),
       "loadUserData is a useCallback with [] deps, so `currentUser` is null in its closure " +
       "FOREVER. Any reference to it here silently disables the whole replay.");
    t("and its caller passes a userId", /flushPendingMealLogs\(userId,/.test(src));
    t("the concurrent-run guard actually returns",
       /if \(_flushInFlight\.current\) return;/.test(body) && /_flushInFlight\.current = true;/.test(body),
       "loadUserData fires on focus AND every 3s for 90s post-checkout; two flushes racing the " +
       "unique index on (user_id,date) pin a date as unsynced forever");
    t("the flush routes its writes through queueLogWrite",
       (body.match(/queueLogWrite\(/g) || []).length >= 2,
       "an unqueued replay can interleave with a live write for the same date");
  }
  // And the live-write path uses it too — testing queueLogWrite in isolation says
  // nothing about whether anything calls it.
  t("setCalLogs queues its log write", /queueLogWrite\(l\.date, \(\) =>/.test(src));
  t("setCalLogs queues its un-log write", /queueLogWrite\(d, \(\) =>/.test(src));
  t("pending writes are replayed before the server read",
     src.indexOf("flushPendingMealLogs") < src.indexOf('from("meal_logs").select'));
  t("tombstoned dates are filtered out of the server result",
     /sbFmt\.filter\(l => !_tombs\.has\(l\.date\)\)/.test(src));
  const ki = src.indexOf("var KEEP=/^(");
  const keep = src.slice(ki, src.indexOf("/;", ki));
  for (const k of ["mp_logs_unsynced", "mp_logs_tombstone", "mp_cal_logs"]) {
    t(`${k} is in the error-screen KEEP list`, keep.includes(k),
       "keeping the logs but dropping the ledger marks them all synced and the next read deletes them");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section("Restore-on-sign-in — dropping a key from PRESERVE requires restoring it");
t("mp_basics is restored from the profiles row", /row\.weight_kg != null/.test(src) &&
   /saveUserBasics\(_next\)/.test(src),
   "otherwise DOB, gender, weight and height are blank in the ME tab after sign-in");
t("the restore fills gaps only, never overwriting", /const _blank = v =>/.test(src) &&
   /_blank\(_next\.weight\) && row\.weight_kg != null/.test(src),
   "this runs on every focus; server-wins reverted ME-tab edits and forced kg/cm over lb/ft-in");
t("unit preferences are only set alongside a value they belong to",
   /if \(_blank\(_next\.weightUnit\)\) _next\.weightUnit = "kg"/.test(src),
   "unconditional weightUnit:'kg' turned 180 lb / 5 ft 11 in into 81.6 kg / 180 cm on next foreground");
t("a no-op refresh does not churn updatedAt", /const _changed =/.test(src));
t("the restore actually calls saveUserBasics", /\n\s*if \(_changed\) saveUserBasics\(_next\);/.test(src),
   "an audit neutered this to `if (false)` and every other assertion in this section still passed");
// Whitespace-tolerant: the previous version required two statements on ONE line
// and went red on a reformat, with no behaviour change.
t("supplement reminders are rescheduled on load",
   /setSupps\(list\)[\s\S]{0,300}saveSuppList\(list\)[\s\S]{0,900}scheduleReminders\(list\)/.test(src),
   "reminders silently stopped firing until the user next edited a supplement");
t("and on the local-push branch too", /setSupps\(local\)[\s\S]{0,200}scheduleReminders\(local\)/.test(src));
t("the PWA reminder poller reads the shape scheduleReminders writes",
   /Array\.isArray\(r\.times\) \? r\.times : \(r\.time \? \[r\.time\] : \[\]\)/.test(src),
   "scheduleReminders writes flat {time}; the poller read r.times.some(...) — always undefined, " +
   "so the PWA supplement reminder had never fired for anyone");

// ─────────────────────────────────────────────────────────────────────────────
section("PostgREST in-list escaping — a quoted name must not delete the wrong row");
{
  const line = lineWith("const esc = n =>");
  t("the esc helper exists", !!line);
  if (line) {
    const esc = new Function("return " + line.trim().replace(/^const esc = /, "").replace(/;\s*$/, ""))();
    const parse = list => {
      if (list[0] !== "(" || list[list.length - 1] !== ")") return null;
      const body = list.slice(1, -1), out = []; let i = 0;
      while (i < body.length) {
        if (body[i] !== '"') return null;
        i++; let cur = "", closed = false;
        while (i < body.length) {
          if (body[i] === "\\") { cur += body[i + 1]; i += 2; continue; }
          if (body[i] === '"') { i++; closed = true; break; }
          cur += body[i++];
        }
        if (!closed) return null;
        out.push(cur);
        if (body[i] === ",") i++; else if (i < body.length) return null;
      }
      return out;
    };
    const names = ["Omega-3, EPA/DHA", "Vitamin D3 (5000 IU)", `Bob's "Best" Zinc`,
                   "Omega\\3", "Creatine\\", 'Quote" and back\\slash', "plain"];
    const round = parse("(" + names.map(n => '"' + esc(n) + '"').join(",") + ")");
    t("every name round-trips through the escaper",
       Array.isArray(round) && round.length === names.length && round.every((v, i) => v === names[i]),
       "got " + JSON.stringify(round));
    t("escaping is backslash, not SQL doubling", esc('a"b') === 'a\\"b');
    t("backslashes are escaped BEFORE quotes", esc("a\\b") === "a\\\\b");
  }
  t("the prune error is not discarded", /if \(pruneErr\) throw pruneErr;/.test(src));
  // Targets the dedupe statement itself. The previous version sliced FORWARD from
  // `const unique`, but the statement sits before it, so it searched empty space
  // and could never fail.
  t("the supplement dedupe key is case-SENSITIVE",
     /byName\.set\(String\(item\.name \|\| ""\)\.trim\(\), item\)/.test(src),
     "the DB unique index is case-sensitive; lowercasing collapsed 'Creatine' and 'creatine' " +
     "and the prune then deleted one of them");
}

// ─────────────────────────────────────────────────────────────────────────────
section("Netlify functions — the method gate must match what the client sends");
{
  const fnDir = join(ROOT, "netlify", "functions");
  const cu = stripJS(readFileSync(join(fnDir, "check-user.js"), "utf8"));
  // The old assertion matched "POST" anywhere — including the CORS header — so a
  // gate reverted to GET-only passed it.
  t("check-user's method gate accepts POST",
     /event\.httpMethod !== "GET" && event\.httpMethod !== "POST"/.test(cu),
     "the client POSTs; a GET-only gate returns 405 and the server-side calculator gate silently opens");
  t("and advertises POST in Access-Control-Allow-Methods", /Allow-Methods[^\n]*POST/.test(cu),
     "a cross-origin preflight fails even though the gate itself would accept the request");
  const ra = stripJS(readFileSync(join(fnDir, "restore-account.js"), "utf8"));
  t("restore-account declares corsHeaders before the auth gate",
     ra.indexOf("const corsHeaders") < ra.indexOf("statusCode: 401"),
     "an undeclared identifier here was a 502 on every request, not a 401");
  t("no self-referencing const shadows an imported helper",
     !/const clientIp = [^\n]*clientIp\(/.test(ra), "temporal dead zone: ReferenceError at runtime");
  t("restore-account requires a bearer token", /_auth\.startsWith\("Bearer "\)/.test(ra),
     "it returned name and paid-subscription status for ANY email, to anyone");

  // ── The subscriptions ledger ──
  // Shipped bug: the webhook wrote `at_risk` in four places and no SQL created
  // it; the status CHECK said 'cancelled' and Stripe sends 'canceled'. Every
  // renewal and every cancellation update failed silently for months. The app
  // grants access from profiles.tier, so nobody noticed — until cancelled
  // subscribers kept receiving product mail.
  const wh = stripJS(readFileSync(join(fnDir, "stripe-webhook.js"), "utf8"));
  const schema = readFileSync(join(ROOT, "supabase-schema.sql"), "utf8");
  const part11 = readFileSync(join(ROOT, "supabase-schema-fix-part11-RUN-THIS.sql"), "utf8");
  t("every column the webhook writes to subscriptions exists in the schema",
     ["at_risk", "status", "current_period_end", "cancel_at_period_end", "stripe_subscription_id"]
       .every(c => new RegExp("\\b" + c + "\\b").test(schema)),
     "a column written by code that no SQL creates fails with 42703 on every write");
  t("the schema's status CHECK uses Stripe's spelling", /'canceled'/.test(schema) && !/CHECK \(status IN \([^)]*'cancelled'/.test(schema),
     "Stripe sends `canceled`; a CHECK on `cancelled` rejects every cancellation");
  t("part 11 adds at_risk and widens the CHECK", /add column if not exists at_risk/.test(part11) && /'canceled'/.test(part11));
  // The live DB (diagnostic 2026-09-05) had none of these; the functions
  // selected or wrote them anyway and 400'd on every call.
  const fnFiles = readdirSync(fnDir).filter(f => f.endsWith(".js")).map(f => stripJS(readFileSync(join(fnDir, f), "utf8")));
  const allFn = fnFiles.join("\n");
  t("no function selects users.subscription_status / users.plan_type",
     !/rest\/v1\/users\?select=[^`'"]*\b(subscription_status|plan_type)\b/.test(allFn),
     "those columns exist in no schema; admin-list-users 400'd on every call");
  const part12 = readFileSync(join(ROOT, "supabase-schema-fix-part12-RUN-THIS.sql"), "utf8");
  t("part 12 adds promo_codes.redeemed_by / redeemed_at",
     /add column if not exists redeemed_by/.test(part12) && /add column if not exists redeemed_at/.test(part12),
     "redeem-promo.js has always written them; every redemption 400'd and read as 'already claimed'");
  t("part 12 entitles any profile with an active sub and a NULL tier", /and p\.tier is null/.test(part12));
  // Every subscriptions write must capture its error. The renewal write at
  // invoice.payment_succeeded was a bare `await` and discarded the 42703.
  const subWrites = [...wh.matchAll(/(?:const \{ error: \w+ \} = )?await supabase\s*\.from\("subscriptions"\)\s*\.(?:update|insert)\(/g)];
  const bare = subWrites.filter(m => !/^const \{ error/.test(m[0]));
  t(`every subscriptions write captures its error (${subWrites.length} writes)`, bare.length === 0,
     "PostgREST resolves on failure; a bare await silently discards a failed write");
}

// ─────────────────────────────────────────────────────────────────────────────
section("Paid path — the buyer must arrive in the app SIGNED IN");
// Shipped bug: checkout ran on marketing.soulgainz.app (signed in there) and
// Stripe returned the buyer to soulgainz.app, a different origin with its own
// localStorage and therefore no session. success.html said "You're in!"
// unconditionally — verify-session.js had zero callers — above a locked
// library and a Join-the-waitlist button.
{
  const cc  = stripJS(readFileSync(join(ROOT, "netlify", "functions", "create-checkout.js"), "utf8"));
  const ms  = readFileSync(join(ROOT, "marketing-site", "success.html"), "utf8");
  const as  = readFileSync(join(ROOT, "success.html"), "utf8");
  const vs  = stripJS(readFileSync(join(ROOT, "netlify", "functions", "verify-session.js"), "utf8"));
  t("MARKETING_URL defaults to the marketing origin", /MARKETING_URL \|\| "https:\/\/marketing\.soulgainz\.app"/.test(cc),
     "a default of the app origin re-creates the signed-out landing");
  t("cancel_url also returns to the marketing site", /cancel_url: `\$\{marketingUrl\}\/pricing`/.test(cc));
  t("verify-session returns the auth userId the app checks against",
     /userId: session\.metadata\?\.userId/.test(vs) && /SOLD_TIERS\.has\(tier\)/.test(vs) && !/error: err\.message/.test(vs));
  t("Stripe returns the buyer to the MARKETING origin, where the session lives",
     /success_url: `\$\{marketingUrl\}\/success/.test(cc),
     "a success_url on the app domain lands the buyer signed out");
  t("marketing success page verifies with Stripe before claiming anything",
     /verify-session/.test(ms) && /if \(!verdict\.paid\)/.test(ms),
     "the redirect alone is not proof of payment — a declined card still redirects");
  t("verify-session is no longer dead code",
     [ms, raw].some(s => /\/verify-session/.test(s)),
     "it existed for months with zero callers");
  t("verify-session returns CORS headers on every response, not just preflight",
     /"Access-Control-Allow-Origin": corsOrigin/.test(vs) && /statusCode: 200, headers/.test(vs),
     "without it the browser blocks the JSON and the success page can never learn the payment went through");
  // ── The two success pages, EXECUTED under scripted scenarios ──────────────
  // Greps here were defeated three ways in review: `sameUser` computed but not
  // used; the unpaid branch calling show() without `return` and falling through
  // to the handoff; a failed setSession still revealing "You're in". Each page
  // is run in a vm with a fake DOM and a scripted fetch/supabase, and the
  // assertion is on what it DID — which element ended up visible, whether
  // location.replace fired, whether signOut was called.
  const runPage = async (html, opts) => {
    const vm = await import("node:vm");
    const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
      .filter(m => !/\bsrc\s*=/.test(m[1]) && m[2].trim()).map(m => m[2]);
    const els = {}; const el = id => (els[id] ||= { id, hidden: false, textContent: "", innerHTML: "", style: {} });
    for (const id of html.matchAll(/id="([^"]+)"/g)) el(id[1]);
    for (const id of html.matchAll(/<div id="([^"]+)" hidden>/g)) el(id[1]).hidden = true;
    const calls = { replace: null, signOut: null, setSession: null, fetch: [] };
    const sb = {
      auth: {
        getSession: async () => ({ data: { session: opts.session || null } }),
        signOut: async (o) => { calls.signOut = o; },
        setSession: async (p) => { calls.setSession = p; return opts.setSessionResult || { data: { session: { user: {} } }, error: null }; },
      },
    };
    const ctx = vm.createContext({
      console: { log() {}, warn() {}, error() {}, info() {} },
      location: { search: opts.search || "", hash: opts.hash || "", origin: "https://x", pathname: "/success", href: "https://x/success",
                  replace: (u) => { calls.replace = u; } },
      navigator: { standalone: false }, setTimeout, clearTimeout, URLSearchParams, URL,
      atob: (b) => Buffer.from(b, "base64").toString("binary"),
      history: { replaceState() {} },
      localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      matchMedia: () => ({ matches: true }),
      fetch: async (u) => { calls.fetch.push(u); const v = opts.verdict; return { ok: !!v, json: async () => v }; },
      document: { getElementById: id => els[id] || null, querySelectorAll: sel => sel === '[id^="state-"]' ? Object.values(els).filter(e => e.id.startsWith("state-")) : [], write() {} },
      supabase: { createClient: () => sb },
    });
    // In a browser window === globalThis. The page calls window.matchMedia
    // and window.supabase, so the context must be its own window.
    ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
    for (const b of blocks) { try { await vm.runInContext(b, ctx, { filename: "page" }); } catch (e) { if (e.name === "SyntaxError") throw e; } }
    // let the async IIFE settle
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const visible = Object.values(els).filter(e => e.id.startsWith("state-") && !e.hidden).map(e => e.id);
    return { visible, calls };
  };
  const jwt = (sub) => "h." + Buffer.from(JSON.stringify({ sub })).toString("base64url") + ".s";
  const U = "11111111-1111-1111-1111-111111111111";

  // marketing success page
  {
    const paidOwner = { paid: true, tier: "monthly", userId: U, email: "a@b.c" };
    const sess = (id) => ({ access_token: jwt(id), refresh_token: "r", user: { id } });

    let r = await runPage(ms, { search: "?session_id=cs_test_abc", verdict: paidOwner, session: sess(U) });
    t("marketing: paid + own session → hands off to the app", r.calls.replace && r.calls.replace.startsWith("https://soulgainz.app/success#"),
       "visible=" + r.visible + " replace=" + r.calls.replace);
    t("marketing: the fragment carries session_id for the app to re-verify", /[#&]session_id=cs_test_abc/.test(r.calls.replace || ""));
    t("marketing: signs itself out LOCALLY after handing over", r.calls.signOut && r.calls.signOut.scope === "local",
       "both origins holding one refresh-token family → reuse detection revokes it → buyer signed out later");
    t("marketing: tokens are in the fragment, not the query", !/\?[^#]*access_token/.test(r.calls.replace || ""));

    r = await runPage(ms, { search: "?session_id=cs_test_abc", verdict: paidOwner, session: sess("other-user") });
    t("marketing: paid but session belongs to someone else → sign-in, NO handoff",
       r.calls.replace === null && r.visible.join() === "state-signin", "visible=" + r.visible + " replace=" + r.calls.replace);

    r = await runPage(ms, { search: "?session_id=cs_test_abc", verdict: { paid: false, status: "unpaid" }, session: sess(U) });
    t("marketing: unpaid → 'not completed', NO handoff, no signOut",
       r.calls.replace === null && r.calls.signOut === null && r.visible.join() === "state-unpaid", "visible=" + r.visible);

    r = await runPage(ms, { search: "?session_id=cs_test_abc", verdict: null, session: sess(U) });
    t("marketing: verify unreachable → error state, NO handoff", r.calls.replace === null && r.visible.join() === "state-error");

    r = await runPage(ms, { search: "", session: sess(U) });
    t("marketing: reload with no session_id → neutral state, not 'payment not completed'",
       r.visible.join() === "state-error" && r.calls.fetch.length === 0, "visible=" + r.visible);
  }

  // app success page
  {
    const frag = (sub, sid = "cs_test_abc") => `#access_token=${jwt(sub)}&refresh_token=r&tier=monthly&session_id=${sid}`;
    const owner = { paid: true, tier: "monthly", userId: U };

    let r = await runPage(as, { hash: frag(U), verdict: owner });
    t("app: verified owner tokens → setSession → 'You're in'", r.calls.setSession && r.visible.join() === "state-in",
       "visible=" + r.visible + " setSession=" + !!r.calls.setSession);
    t("app: it re-verified the session_id itself", r.calls.fetch.some(u => /verify-session\?session_id=cs_test_abc/.test(u)));

    r = await runPage(as, { hash: frag("attacker"), verdict: owner });
    t("app: token subject ≠ session owner → REFUSED (login-CSRF)", r.calls.setSession === null && r.visible.join() === "state-signin",
       "a crafted link with an attacker's tokens must not sign the victim into the attacker's account");

    r = await runPage(as, { hash: frag(U), verdict: { paid: false } });
    t("app: unpaid session → refused", r.calls.setSession === null && r.visible.join() === "state-signin");

    r = await runPage(as, { hash: frag(U), verdict: owner, setSessionResult: { data: null, error: new Error("bad") } });
    t("app: setSession fails → sign-in, NOT 'You're in'", r.visible.join() === "state-signin", "visible=" + r.visible);

    r = await runPage(as, { hash: "" });
    t("app: typed /success by hand → sign-in prompt, nothing verified", r.visible.join() === "state-signin" && r.calls.fetch.length === 0);
  }
  t("the app arms the post-checkout poller from the handoff marker",
     /localStorage\.setItem\('sg_awaiting_upgrade'/.test(as) &&
     /localStorage\.getItem\("sg_awaiting_upgrade"\)/.test(src) &&
     /localStorage\.removeItem\("sg_awaiting_upgrade"\)/.test(src),
     "the marketing-first path never calls openSubscribePage(), so nothing else arms the poller");
  t("the marker is a one-shot with an expiry", /Date\.now\(\) - _mark < 10 \* 60 \* 1000/.test(src),
     "a stale flag would fire 30 Supabase round trips on every launch");
  t("marketing success page deep-links to the ME tab by its real id",
     /tab=profile/.test(ms) && !/tab=me\b/.test(ms),
     "the tab is called 'profile' internally; ?tab=me renders a blank screen");
  t("verify-session answers an unknown session id with 404, not 500",
     /err\.code === "resource_missing"/.test(vs) && /missing \? 404 : 500/.test(vs));
  t("/success is routed on the marketing site",
     /from = "\/success"/.test(readFileSync(join(ROOT, "marketing-site", "netlify.toml"), "utf8")));
}

// ─────────────────────────────────────────────────────────────────────────────
section("Sign-up — email confirmation must not be a dead end");
// Shipped bug: signUp() had no emailRedirectTo, so the confirmation link used
// Supabase's Site URL, which 301s to landing.html — a page with no Supabase
// client. The token was never consumed. Meanwhile the UI showed "You're in!"
// and marked onboarding complete, so the user was silently anonymous forever.
{
  const su = raw.slice(raw.indexOf("async function handleSignup"), raw.indexOf("async function handleSignin"));
  t("signUp passes emailRedirectTo pointing at the APP",
     /emailRedirectTo: window\.location\.origin \+ "\/index\.html\?confirmed=1"/.test(su),
     "the same fix already applied to resetPasswordForEmail; never applied here");
  t("no session after signUp means 'confirm', not 'success'",
     /if \(!data\.session\) \{[\s\S]{0,300}setStatus\("confirm"\)/.test(su) &&
     su.indexOf('setStatus("confirm")') < su.indexOf('setStatus("success")'),
     "the old code showed You're in! regardless");
  t("a pending confirmation is recorded, not marked registered",
     /safeSet\("sg_onboarded", "pending_confirm"\)/.test(su));
  t("the duplicate-email (empty identities) case is caught",
     /data\.user\.identities\.length === 0/.test(su),
     "Supabase answers a duplicate sign-up with a user and no identities, not an error");
  {
    // The gate is the useState initialiser: `() => { try { const status = … } }`.
    // Extract it and run it against a fake localStorage + location.
    const gi = raw.indexOf("const [onboardStep, setOnboardStep] = useState(() => {");
    const gate = braceBody(raw.indexOf("{", gi + "const [onboardStep, setOnboardStep] = useState(() => ".length));
    const run = (store, search = "") => {
      const w = {};
      const fn = new Function("localStorage", "window",
        "return (function() " + gate + ")();")(
        { getItem: k => (k in store ? store[k] : null), removeItem: k => { delete store[k]; }, setItem: (k, v) => { store[k] = v; } },
        Object.assign(w, { location: { search } }));
      return { step: fn, armed: w._sg_upload_on_auth === true };
    };
    t("gate: registered → app", run({ sg_onboarded: "registered" }).step === "app");
    t("gate: pending_confirm → sign-in screen, not the app", run({ sg_onboarded: "pending_confirm" }).step === "signup",
       "opening the app as if they had an account is the bug being fixed");
    t("gate: confirmation landing arms the local-data upload", run({ sg_onboarded: "pending_confirm" }, "?confirmed=1").armed === true,
       "SIGNED_IN otherwise wipes local favourites against an empty server");
    t("gate: a plain relaunch while pending does NOT arm it", run({ sg_onboarded: "pending_confirm" }).armed === false);
    t("gate: first visit → story", run({}).step === "story");
  }
  {
    // The post-checkout marker block, executed.
    const mi = raw.indexOf('const _mark = parseInt(localStorage.getItem("sg_awaiting_upgrade")');
    const blockStart = raw.lastIndexOf("try {", mi);
    const block = braceBody(blockStart + 4);
    const run = (ageMs) => {
      const store = ageMs === null ? {} : { sg_awaiting_upgrade: String(Date.now() - ageMs) };
      const w = {};
      new Function("localStorage", "window", "try " + block + " catch (_) {}")(
        { getItem: k => (k in store ? store[k] : null), removeItem: k => { delete store[k]; } }, w);
      return { armed: w._sg_awaiting_upgrade === true, cleared: !("sg_awaiting_upgrade" in store) };
    };
    t("marker: 1-minute-old → arms the poller and is consumed", run(60e3).armed && run(60e3).cleared);
    t("marker: 11-minutes-old → NOT armed, still consumed", !run(11 * 60e3).armed && run(11 * 60e3).cleared,
       "a stale flag would fire 30 Supabase round trips on every launch");
    t("marker: absent → not armed", !run(null).armed);
  }
  t("the confirmation landing arms the local-data upload BEFORE the auth listener",
     /get\("confirmed"\) === "1"\) window\._sg_upload_on_auth = true/.test(src),
     "SIGNED_IN otherwise calls loadUserData, which wipes local favourites against an empty server");
  t("a signed-in pending user is promoted to registered",
     /localStorage\.getItem\("sg_onboarded"\) === "pending_confirm"/.test(src) &&
     /safeSet\("sg_onboarded", "registered"\);\s*localStorage\.removeItem\("sg_pending_confirm_email"\)/.test(src));
  t("the sign-in screen can resend the confirmation", /sb\.auth\.resend\(\{ type: "signup"/.test(src));
  for (const f of ["pricing.html", "sign-up.html"]) {
    const m = readFileSync(join(ROOT, "marketing-site", f), "utf8");
    t(`marketing ${f} signUp has emailRedirectTo`, /emailRedirectTo: location\.origin \+ '\/pricing'/.test(m),
       "same dead end on the marketing site");
  }

  // ── Welcome email ──
  // Shipped bug: save-user.js sends the welcome unless skip_email; the only
  // caller hardcoded skip_email: true and the sign-up handler never called it.
  // No user ever received one.
  const welcome = fnSrc("sendWelcomeEmail") || "";
  t("sendWelcomeEmail exists", !!welcome);
  if (welcome) {
    // Executed with a stub fetch. A grep was defeated by `if (em || …) return`
    // — every string the grep looked for was still in the body.
    const sent = [];
    const send = new Function("fetch", welcome + "\nreturn sendWelcomeEmail;")((url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return Promise.resolve(); });
    send("  Dejan@Example.COM ", "D".repeat(80), "Z");
    t("it POSTs save-user with the normalised email", sent.length === 1 && /save-user/.test(sent[0].url) && sent[0].body.email === "dejan@example.com",
       JSON.stringify(sent));
    t("it does NOT pass skip_email", sent.length === 1 && !("skip_email" in sent[0].body),
       "that flag is exactly what suppressed the welcome for every user");
    t("it sends marketing_opt_in: false", sent.length === 1 && sent[0].body.marketing_opt_in === false,
       "the in-app sign-up has no marketing checkbox; assumed consent is not consent");
    t("names are truncated to 50", sent.length === 1 && sent[0].body.first_name.length === 50);
    send(""); send("nope");
    t("no call for an invalid email", sent.length === 1);
  }
  t("it is called on the immediate-session sign-up path",
     /window\._sg_upload_on_auth = true;\s*sendWelcomeEmail\(em, name\.trim\(\), surname\.trim\(\), data\.session && data\.session\.access_token\)/.test(src),
     "the bearer is what lets save-user send mail at all");
  t("and on the confirmation-landing path",
     /localStorage\.removeItem\("sg_pending_confirm_email"\);[\s\S]{0,600}sendWelcomeEmail\(currentUser\.email/.test(src));
  const saveUser = stripJS(readFileSync(join(ROOT, "netlify", "functions", "save-user.js"), "utf8"));
  t("save-user still guards on welcome_sent so the two paths send once",
     /alreadySent = userData\?\.welcome_sent/.test(saveUser) && /welcome_sent: true/.test(saveUser));
  // save-user sends mail from support@ to a caller-supplied address. Review
  // called it an open relay. Now: no bearer → skip_email forced; bearer → the
  // recipient is the TOKEN's email, never the body's.
  t("save-user forces skip_email when there is no bearer", /\} else \{\s*skip_email = true;/.test(saveUser),
     "otherwise one IP can send 'Welcome to SoulGainz' to unlimited addresses");
  t("save-user takes the recipient from the token, not the body",
     /authedUser = r\.user;\s*email = String\(authedUser\.email/.test(saveUser));
  t("welcome_only suppresses 'Welcome back'", /\} else if \(!welcome_only\) \{/.test(saveUser),
     "a second call from the sign-up path sent 'Welcome back' to someone who joined ninety seconds ago");
  t("the app passes the bearer and welcome_only", /Authorization = "Bearer " \+ accessToken/.test(welcome) && /welcome_only: true/.test(welcome));
  for (const f of ["pricing.html", "sign-up.html"]) {
    const m = readFileSync(join(ROOT, "marketing-site", f), "utf8");
    t(`marketing ${f} sends the welcome after sign-up, with the bearer`,
       /function sendWelcome\(session, name\)/.test(m) && /'Bearer ' \+ session\.access_token/.test(m) && /sendWelcome\(session, name\)/.test(m.replace(/function sendWelcome\(session, name\)/, "")),
       "buyers — the users you most want to welcome — got nothing");
    t(`marketing ${f} stores first_name/last_name, not only full_name`, /first_name: \(name\|\|''\)\.trim\(\)/.test(m),
       "the app's profile stub reads first_name/last_name; full_name alone left the ME tab blank");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section("Marketing pages — inline scripts must load alongside the vendored bundle");
// Shipped bug: pricing.html declared `let supabase = null` at global scope.
// That was fine against the CDN build, which assigns window.supabase. The
// commit that self-hosted the bundle (2026-08-23) vendored a UMD that declares
// `var supabase` — same global scope, same name — so every inline script on
// the page died with "Identifier 'supabase' has already been declared" before
// a single handler was attached. Both Subscribe buttons did nothing, for two
// weeks, and the smoke test (which checks price IDs) stayed green. Found the
// moment someone actually clicked.
//
// This runs the vendored bundle and each page's inline blocks in ONE shared
// context, the way a browser does, and fails on any SyntaxError. Runtime
// errors from the stubbed DOM are expected and ignored — a SyntaxError is not.
{
  const vm = await import("node:vm");
  const vendorPath = join(ROOT, "marketing-site", "vendor", "supabase.min.js");
  const vendor = readFileSync(vendorPath, "utf8");
  t("the vendored bundle declares a global `supabase`", /^var supabase\s*=/m.test(vendor),
     "if this changes, the collision class below changes with it — re-check every page");
  // Every tracked page that loads the bundle — derived, not listed. The first
  // version hard-coded six marketing pages and missed root success.html and
  // index.html, which load the byte-identical file and were open to the exact
  // same collision. The root vendor copy is used for root pages.
  const tracked = (execSync("git ls-files '*.html'", { cwd: ROOT, encoding: "utf8" })).split("\n")
    .filter(f => f && !/^(node_modules|_mobile|files|vendor)\//.test(f));
  const pages = tracked.filter(f => /vendor\/supabase\.min\.js/.test(readFileSync(join(ROOT, f), "utf8")));
  t("at least four pages load the vendored bundle (discovery works)", pages.length >= 4, pages.join(", "));
  for (const f of pages) {
    const html = readFileSync(join(ROOT, f), "utf8");
    const vendorFile = f.startsWith("marketing-site/") ? vendorPath : join(ROOT, "vendor", "supabase.min.js");
    const vendorSrc = readFileSync(vendorFile, "utf8");
    // Same type filter as stripHTML and the CI helper — a JSON-LD block must
    // not be executed as JS and reported as a false SyntaxError.
    const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
      .filter(m => !/\bsrc\s*=/.test(m[1]) && m[2].trim())
      .filter(m => { const ty = (m[1].match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1]; return !ty || /^(text\/javascript|application\/javascript|module)$/i.test(ty); });
    const noop = () => {};
    const ctx = vm.createContext({
      console: { log: noop, warn: noop, error: noop, info: noop },
      location: { search: "", hash: "", origin: "https://x", pathname: "/", href: "https://x/" },
      navigator: {}, fetch: () => new Promise(noop), setTimeout, clearTimeout,
      history: { replaceState: noop }, URLSearchParams, URL,
      localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
      document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
                  addEventListener: noop, write: noop, body: {}, readyState: "loading" },
      addEventListener: noop,
    });
    ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
    let syntax = null;
    try { vm.runInContext(vendorSrc, ctx, { filename: "vendor" }); } catch (e) { syntax = "vendor: " + e.message; }
    blocks.forEach((b, i) => {
      if (syntax) return;
      try { vm.runInContext(b[2], ctx, { filename: `${f}#${i}` }); }
      catch (e) { if (e && e.name === "SyntaxError") syntax = `block ${i}: ${e.message}`; }
    });
    t(`${f}: no inline script dies at parse time against the vendored bundle`, !syntax, syntax || "");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
section("Floating promises and stale memos");
{
  const bare = [...src.matchAll(/crypto\.subtle\.digest\(/g)].filter(m => {
    const tail = src.slice(m.index, m.index + 1200);
    if (!/\.then\(/.test(tail.slice(0, 600))) return false;   // awaited, not chained
    return !/\.catch\(/.test(tail.slice(0, 900));
  });
  t("every crypto.subtle.digest().then() chain has a .catch", bare.length === 0,
     "digest() REJECTS on an insecure origin; without a catch the app shows its destructive error screen");
}
{
  const i = src.indexOf("const historyMonths = React.useMemo");
  const deps = src.slice(src.indexOf("}, [", i), src.indexOf("]);", src.indexOf("}, [", i)));
  t("historyMonths depends on a stable day key, not a fresh Date",
     /\btodayKey\b/.test(deps) && !/\btoday\b(?!Key)/.test(deps),
     "`today` is new Date() in the body — a fresh object each render, so it defeats the memo entirely " +
     "while still not re-evaluating the clock");
}

// ─────────────────────────────────────────────────────────────────────────────
section("App-domain hygiene — nothing pre-launch or paid may be served there");
{
  const toml = readFileSync(join(ROOT, "netlify.toml"), "utf8");
  const ign = readFileSync(join(ROOT, ".netlifyignore"), "utf8");
  t("marketing-site/* is force-404'd on the app domain",
     /from = "\/marketing-site\/\*"[\s\S]{0,80}status = 404[\s\S]{0,40}force = true/.test(toml),
     "soulgainz.app/marketing-site/pricing.html served prices and checkout inside PWA scope");
  t("and excluded from the deploy", /^marketing-site\/$/m.test(ign));
  const landing = readFileSync(join(ROOT, "landing.html"), "utf8");
  t("no fabricated testimonials on the landing page", !/Real results, real people/.test(landing) && !/★★★★★/.test(landing));
  t("no plan price survives in the app bundle, even in a comment", !/€\d+\.\d\d/.test(raw.slice(0, raw.indexOf("const RECIPES ="))),
     "a dormant '€4.99 · one-time' comment shipped in the bundle; grep-based reviewers flag it every time");
  const swap = readFileSync(join(ROOT, "scripts", "launch-swap.mjs"), "utf8");
  t("launch-swap refuses to apply on a dirty tree", /git status --porcelain/.test(swap) && /process\.exit\(2\)/.test(swap),
     "the documented undo is `git checkout .`, which would take unrelated work with it");
  t("launch-swap dry run is a no-op on disk", (() => {
    const before = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" });
    try { execSync("node scripts/launch-swap.mjs", { cwd: ROOT, stdio: "pipe" }); } catch (_) { return false; }
    return execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" }) === before;
  })());
}

section("Other pages — install.html and the service worker");
{
  const inst = readFileSync(join(ROOT, "install.html"), "utf8");
  t("switchPlatform does not use the implicit global `event`",
     !/\bevent\.currentTarget\b/.test(inst) && !/[^.\w]event\.\w/.test(stripHTML(inst)),
     "window.event is non-standard and undefined in Firefox — the line threw and the clicked tab " +
     "never got its `active` class");
  t("it finds the button by its own argument", /data-platform="\$\{p\}"/.test(inst) ||
     /data-platform=\\?"\$\{p\}\\?"/.test(inst) || /\[data-platform=/.test(inst));
  t("both tab buttons carry data-platform",
     (inst.match(/class="tab-btn[^"]*"\s+data-platform=/g) || []).length === 2,
     "a button without it silently stops highlighting");
  t("null guards are present", /if \(panel\)/.test(inst) && /if \(btn\)/.test(inst));
}
{
  // A single-file PWA that ships index.html without bumping CACHE_NAME reaches
  // nobody: every installed client keeps serving the cached copy.
  const sw = readFileSync(join(ROOT, "sw.js"), "utf8");
  const now = (sw.match(/CACHE_NAME = '([^']+)'/) || [])[1];
  t("CACHE_NAME is present and versioned", /^meal-plan-v\d+$/.test(now || ""), String(now));
  // Two comparisons, because they answer different questions:
  //   working tree vs HEAD   — local, before you commit
  //   HEAD vs HEAD~1         — in CI, where the tree is always clean after
  //                            checkout and the first comparison is inert
  // The CI case is the one that matters: this assertion passed on every push
  // for a week and could never have failed there.
  const git = (cmd) => { try { return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }); } catch (_) { return null; } };
  const ver = (txt) => ((txt || "").match(/CACHE_NAME = '([^']+)'/) || [])[1] || null;
  const headSw = ver(git("git show HEAD:sw.js"));
  if (headSw === null) {
    t("git comparison skipped (no repo or no HEAD)", true);
  } else {
    const dirty = (git("git diff --name-only HEAD -- index.html") || "").trim();
    if (dirty) {
      t("index.html changed in the working tree, so CACHE_NAME was bumped", now !== headSw,
         `still ${now} — installed PWAs will keep serving the cached index.html`);
    }
    const prevSw = ver(git("git show HEAD~1:sw.js"));
    const committed = (git("git diff --name-only HEAD~1 HEAD -- index.html") || "").trim();
    if (prevSw !== null && committed) {
      t("index.html changed in the last commit, so CACHE_NAME was bumped with it", headSw !== prevSw,
         `HEAD~1 and HEAD both ship ${headSw} — this commit reaches no installed client`);
    }
    if (!dirty && !committed) t("index.html unchanged (tree and last commit); no bump required", true);
  }
}

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
