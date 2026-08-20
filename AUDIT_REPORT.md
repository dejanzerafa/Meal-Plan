# SoulGainz PWA — Pre-Launch Audit Report

**Date:** 2026-08-20
**Auditor:** Claude (Sonnet 4.6)
**Scope:** index.html (13,677 lines), sw.js (162 lines), netlify/functions/ (25 files, 5,156 lines), manifest.json, netlify.toml, supporting HTML pages

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2     |
| Major    | 7     |
| Minor    | 12    |
| **Total**| **21**|

---

## 1. JavaScript / React Errors

### MINOR — `.map()` using array index as key (not unique entity key)

**File:** index.html
**Lines:** 8460, 8489, 9068, 9112, and others

Several `.map()` calls use the loop index `i` as the React `key` prop instead of a stable identifier:

```js
teaserRecipes.map((r, i) => React.createElement("div", { key: i, ...}))  // line 8460
included.map((item, i) => React.createElement("div", { key: i, ...}))    // line 8489
["M","T","W","T","F","S","S"].map((d, i) => ..., { key: i, ...})          // line 9068
historyMonths.map((m, i) => ..., { key: i, ...})                          // line 9112
```

Index-based keys cause React to re-use DOM nodes incorrectly if list order changes (e.g., after sort or filter), causing stale content to render. This is not a crash but a correctness risk.

**Fix:** Use a stable unique value as key (`r.id`, `m.label`, etc.). For truly static lists (days of the week) the index key is acceptable.

---

### MINOR — `root.innerHTML = ''` before React mount

**File:** index.html
**Line:** 13633

```js
root.innerHTML = ''; root.appendChild(wrap);
```

This manually clears the root node before attaching React. This is fine for app initialisation but bypasses React's reconciler; if any future code puts user-controlled content into `wrap` before this line runs, it would be an XSS vector. Currently `wrap` is app-generated so there is no active vulnerability, but the pattern is fragile.

**Fix:** Use `ReactDOM.createRoot(root).render(...)` directly without pre-clearing via `innerHTML`.

---

### MINOR — AppErrorBoundary renders error message to screen

**File:** index.html
**Lines:** 7542–7557

The error boundary displays `e.message` directly in the UI. If an error message contains user-supplied data (e.g., from a malformed API response stored in state), it would appear as plain text (not HTML), so XSS is not possible here. However, leaking exception messages to end users is poor practice and can expose internal implementation details.

**Fix:** Replace `e.message` with a generic message. Log the full error to Sentry (already wired up) instead.

---

## 2. UI/UX Bugs

### MINOR — `manifest.json` start_url is "/" which redirects to landing page

**File:** manifest.json, netlify.toml

`manifest.json` sets `"start_url": "/"`. However, netlify.toml has:

```toml
[[redirects]]
  from = "/"
  to = "/landing.html"
  status = 301
```

When an installed PWA user taps the home screen icon, they are launched to the marketing landing page (`landing.html`) instead of the app shell (`index.html`). This means every install opens a marketing page that then requires a tap to enter the app.

**Fix:** Change `start_url` to `"/index.html"` in manifest.json so installed PWA launches directly into the app.

---

### MINOR — Shopping list tab not included in SW precache

**File:** sw.js, netlify.toml

`/waitlist` (without extension) is in the PRECACHE list but the actual Netlify redirect rules for `/waitlist` use status 200 (a rewrite), not 301. On most local dev setups the file `waitlist.html` exists so this resolves fine, but the service worker may cache an empty redirect response in some edge cases. No `/shopping` or other tab URLs are precached.

---

## 3. Netlify Functions

### MAJOR — `renewal-reminder.js`: `createClient` called before env var guard

**File:** netlify/functions/renewal-reminder.js
**Lines:** 17–25

```js
exports.handler = async (event) => {
  const supabase = createClient(          // ← called here
    process.env.SUPABASE_URL,             // could be undefined
    process.env.SUPABASE_SERVICE_KEY      // could be undefined
  );
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY not set — skipping");
    return { statusCode: 200, body: ... };
  }
  // SUPABASE vars are NEVER checked before use
```

If `SUPABASE_URL` or `SUPABASE_SERVICE_KEY` are missing (e.g., first deploy, env misconfiguration), `createClient` throws an unhandled exception before the guard code runs. The function will return a 500 with a raw stack trace rather than a graceful skip message.

**Fix:** Move the env var checks for `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to the top of the handler, before the `createClient` call. Pattern used correctly in `birthday-emails.js` (lines 20–23) — replicate that pattern here.

---

### MAJOR — `admin-verify.js`: No rate limiting on brute force

**File:** netlify/functions/admin-verify.js
**Lines:** 33–35

```js
await new Promise(r => setTimeout(r, 400));
return { statusCode: 401, body: JSON.stringify({ error: "Incorrect password" }) };
```

The function introduces a 400 ms sequential delay, but does not block concurrent requests. An attacker can issue 100 parallel POST requests per second and bypass the delay entirely, making a brute-force attack against `ADMIN_SECRET` feasible.

**Fix:** Add IP-based rate limiting using Netlify Blobs (the same pattern used in `track-event.js`, which already implements this). Alternatively, use Netlify's built-in bot protection or WAF rules to rate-limit `/.netlify/functions/admin-verify`.

---

### MAJOR — `push-subscribe.js`: No user authentication

**File:** netlify/functions/push-subscribe.js
**Lines:** 63–76

The endpoint accepts `{ email, subscription, action }` and updates the push subscription for the given email without verifying that the caller owns that email address. Anyone who knows another user's email can send `action: "unsubscribe"` and silently disable their push notifications.

**Fix:** Require a session token (Supabase JWT or a signed token from the app) to prove ownership of the email before allowing a subscription to be modified. At minimum, verify the request email against the authenticated session.

---

### MAJOR — 11 functions lack inline CORS headers

**Files:** `birthday-emails.js`, `holiday-emails.js`, `push-send.js`, `renewal-reminder.js`, `resend-welcome-all.js`, `send-calc-followup.js`, `send-launch-email.js`, `send-new-drop.js`, `send-promo-confirm.js`, `send-welcome.js`, `stripe-webhook.js`

These functions return no `Access-Control-Allow-Origin` headers of their own. They rely entirely on the global `[[headers]]` block in `netlify.toml`, which emits a static `Access-Control-Allow-Origin: https://soulgainz.app` on all function responses.

The practical risk is low because the netlify.toml headers are applied after the function returns. However:

- Functions that are called directly (e.g., scheduled functions invoked manually for testing) will appear to fail CORS in a browser because the headers are applied at the CDN layer, and local dev (`netlify dev`) does not always replicate this faithfully.
- `send-calc-followup.js` is called directly from `calculator.html` via a browser `fetch()` call and has no `OPTIONS` pre-flight handler, meaning the browser CORS pre-flight will receive a 405 from the function itself.

**Fix for `send-calc-followup.js`:** Add an explicit `OPTIONS` handler returning the correct CORS headers, matching the pattern in `save-user.js`. For the scheduled functions (birthday-emails etc.), this is lower priority since they are not called from the browser.

---

### MINOR — `stripe-webhook.js`: Supabase client created before optional check

**File:** netlify/functions/stripe-webhook.js
**Lines:** 34–37

```js
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
```

These env vars are checked for `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (lines 27–30) but not for the Supabase vars. If Supabase is unconfigured, the webhook handler will silently use an invalid client and all DB writes will fail without returning an appropriate error.

**Fix:** Add a guard: `if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) { return { statusCode: 500, body: "Supabase not configured" }; }` after the Stripe key check.

---

## 4. Service Worker (sw.js)

### MINOR — External-origin fetch requests silently dropped (offline fonts)

**File:** sw.js
**Line:** 65

```js
const isApp = url.hostname === self.location.hostname;
if (!isApp) return;  // exits without calling event.respondWith()
```

When the browser requests the Google Fonts stylesheet (which is included in PRECACHE and cached during install), the service worker exits early with a bare `return` — it does NOT call `event.respondWith()`. This is technically correct behaviour (the browser falls through to the network), but in offline mode the browser will not look in the SW cache for the cached Fonts URL. The fonts will be unavailable offline despite being in PRECACHE.

**Fix:** Either remove the external Google Fonts URL from PRECACHE (since it is not served from cache anyway), or change the early-exit to include a cache lookup for external URLs:

```js
if (!isApp) {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
  return;
}
```

---

### MINOR — CACHE_NAME comment version mismatch

**File:** sw.js
**Lines:** 1–4

```js
// SoulGainz — Service Worker v169
const CACHE_NAME = 'meal-plan-v170';
```

The file header comment says v169 but the cache name is v170. The cache name is what actually matters, so there is no functional bug, but it causes confusion when debugging.

**Fix:** Update the comment to v170.

---

### MINOR — `skipWaiting()` called twice

**File:** sw.js
**Lines:** 38, 133

`self.skipWaiting()` is called both in the `install` event handler (line 38) and again in the `message` event handler when `event.data.type === 'SKIP_WAITING'` (line 133). The double call is harmless but redundant. The install-time `skipWaiting()` already causes the new SW to activate immediately, so the message-based trigger will never run on a newly loaded SW — it only applies to waiting SWs that have already been installed.

**Fix:** Remove the `skipWaiting()` call from the install event (line 38) and rely only on the message-based trigger, which gives the app control over when to update. Or keep it and remove the message handler. Mixing both is confusing.

---

## 5. Recipe Data

**Total recipes:** 173 (confirmed by ID count)
**Recipes with `perPortion` data:** 153 (20 are smoothies/snacks with no portion macro data — this may be intentional)
**Duplicate recipe names:** None found
**Recipes missing `steps` or `batchItems`:** None found

---

### MINOR — Calorie/macro mismatch: "Protein Brownie Cookies"

**File:** index.html
**Line:** 3482

```js
perPortion: { kcal: 136, protein: 13.7, carbs: 18.2, fat: 3.9 }
```

Macro-calculated calories: `(13.7 × 4) + (18.2 × 4) + (3.9 × 9) = 54.8 + 72.8 + 35.1 = 162.7 kcal`

Stated: **136 kcal** — calculated: **163 kcal** — **19.6% discrepancy**, which exceeds the 15% tolerance.

This is the only recipe that fails the calorie consistency check out of 153 tested.

**Fix:** Either correct `kcal` to 163, or recheck the macro breakdown (fat may be understated — cacao powder and Greek yogurt typically push fat higher).

---

### MINOR — Recipes with protein > 80g per portion (review for plausibility)

The following recipes have protein values that are nutritionally unusual but not necessarily wrong for high-volume athlete meal prep (5–7 portions from a large batch):

| Recipe | Line | Protein | Kcal |
|--------|------|---------|------|
| Chipotle Chicken Bowl | ~1179 | 88.8g | 847 |
| Honey Chipotle Chicken Bowl | ~1952 | 89.0g | 831 |
| Marry Me Chicken | ~2275 | 85.1g | 819 |
| High-Protein Breakfast | ~3247 | 98.0g | 852 |
| High-Protein Tuna & Veg Plate | ~5156 | 89.0g | 524 |

The "High-Protein Tuna & Veg Plate" (89g protein, only 524 kcal) has a very low fat macro (4g) which may be correct for a tuna + veg plate but worth verifying with the source recipe. The calorie math checks out within 15% so it passes the automated check.

**Recommendation:** Manually verify the "High-Protein Breakfast" (98g protein / 852 kcal) — that is an unusually large breakfast portion and may reflect the entire day's breakfast batch being logged as one portion.

---

## 6. Performance

### MAJOR — index.html is 1.07 MB (uncompressed)

**File:** index.html
**Size:** 1,072,789 bytes (uncompressed); recipe data alone is ~388 KB

The entire application — React code, ingredient database (~250 ingredients), 173 recipes with full steps and batchItems, UI component logic, and all tab views — is in a single HTML file. There is no code splitting, lazy loading, or separate chunk for recipe data.

Implications:
- **First load:** The browser must download, parse, and execute ~1 MB of HTML + JS before rendering anything. On a 3G connection (~1 Mbps), this takes approximately 8 seconds before the first paint. Gzip compression (applied by Netlify CDN) reduces this to roughly 200–250 KB, which brings the download to ~2 seconds on 3G — acceptable but not optimal.
- **Parse time:** Modern mobile devices parse 200 KB of gzipped JS in under 1 second. This is unlikely to cause jank but is worth monitoring with Lighthouse.
- **No incremental updates:** Any recipe data change requires the user to download the full 1 MB file again.

**Fix (incremental):**
1. Extract the `RECIPES` array (lines 714–5332) and `ING_FLAT` array into a separate `data.js` file, fetched lazily on first app load and cached in IndexedDB or the SW cache. This would shrink the initial HTML to ~400 KB.
2. Consider splitting the ingredient calculator tab into a separate chunk loaded on demand.

---

### MINOR — Vendor JS loaded from local files (good), but build command fetches from CDN at deploy time

**File:** netlify.toml, line ~10

```toml
command = "mkdir -p vendor && curl --fail -L 'https://unpkg.com/react@18.2.0/...' -o vendor/react.min.js && ..."
```

This is a correct pattern, but if `unpkg.com` or `cdn.jsdelivr.net` are unavailable at deploy time, the build fails hard (`--fail` flag and `test -s` checks are present, which is correct). This has no runtime impact but is worth noting as a build-time dependency on external CDNs.

---

## 7. Security

### CRITICAL — All recipe content is client-side only; unlock state is stored in localStorage

**File:** index.html
**Lines:** 8558, 8718, 12570, 12655

```js
const unlocks = JSON.parse(localStorage.getItem("mp_unlocks") || "{}");
// ...
localStorage.setItem("mp_unlocks", JSON.stringify(unlock));
```

All 173 recipes — including the premium-locked ones — are embedded in the public `index.html` file. The lock enforcement is purely client-side: if a user opens DevTools and runs:

```js
localStorage.setItem("mp_unlocks", JSON.stringify({ allRecipes: true, tier: "annual" }))
```

they gain immediate access to all locked recipes at no cost. This is a fundamental business model vulnerability. Any technically capable user can bypass payment.

**Impact:** Revenue leakage on every recipe that is locked but fully present in the HTML source.

**Fix options (in order of effort):**
1. **Short-term:** Serve locked recipe `steps` and `batchItems` via a signed API call only after payment verification. Render only the recipe card header (name, macros, preview image) client-side; fetch full recipe content server-side on demand.
2. **Medium-term:** Move the full recipe data out of `index.html` into a protected Supabase table with Row Level Security, fetched only for authenticated paid users.
3. **Minimum viable:** At minimum, do not include `steps` or `batchItems` for locked recipes in the initial HTML payload. Store them server-side and fetch them after the user's subscription status is verified via Supabase JWT.

---

### CRITICAL — DEV_TIER_HASHES with hinted plaintext in public client source

**File:** index.html
**Lines:** 8338–8351

```js
// Dev access — tiered codes, stored as SHA-256 hashes only, never plaintext in source
const DEV_TIER_HASHES = {
    "837488f6d1011054c23e6147534de79e373151605d212653d898fe4cfa49a7c8": { tier: "free", ... },
    "00608339aac4da4d44e9a472ba7e892e3040c014c961fedbb3d2254ef70ee6bd": { tier: "monthly", ... },
    ...
    // ── Simple codes: SGFREE / SGMONTH / SGANNUAL / SGDEV ─────────────────
    "b17ad9be1d0231ab3ea814be0afe3d88bb8d022e67b83411dc7588ecdb271b47": { tier: "free", ... },
    "422e5f242ee9615dfe7a01d89faca3c7bec329c6a58df07340a6cedae28e88ce": { tier: "monthly", ... },
    "b2153f49bedf40adfcaa8bd993dcdeccead2d7fcc4820738db14cbbaa4a5474d": { tier: "annual", ... },
    "628988b0f35aa1223f24dd8a3517f8a320648af5d7acba11530b6e4da950fbb7": { tier: "dev", ... },
};
```

The comment on line 8346 literally names the plaintext codes: `SGFREE`, `SGMONTH`, `SGANNUAL`, `SGDEV`. An attacker reads the comment, hashes those four strings with SHA-256, and immediately gets the hashes that unlock monthly/annual/dev access. The SHA-256 protection is completely negated by documenting the plaintext values in the same file.

Running `sha256("SGANNUAL")` (the string, uppercased and trimmed per `_hashInput`) produces the exact hash at line 8349 that grants `tier: "annual", allRecipes: true`.

**Fix:**
1. Remove the comment naming the plaintext codes immediately.
2. Rotate all four codes to new values and remove the hash table entirely from client-side code. Validate codes server-side only (e.g., via `redeem-promo.js` which already does server-side validation).
3. The two hash sets (lines 8341–8344 and 8346–8349) appear to be old and new code sets — the old set's corresponding plaintext is not documented here, making it slightly harder but still attackable via the Supabase `promo_codes` table approach which is more secure.

---

### MAJOR — `admin.html` is publicly accessible with no network-level protection

**File:** admin.html, netlify.toml

`admin.html` is a React admin panel that shows user data and admin codes. It is served publicly at `https://soulgainz.app/admin.html`. Netlify's `[[redirects]]` block does not include a rule to block or require auth for this path.

Protection is by JavaScript password prompt only: the page calls `/.netlify/functions/admin-verify` and stores a session token in `sessionStorage`. If `ADMIN_SECRET` is guessed or brute-forced (see `admin-verify.js` rate limiting issue above), full admin access is gained.

**Fix:**
1. Add a Netlify redirect to block the page for all non-localhost origins:
   ```toml
   [[redirects]]
     from = "/admin.html"
     to = "/404"
     status = 404
   ```
   Or use Netlify's password protection feature for the admin route.
2. Alternatively, move admin functionality to a separate protected subdomain or use Netlify's Identity Gate.

---

### MAJOR — Supabase service role key exposed in server logs if env var is missing

**File:** netlify/functions/stripe-webhook.js, netlify/functions/renewal-reminder.js

When `SUPABASE_SERVICE_KEY` is undefined, `createClient(url, undefined)` does not throw immediately but will fail on the first API call with an error that may include the request headers in the log output. In some Supabase SDK versions, the `undefined` key is serialised in the Authorization header as the string `"Bearer undefined"`, which is visible in Netlify function logs. While this doesn't expose a real secret, it produces misleading logs.

**Fix:** Add explicit guards for all Supabase env vars before calling `createClient` (see renewal-reminder.js issue above).

---

### MINOR — CSP uses `'unsafe-inline'` for `script-src`

**File:** netlify.toml
**Line:** 118

```
Content-Security-Policy = "... script-src 'self' 'unsafe-inline' ..."
```

`'unsafe-inline'` allows any inline `<script>` tag or `javascript:` URL to execute, which significantly weakens XSS protection. This is a necessary trade-off for a single-file React app with inline scripts (no build step), but it means any XSS injection point would be exploitable.

**Fix (long-term):** Move to a build-step architecture with bundled JS so inline scripts can be replaced with a hash-based or nonce-based CSP without `'unsafe-inline'`.

---

### MINOR — Supabase anon key is public (expected, but RLS must be verified)

**File:** index.html
**Lines:** 8140–8141

```js
const SUPABASE_URL     = "https://rjreunvnsfjclpighogp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

Supabase anon keys are designed to be public. However, they allow any client to make API calls with the anon role. If any Supabase table lacks Row Level Security (RLS), the full table is readable/writable by anyone with the URL.

**Action required (verify before launch):** Confirm RLS is enabled on all tables: `users`, `subscriptions`, `events`, `promo_codes`, `push_subscriptions`, `calc_email_sends`. Use the Supabase dashboard → Table Editor → RLS Enabled toggle, or run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`.

---

## 8. Broken Links / Missing Assets

### MINOR — Service worker PRECACHE references `/` which redirects in production

**File:** sw.js, netlify.toml

```js
const PRECACHE = ['/', '/index.html', ...];
```

In production, `GET /` returns a 301 redirect to `/landing.html`. The service worker's `cache.add('/')` will cache the 301 redirect response (or follow it and cache landing.html under the `/` key, depending on the browser's redirect-following behaviour in SW context). This may cause the offline fallback for `/` to serve `landing.html` rather than the app shell.

**Fix:** Remove `'/'` from PRECACHE. The app shell is already listed as `'/index.html'` on the next line. Only one of the two is needed.

---

### MINOR — `icon-1024.png` exists in repo but is not referenced in manifest.json

**File:** manifest.json, /icon-1024.png

The 1024×1024 icon exists on disk but is absent from the Web App Manifest `icons` array. iOS and macOS use the highest-resolution icon available from the manifest; without a 1024px entry, some contexts (e.g., macOS Dock for installed PWAs) will use the 512px icon at 2× scale.

**Fix:** Add to manifest.json:
```json
{ "src": "/icon-1024.png", "sizes": "1024x1024", "type": "image/png" }
```

---

### INFO — `favicon.ico` not referenced in index.html `<link>` tag

The `favicon.ico` exists at the root but there is no explicit `<link rel="icon" href="/favicon.ico">` tag in `index.html`. Modern browsers will auto-discover `favicon.ico` at the root, so this works but is implicit.

---

## Appendix: Environment Variables Checklist

The following env vars are referenced across functions. Verify all are set in the Netlify dashboard before launch:

| Variable | Required by | Notes |
|----------|-------------|-------|
| `STRIPE_SECRET_KEY` | create-checkout, stripe-webhook, customer-portal, verify-session, admin-friend-code | Critical — no fallback |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | Critical — webhook silently ignored if missing |
| `STRIPE_BIRTHDAY_COUPON_ID` | birthday-emails | Optional — birthday flow skipped if missing |
| `SUPABASE_URL` | 15+ functions | Critical |
| `SUPABASE_SERVICE_KEY` | 15+ functions | Critical — use service_role, not anon |
| `RESEND_API_KEY` | 10+ email functions | Critical — all emails fail silently |
| `RESEND_AUDIENCE_ID` | save-user | Emails still send but audience not updated |
| `ADMIN_SECRET` | admin-verify, admin-friend-code, push-send, send-new-drop, resend-welcome-all | Critical for admin functions |
| `ALLOWED_PRICE_IDS` | create-checkout | Recommended — prevents arbitrary price_id abuse |
| `VAPID_PUBLIC_KEY` | push-send (client) | Required for push notifications |
| `VAPID_PRIVATE_KEY` | push-send | Required for push notifications |
| `VAPID_EMAIL` | push-send | Defaults to `mailto:admin@soulgainz.app` |
| `FROM_EMAIL` | 10+ email functions | Defaults to `SoulGainz <admin@soulgainz.app>` |
| `APP_URL` | 10+ functions | Defaults to `https://soulgainz.app` |
| `LAUNCH_SECRET` | send-launch-email | Required for launch email trigger |
| `ADMIN_EMAILS` | send-promo-code | Defaults to `dejan.zerafa@icloud.com` |

---

## Priority Fix List (Launch Blockers)

1. **[CRITICAL]** Move premium recipe content (`steps`, `batchItems`) server-side; do not embed in HTML for locked recipes.
2. **[CRITICAL]** Remove `DEV_TIER_HASHES` from client source; rotate all dev codes; validate server-side only.
3. **[MAJOR]** Change `manifest.json` `start_url` from `"/"` to `"/index.html"` so installed PWA opens the app, not the landing page.
4. **[MAJOR]** Fix `renewal-reminder.js` to check Supabase env vars before calling `createClient`.
5. **[MAJOR]** Block `admin.html` via netlify.toml redirect or Netlify Identity Gate.
6. **[MAJOR]** Add rate limiting to `admin-verify.js` using Netlify Blobs (same pattern as track-event.js).
7. **[MAJOR]** Add user authentication to `push-subscribe.js` to prevent unauthorised unsubscribe.
8. **[MAJOR]** Add `OPTIONS` handler and CORS headers to `send-calc-followup.js`.
9. **[RECIPE]** Correct calorie value in "Protein Brownie Cookies" from 136 to 163 kcal (line 3482).
