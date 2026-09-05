#!/usr/bin/env node
// launch-swap.mjs — flip the product from "waitlist" to "live", in one run.
//
//   node scripts/launch-swap.mjs            dry run: prints every change, writes NOTHING
//   node scripts/launch-swap.mjs --apply    writes the changes
//
// Replaces scripts/launch-swap.sh, which used macOS-only `sed -i ''`, matched
// utm links for tiers that no longer exist (quarterly, lifetime) and so would
// have silently no-op'd, and only touched landing.html — leaving the marketing
// site's "Not yet — we're in final development" FAQ up beside the Subscribe
// buttons, and the app's own "Join the Waitlist" button in the ME tab.
//
// THIS MAKES THE PRODUCT PUBLIC. Everything below is the front door. Run the
// dry run, read it, then --apply. It does not commit or push.
//
// What it changes:
//   netlify.toml         /            no longer 301s to the waitlist landing page;
//                                     Netlify serves index.html (the app) at the root
//                        /landing.html and /waitlist → 301 to the marketing site,
//                                     so a stale Instagram bio still lands somewhere sane
//   marketing-site/*     "Not yet…" FAQ answers → "Yes — live now"
//                        every soulgainz.app/waitlist link → soulgainz.app
//                        "Join (the) waitlist" button copy → "Open the app" / "Get started free"
//   index.html           ME tab "Join the Waitlist" → "Create a free account" (opens sign-up)
//   sw.js                CACHE_NAME bump so installed PWAs pick up the new index.html
//
// What it does NOT change, deliberately:
//   landing.html         left intact but unreachable (redirected). Delete it later.
//   Stripe price IDs     that is the separate LAUNCH-MINUS-48H swap (task #50)
//   Apple compliance     re-verified at the end: the app domain must still show no price

import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const MARKETING = "https://marketing.soulgainz.app";
const APP = "https://soulgainz.app";

let totalChanges = 0;
const edits = [];   // { file, before, after, notes, n }
const plans = new Map();   // file → [{ transform, note }]

// Transforms for the same file are CHAINED, in registration order, over one
// read. The first version of this script read the file from disk inside every
// plan(), so a second plan for the same file silently threw away the first
// one's edit — the pricing FAQ was "fixed" and then un-fixed three lines later.
function plan(file, transform, note) {
  if (!plans.has(file)) plans.set(file, []);
  plans.get(file).push({ transform, note });
}
function resolvePlans() {
  for (const [file, steps] of plans) {
    const path = join(ROOT, file);
    if (!existsSync(path)) { console.log(`  skip   ${file} (missing)`); continue; }
    const before = readFileSync(path, "utf8");
    let after = before;
    const notes = [];
    for (const { transform, note } of steps) {
      const next = transform(after);
      if (next !== after) notes.push(note);
      after = next;
    }
    if (after === before) { console.log(`  ok     ${file} — nothing to change`); continue; }
    const n = countDiffLines(before, after);
    totalChanges += n;
    edits.push({ file, before, after, notes, n });
    console.log(`  CHANGE ${file} — ${n} line(s): ${notes.join("; ")}`);
  }
}
// Real diff via git, so an inserted block reports as the lines it adds — not
// as every line below it having "changed".
function gitDiff(before, after, label) {
  const dir = mkdtempSync(join(tmpdir(), "swap-"));
  const a = join(dir, "a"), b = join(dir, "b");
  writeFileSync(a, before); writeFileSync(b, after);
  let out = "";
  try { execSync(`git diff --no-index --no-color -U1 -- "${a}" "${b}"`, { encoding: "utf8" }); }
  catch (e) { out = e.stdout || ""; }   // git diff exits 1 when files differ
  rmSync(dir, { recursive: true, force: true });
  const body = out.split("\n").filter(l => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l));
  return { text: out.split("\n").slice(4).join("\n").replace(/^/gm, "   "), n: body.length, label };
}
function countDiffLines(a, b) { return gitDiff(a, b).n; }
const mustReplace = (s, from, to, label) => {
  if (!s.includes(from)) throw new Error(`anchor not found (${label}): ${JSON.stringify(from).slice(0, 80)}`);
  return s.split(from).join(to);
};

console.log(`\n  SoulGainz launch swap — ${APPLY ? "APPLYING" : "DRY RUN (nothing written)"}\n`);

// ── 1. netlify.toml — the front door ─────────────────────────────────────────
plan("netlify.toml", s => {
  s = mustReplace(s,
`# Root → landing page (SEO: bare domain shows marketing page, not app shell)
[[redirects]]
  from = "/"
  to = "/landing.html"
  status = 301
`,
`# LAUNCHED. The bare domain serves the app (index.html). The pre-launch
# landing page and the waitlist now 301 to the marketing site, so any stale
# link — an old Instagram bio, a shared post — still lands somewhere current.
[[redirects]]
  from = "/landing.html"
  to = "${MARKETING}"
  status = 301
  force = true
`, "root redirect");
  s = mustReplace(s,
`[[redirects]]
  from = "/waitlist"
  to = "/waitlist.html"
  status = 200
`,
`[[redirects]]
  from = "/waitlist"
  to = "${MARKETING}"
  status = 301
  force = true

[[redirects]]
  from = "/waitlist.html"
  to = "${MARKETING}"
  status = 301
  force = true
`, "waitlist route");
  return s;
}, "/ serves the app; /landing.html and /waitlist → marketing site");

// ── 2. Marketing site — stop saying it does not exist ────────────────────────
plan("marketing-site/pricing.html", s => {
  s = mustReplace(s,
    `<div class="faq-a">Not yet — we're in final development and launching soon. Join the waitlist to be first in the door. Waitlist members get early access before the public launch.</div>`,
    `<div class="faq-a">Yes — SoulGainz is live. The Free plan is at <a href="${APP}">soulgainz.app</a>; Monthly and Annual are above.</div>`,
    "pricing FAQ");
  return s;
}, "FAQ: 'Not yet' → live");

plan("marketing-site/contact.html", s => mustReplace(s,
  `<div class="faq-a">Not yet — we're in final development. <a href="https://soulgainz.app/waitlist">Join the waitlist</a> and you'll be first in, ahead of the public launch.</div>`,
  `<div class="faq-a">Yes — SoulGainz is live. <a href="${APP}">Open the app</a> to start on the Free plan, or see <a href="/pricing">plans</a>.</div>`,
  "contact FAQ"), "FAQ: 'Not yet' → live");

// Prose that says "not yet" / "join the waitlist", page by page. Exact
// anchors, so a copy edit that changes one of these fails loudly here rather
// than shipping a launch with a "coming soon" still on the page.
plan("marketing-site/about.html", s => {
  s = mustReplace(s, `<h2 class="serif">Coming soon</h2>`, `<h2 class="serif">Now live</h2>`, "about heading");
  s = mustReplace(s,
    `SoulGainz is not yet live. We're in the final stages of development and will be launching soon. If you join the waitlist, you'll hear first when we open — and waitlist members get early access before anyone else.`,
    `SoulGainz is live. The Free plan is open to everyone at <a href="${APP}" style="color:var(--orange);text-decoration:underline;">soulgainz.app</a>, and Monthly and Annual plans are on the <a href="/pricing" style="color:var(--orange);text-decoration:underline;">pricing page</a>.`,
    "about body");
  s = mustReplace(s, `<h2 class="serif">Be first when we launch</h2>`, `<h2 class="serif">Ready when you are</h2>`, "about CTA heading");
  s = mustReplace(s, `<p>Join the waitlist for early access and launch pricing.</p>`, `<p>Start free. Upgrade when the library earns it.</p>`, "about CTA body");
  return s;
}, "'Coming soon' prose → live");
plan("marketing-site/pricing.html", s => {
  s = mustReplace(s, `<h2 class="serif">Still deciding? Join the waitlist first.</h2>`, `<h2 class="serif">Still deciding? Start free.</h2>`, "pricing CTA heading");
  s = mustReplace(s, `<p>Free to join. First in, first access.</p>`, `<p>14 recipes and the full planner, no card needed.</p>`, "pricing CTA body");
  return s;
}, "bottom CTA prose");
plan("marketing-site/index.html", s => {
  s = mustReplace(s, `<div class="hero-badge">Coming soon</div>`, `<div class="hero-badge">Now live</div>`, "hero badge");
  s = mustReplace(s, `<p>Join the waitlist and be first when SoulGainz launches.</p>`, `<p>Start free today. No card, no catch.</p>`, "index CTA body");
  s = mustReplace(s,
    `content="The high-protein meal prep app. 160+ verified recipes, macro calculator, auto grocery list. Join the waitlist." />`,
    `content="The high-protein meal prep app. 160+ verified recipes, macro calculator, auto grocery list. Start free." />`,
    "meta description");
  return s;
}, "hero CTA + meta description");

// terms.html and privacy.html on the marketing site are GENERATED by
// scripts/build-legal-pages.mjs from the canonical root files, and
// check-legal-consistency fails if they drift. Their nav CTA lives in the
// generator's template, so that is what gets edited — and the pages are
// regenerated after the write below.
plan("scripts/build-legal-pages.mjs", s => mustReplace(s,
  `<a href="https://soulgainz.app/waitlist" class="nav-cta">Join waitlist →</a>`,
  `<a href="${APP}" class="nav-cta">Get started free →</a>`,
  "legal-page nav template"), "nav CTA in the legal-page generator");

for (const f of ["index.html", "about.html", "pricing.html", "contact.html"]) {
  plan(`marketing-site/${f}`, s => {
    // Links first, then button copy. Order matters: the copy patterns are
    // generic and must not run before the hrefs are known.
    s = s.split(`${APP}/waitlist`).join(APP);
    s = s.replace(/>Join the waitlist →</g, ">Open the app →<");
    s = s.replace(/>Join waitlist →</g, ">Get started free →<");
    s = s.replace(/>Join waitlist</g, ">Get started free<");
    s = s.replace(/>Join the waitlist</g, ">Open the app<");
    return s;
  }, "waitlist links + CTA copy");
}

// ── 3. The app itself — the ME tab CTA ───────────────────────────────────────
plan("index.html", s => mustReplace(s,
`                    !currentUser && React.createElement("a", {
                        href: "/waitlist",
                        style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            width: "100%", background: "#E07B2A", border: "none", borderRadius: 12,
                            padding: "13px", marginBottom: 12, fontSize: 13, fontWeight: 900, color: "#0C0B0A",
                            cursor: "pointer", textDecoration: "none", letterSpacing: "0.5px", boxSizing: "border-box" } },
                        "🔥 Join the Waitlist — Get notified at launch"),`,
`                    !currentUser && React.createElement("button", {
                        onClick: () => setOnboardStep("signup"),
                        style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            width: "100%", background: "#E07B2A", border: "none", borderRadius: 12,
                            padding: "13px", marginBottom: 12, fontSize: 13, fontWeight: 900, color: "#0C0B0A",
                            cursor: "pointer", letterSpacing: "0.5px", boxSizing: "border-box" } },
                        "🔥 Create a free account"),`,
  "ME tab CTA"), "ME tab: 'Join the Waitlist' → 'Create a free account'");

// ── 4. Service worker bump ───────────────────────────────────────────────────
plan("sw.js", s => {
  const m = s.match(/CACHE_NAME = 'meal-plan-v(\d+)'/);
  if (!m) throw new Error("CACHE_NAME not found");
  const next = parseInt(m[1], 10) + 1;
  s = s.replace(/CACHE_NAME = 'meal-plan-v\d+'/, `CACHE_NAME = 'meal-plan-v${next}'`);
  s = s.replace(/^\/\/ SoulGainz — Service Worker v\d+/m, `// SoulGainz — Service Worker v${next}`);
  return s;
}, "CACHE_NAME +1");

// ── Resolve, report, apply ───────────────────────────────────────────────────
resolvePlans();
console.log(`\n  ${edits.length} file(s), ${totalChanges} changed line(s)\n`);

if (!APPLY) {
  for (const e of edits) {
    console.log(`  ── ${e.file} ──`);
    console.log(gitDiff(e.before, e.after).text);
  }
  console.log("\n  Dry run only. Re-run with --apply to write these changes.\n");
  process.exit(0);
}

// Refuse to write over unrelated uncommitted work. The documented undo is
// `git checkout .`, which would take that work with it.
const dirty = (() => { try { return execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" }).trim(); } catch (_) { return ""; } })();
if (dirty) {
  console.log("  ✗ working tree is not clean — commit or stash first:\n" + dirty.replace(/^/gm, "     ") + "\n");
  process.exit(2);
}
for (const e of edits) writeFileSync(join(ROOT, e.file), e.after);
console.log("  written.");
// Regenerate the two legal pages from the edited template. A failure here is
// reported like any other leftover rather than escaping as a stack trace with
// eight files already modified and no summary.
const leftovers = [];
try { execSync("node scripts/build-legal-pages.mjs", { cwd: ROOT, stdio: "pipe" }); console.log("  legal pages regenerated.\n"); }
catch (e) { leftovers.push("LEGAL PAGE REGEN FAILED:\n" + (e.stdout || e.stderr || e.message)); }

// ── Verify: nothing pre-launch is left, and the app domain is still compliant ─
console.log("  verifying …");
const check = (file, re, label) => {
  const s = readFileSync(join(ROOT, file), "utf8");
  const m = s.match(re);
  if (m) leftovers.push(`${file}: ${label} (${m[0].slice(0, 60)})`);
};
check("netlify.toml", /to = "\/landing\.html"/, "still routing to the waitlist landing page");
for (const f of ["index.html", "about.html", "pricing.html", "contact.html"]) {
  check(`marketing-site/${f}`, /soulgainz\.app\/waitlist/, "waitlist link");
  check(`marketing-site/${f}`, /Not yet — we're in final development/, "'not yet' copy");
  check(`marketing-site/${f}`, /Join (the )?waitlist/i, "waitlist CTA copy");
  check(`marketing-site/${f}`, /not yet live|coming soon|launching soon|when (we|SoulGainz) launch/i, "pre-launch prose");
}
check("index.html", /Join the Waitlist/, "in-app waitlist CTA");
for (const f of ["privacy.html", "terms.html"]) check(`marketing-site/${f}`, /soulgainz\.app\/waitlist/, "waitlist link (generated page)");
try { execSync("node scripts/check-legal-consistency.mjs", { cwd: ROOT, stdio: "pipe" }); }
catch (e) { leftovers.push("LEGAL CONSISTENCY FAILED:\n" + (e.stdout || e.message)); }

let compliance = "";
try { compliance = execSync("node scripts/check-apple-compliance.mjs", { cwd: ROOT, encoding: "utf8" }); }
catch (e) { leftovers.push("APPLE COMPLIANCE FAILED:\n" + (e.stdout || e.message)); }

if (leftovers.length) {
  console.log("\n  ⚠ leftovers:\n   - " + leftovers.join("\n   - "));
  console.log("\n  Changes ARE written. Fix the leftovers by hand before committing.\n");
  process.exit(1);
}
console.log("  clean. Apple compliance:", compliance.trim().split("\n").pop());
console.log(`
  Next:
    node scripts/test-regressions.mjs
    git add -A && git commit -m "🚀 Launch: waitlist → live"
    git push origin main
  Then update the Instagram bio to ${APP}.
`);
