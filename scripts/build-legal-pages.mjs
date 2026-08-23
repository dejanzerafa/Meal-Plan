#!/usr/bin/env node
/**
 * SoulGainz — generate the marketing-site copies of Terms & Privacy.
 *
 * Terms and Privacy are published on BOTH domains:
 *   canonical : soulgainz.app/terms      (terms.html)
 *               soulgainz.app/privacy    (privacy.html)
 *   copy      : marketing.soulgainz.app/terms, /privacy
 *
 * Two copies of a legal document is normally how contradictions creep in —
 * exactly how the 7-day vs 30-day refund conflict happened. So the marketing
 * copies are GENERATED from the canonical files rather than hand-edited:
 * the legal body is extracted verbatim and re-wrapped in marketing-site chrome.
 *
 *   Edit the legal text ONLY in the canonical root files, then run:
 *       node scripts/build-legal-pages.mjs
 *
 * check-legal-consistency.mjs re-runs this into memory and fails the build if
 * the committed copies are stale, so drift is impossible to ship.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'marketing-site');

const PAGES = [
  {
    src: 'terms.html',
    out: 'terms.html',
    slug: '/terms',
    title: 'Terms of Service — SoulGainz',
    heading: 'Terms of Service',
    desc: 'SoulGainz Terms of Service — subscriptions, refunds, cancellation and your rights.',
    // Canonical terms.html wraps its content in <main>…</main>
    extract: html => html.match(/<main>([\s\S]*?)<\/main>/)?.[1],
  },
  {
    src: 'privacy.html',
    out: 'privacy.html',
    slug: '/privacy',
    title: 'Privacy Policy — SoulGainz',
    heading: 'Privacy Policy',
    desc: 'SoulGainz Privacy Policy — what we collect, why, and your rights under Qatar PDPPL and the GDPR.',
    // Canonical privacy.html uses <div class="container">…</div>
    extract: html => html.match(/<div class="container">([\s\S]*?)<\/div>\s*<footer>/)?.[1],
  },
];

// Strip things that only make sense on the app domain: the "Back to App"
// link and the canonical page's own <h1>/meta line (we re-render those).
function cleanBody(inner) {
  return inner
    .replace(/<a[^>]*class="back-(?:btn|link)"[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<h1[^>]*class="page-title"[^>]*>[\s\S]*?<\/h1>/i, '')
    .replace(/<p[^>]*class="meta"[^>]*>([\s\S]*?)<\/p>/i, '<p class="legal-meta">$1</p>')
    .trim();
}

function template({ title, desc, slug, heading, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="https://marketing.soulgainz.app${slug}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900&family=Instrument+Sans:ital,wght@0,400..700&display=swap" rel="stylesheet">
  <!-- ⚠️ GENERATED FILE — DO NOT EDIT.
       Produced by scripts/build-legal-pages.mjs from the canonical
       /${'' /* keep literal */}${PAGES.find(p => p.slug === slug).src} at the repo root.
       Edit that file, then re-run the script. Editing this copy directly will
       be overwritten and will fail check-legal-consistency.mjs. -->
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --black:#0C0B0A; --orange:#E07B2A; --cream:#F2EDE6;
      --grey:#8A8580; --dkgrey:#1C1A18;
    }
    body {
      background: var(--black); color: #C8BFB5;
      font-family: "Instrument Sans", -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 15px; line-height: 1.75; -webkit-font-smoothing: antialiased;
    }
    a { color: var(--orange); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .serif { font-family: "Fraunces", Georgia, serif; }

    nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(12,11,10,0.94); backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(242,237,230,0.08); padding: 0 24px;
    }
    .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .nav-logo { font-family: "Fraunces", Georgia, serif; font-size: 20px; font-weight: 800; color: var(--cream); }
    .nav-logo span { color: var(--orange); }
    .nav-links { display: flex; align-items: center; gap: 26px; list-style: none; }
    .nav-links a { font-size: 14px; font-weight: 500; color: var(--grey); }
    .nav-links a:hover { color: var(--cream); text-decoration: none; }
    .nav-links a.active { color: var(--cream); }
    .nav-cta { background: var(--orange); color: var(--black); border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 700; }
    .nav-cta:hover { opacity: .88; text-decoration: none; }
    @media (max-width: 760px) { .nav-links { display: none; } }

    main { max-width: 760px; margin: 0 auto; padding: 56px 24px 88px; }
    .page-title { font-family: "Fraunces", Georgia, serif; font-size: clamp(28px,5vw,40px); font-weight: 800; letter-spacing: -0.02em; color: var(--cream); margin-bottom: 8px; }
    .legal-meta { font-size: 13px; color: var(--grey); margin-bottom: 36px; }
    h2 { font-size: 15px; font-weight: 700; color: var(--orange); margin: 34px 0 10px; text-transform: uppercase; letter-spacing: .05em; }
    h3 { font-size: 15px; font-weight: 700; color: var(--cream); margin: 22px 0 8px; }
    p { margin-bottom: 14px; }
    ul, ol { padding-left: 20px; margin-bottom: 14px; }
    li { margin-bottom: 8px; }
    strong { color: var(--cream); }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 14px; }
    th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid rgba(242,237,230,0.08); vertical-align: top; }
    th { color: var(--cream); font-weight: 700; }
    .highlight { background: rgba(224,123,42,0.10); border-left: 3px solid var(--orange); padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 20px; color: var(--cream); font-size: 14px; }
    .section-divider, hr { border: none; border-top: 1px solid rgba(242,237,230,0.08); margin: 32px 0; }

    footer { border-top: 1px solid rgba(242,237,230,0.08); padding: 32px 24px 40px; text-align: center; }
    .footer-links { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-bottom: 14px; }
    .footer-links a { font-size: 13px; color: var(--grey); }
    .footer-links a:hover { color: var(--cream); text-decoration: none; }
    .footer-copy { font-size: 12px; color: #5f5a55; }
  </style>
</head>
<body>

<nav>
  <div class="nav-inner">
    <a href="/" class="nav-logo">Soul<span>Gainz</span></a>
    <ul class="nav-links">
      <li><a href="/">Home</a></li>
      <li><a href="/about">Our Story</a></li>
      <li><a href="/pricing">Pricing</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
    <a href="https://soulgainz.app/waitlist" class="nav-cta">Join waitlist →</a>
  </div>
</nav>

<main>
  <h1 class="page-title serif">${heading}</h1>
${body}
</main>

<footer>
  <div class="footer-links">
    <a href="/">Home</a>
    <a href="/about">Our Story</a>
    <a href="/pricing">Pricing</a>
    <a href="/contact">Contact</a>
    <a href="/terms">Terms</a>
    <a href="/privacy">Privacy</a>
  </div>
  <div class="footer-copy">© 2026 SoulGainz · <a href="mailto:support@soulgainz.app">support@soulgainz.app</a></div>
</footer>

</body>
</html>
`;
}

export function generate() {
  const results = [];
  for (const page of PAGES) {
    const srcPath = path.join(ROOT, page.src);
    if (!fs.existsSync(srcPath)) throw new Error(`Canonical source missing: ${page.src}`);
    const html = fs.readFileSync(srcPath, 'utf8');
    const inner = page.extract(html);
    if (!inner) throw new Error(`Could not extract legal body from ${page.src} — has its markup changed?`);
    results.push({ out: page.out, html: template({ ...page, body: cleanBody(inner) }) });
  }
  return results;
}

// Run directly → write the files.
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const { out, html } of generate()) {
    fs.writeFileSync(path.join(OUT_DIR, out), html);
    console.log(`  generated marketing-site/${out}  (${html.length.toLocaleString()} bytes)`);
  }
  console.log('\n  Legal pages regenerated from canonical sources.\n');
}
