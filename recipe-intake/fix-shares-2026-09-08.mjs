#!/usr/bin/env node
// fix-shares-2026-09-08.mjs — recompute the per-role `share` fields so each role
// sums to 1.0.
//
// 27 recipes tripped the boot-time validator ("shares sum to 0.667 / 2.000").
// The app already auto-derives shares when they don't sum, so this changes no
// behaviour — it only makes the stored data say what the app computes, and
// silences the warnings so a REAL drift is visible next time.
//
// Shares are set from each item's actual contribution to that macro.
import { readFileSync, writeFileSync } from "node:fs";
const DRY = process.argv.includes("--dry");
const PATH = "index.html";
let src = readFileSync(PATH, "utf8");
const slice = (s, o, c) => { const i = src.indexOf(s); const a = src.indexOf(o, i); const b = src.indexOf(c, a); return src.slice(a, b + c.length); };
const IM = eval("(" + slice("const INGREDIENT_MACROS = {", "{", "\n};").replace(/\n};$/, "\n}") + ")");
const RECIPES = eval(slice("const RECIPES =", "[", "\n];").replace(/\n];$/, "\n]"));
const PENDING = eval(slice("const PENDING_RECIPES", "[", "\n];").replace(/\n];$/, "\n]"));
const KEY = { protein: "p", carbs: "c", fat: "f" };
const gramsOf = it => { const md = IM[it.key] || {}; const u = String(it.unit || "g").toLowerCase(); return (u === "g" || u === "ml") ? it.qty : it.qty * (md.unitG || 0); };

function blockOf(id) {
  const re = new RegExp(`\\bid:\\s*"${id}"`, "g");
  const a = src.indexOf("const RECIPES ="), z = src.indexOf("\n];", src.indexOf("const PENDING_RECIPES"));
  let m, hits = []; while ((m = re.exec(src))) if (m.index > a && m.index < z) hits.push(m.index);
  if (hits.length !== 1) throw new Error(`id ${id}: ${hits.length} hits`);
  return [src.lastIndexOf("\n    {", hits[0]) + 1, src.indexOf("\n    }", hits[0]) + 6];
}

let fixed = 0; const log = [];
for (const r of [...RECIPES, ...PENDING]) {
  if (!r.batchItems) continue;
  const edits = [];
  for (const role of ["protein", "carbs", "fat"]) {
    const items = r.batchItems.filter(i => (i.role || "fixed") === role);
    if (!items.length || !items.some(i => i.share != null)) continue;
    const sum = items.reduce((s, i) => s + (i.share || 0), 0);
    if (Math.abs(sum - 1) <= 0.05) continue;
    const tot = items.reduce((s, i) => s + (IM[i.key]?.[KEY[role]] || 0) / 100 * gramsOf(i), 0);
    if (!tot) { log.push(`${r.id} ${role}: SKIPPED (no macro data)`); continue; }
    const shares = items.map(i => (IM[i.key][KEY[role]] / 100 * gramsOf(i)) / tot);
    // last one absorbs the rounding so the stored numbers really do sum to 1
    const rounded = shares.map(v => +v.toFixed(6));
    rounded[rounded.length - 1] = +(1 - rounded.slice(0, -1).reduce((a, b) => a + b, 0)).toFixed(6);
    items.forEach((it, n) => edits.push({ key: it.key, share: rounded[n] }));
    log.push(`${r.id} ${role}: ${sum.toFixed(3)} → 1.000 (${items.map((it, n) => it.key + " " + (it.share ?? "—") + "→" + rounded[n]).join(", ")})`);
  }
  if (!edits.length) continue;
  const [a, z] = blockOf(r.id); let blk = src.slice(a, z);
  for (const e of edits) {
    const lineRe = new RegExp(`^.*\\bkey:\\s*"${e.key}".*$`, "m");
    const line = blk.match(lineRe); if (!line) throw new Error(`${r.id}: ${e.key} not found`);
    let l = line[0];
    l = /\bshare:\s*[\d.]+/.test(l) ? l.replace(/\bshare:\s*[\d.]+/, `share: ${e.share}`)
                                    : l.replace(/\brole:\s*"[^"]*"/, m => `${m}, share: ${e.share}`);
    blk = blk.replace(lineRe, () => l);
  }
  src = src.slice(0, a) + blk + src.slice(z); fixed++;
}
if (!DRY) writeFileSync(PATH, src);
console.log(`${fixed} recipes re-shared${DRY ? " (dry)" : ""}`);
log.forEach(l => console.log("  " + l));
