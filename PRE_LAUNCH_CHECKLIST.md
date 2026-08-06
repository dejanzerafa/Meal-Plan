# SoulGainz — Pre-Launch Checklist

Track everything that needs to be done before going live on the App Store and Google Play.

---

## 🟢 Done (infrastructure & webapp)

- [x] PWA live and installable (index.html deployed via Netlify/GitHub)
- [x] Supabase auth — sign up, sign in, sign out, session persistence
- [x] Stripe checkout — monthly, quarterly, annual, single recipe, seasonal, calculator tiers
- [x] Stripe webhook — tier activation, renewal, expiry + revert to free on cancel/delete
- [x] Stripe Customer Portal wired (`customer-portal.js`) — users can cancel/update billing
- [x] Stripe webhook idempotency — duplicate event protection in place
- [x] Promo code system — email + tier → code → auto-expires → reverts to free
- [x] Supplement tracker with localStorage + Supabase sync
- [x] Supplement data persists across sign-out / session expiry
- [x] Macro calculator page (calculator.html)
- [x] Blog index + 5 SEO posts + sitemap.xml
- [x] Email automation suite (welcome, renewal reminder, birthday, holiday)
- [x] Shopping list, pantry tab, custom recipe builder
- [x] Favourites, cooked-it tracking, prep calendar
- [x] 173 recipes — all macros verified ingredient by ingredient
- [x] _mobile/ Capacitor scaffold ready (see _mobile/LAUNCH_GUIDE.md)

---

## 🔴 Stripe — Switch to Live Mode (REQUIRED before any real revenue)

Everything below is currently running on **Stripe TEST mode**. No real money moves until these are done.

### Step 1 — Create live products & prices in Stripe Dashboard

Log into dashboard.stripe.com → switch to **Live mode** (toggle top-left) → Products → create each:

| Tier | Current test price ID | Action |
|---|---|---|
| Monthly | `price_1TU83bGjmPEqu9q97qSe6xYd` | Create live equivalent → copy new ID |
| Quarterly | `price_1TU81SGjmPEqu9q9UVg827sE` | Create live equivalent → copy new ID |
| Annual | `price_1TXc8dGjmPEqu9q9sIA4RenP` | Create live equivalent → copy new ID |
| Single recipe | `price_1TU82XGjmPEqu9q9EhfIpkFW` | Create live equivalent → copy new ID |
| Seasonal drop | `price_1TVTP1GjmPEqu9q9J81es0wu` | Create live equivalent → copy new ID |
| Calculator | `price_1TU824GjmPEqu9q90xWZDozk` | Create live equivalent → copy new ID |

### Step 2 — Update index.html with live keys

In `index.html` around line 7825, replace:

```js
// BEFORE (test)
const STRIPE_PUBLIC_KEY = "pk_test_51TU7NmGjmPEqu9q9...";
const STRIPE_PRICES = {
    quarterly: "price_1TU81S...",
    annual:    "price_1TXc8d...",
    monthly:   "price_1TU83b...",
    calculator:"price_1TU824...",
    single:    "price_1TU82X...",
    seasonal:  "price_1TVTP1...",
};

// AFTER (live)
const STRIPE_PUBLIC_KEY = "pk_live_...";   // from Stripe Dashboard → Developers → API keys
const STRIPE_PRICES = {
    quarterly: "price_live_...",   // new live price IDs from Step 1
    annual:    "price_live_...",
    monthly:   "price_live_...",
    calculator:"price_live_...",
    single:    "price_live_...",
    seasonal:  "price_live_...",
};
```

### Step 3 — Update Netlify environment variables

Netlify Dashboard → Site → Environment variables → update:

| Variable | Current value | Replace with |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` (Stripe Dashboard → API keys) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (test) | New `whsec_...` from live webhook (Step 4) |

### Step 4 — Create live webhook endpoint

Stripe Dashboard → Developers → Webhooks → **+ Add endpoint**:

- URL: `https://soulgainz.netlify.app/.netlify/functions/stripe-webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Copy the `whsec_...` signing secret → paste into Netlify `STRIPE_WEBHOOK_SECRET`

### Step 5 — Configure Stripe Customer Portal (live mode)

Stripe Dashboard → Settings → Billing → **Customer portal** (make sure you're in Live mode):

- [ ] Enable "Cancel subscription"
- [ ] Enable "Update payment method"
- [ ] Set cancellation policy (cancel at period end recommended — keeps access until expiry)
- [ ] Set return URL: `https://soulgainz.netlify.app`
- [ ] Save configuration

### Step 6 — End-to-end purchase test (live mode)

Use a real card (your own) to verify the full flow:

- [ ] Monthly subscription purchase → tier activates in app
- [ ] Webhook fires → Supabase `subscriptions` table updated
- [ ] Welcome email received
- [ ] Customer portal accessible (ME tab → Manage Billing)
- [ ] Cancel subscription → access continues until period end → then reverts to free
- [ ] Annual subscription purchase → correct expiry date shown
- [ ] Single recipe unlock → recipe unlocks without full subscription
- [ ] Promo code applied at checkout → correct tier granted

### Step 7 — Financial ops setup

- [ ] Add bank account to Stripe for payouts (Stripe Dashboard → Balance → Payouts)
- [ ] Set payout schedule (daily / weekly / monthly — your preference)
- [ ] Confirm business details in Stripe (required for payouts in AU)
- [ ] Set up Stripe Tax if charging GST (required for Australian customers) — Stripe Dashboard → Tax
- [ ] Download Stripe's standard dispute evidence template — keep receipts of user activity in Supabase for any chargebacks

---

## 🟡 Native App — IAP Decision (decide before App Store submission)

Apple and Google require using their own In-App Purchase system for subscriptions sold inside native apps. This is a strategic decision:

| Option | Pros | Cons |
|---|---|---|
| **Stripe web checkout only** (current) | No 30% cut, already built | Apple may reject app if subscription benefit is behind a paywall only accessible via external payment |
| **RevenueCat + native IAP** | Store-compliant, better conversion | 30% cut to Apple/Google, extra integration work |
| **Hybrid** | Stripe for web users, RevenueCat for app users | Most complex, but maximises revenue |

> **Recommended path:** Launch on Google Play first with Stripe web checkout (Android is lenient). 
> For iOS, use the "reader app" exemption if possible, or implement RevenueCat for App Store compliance.

- [ ] Decision made on IAP strategy
- [ ] If RevenueCat: create account at revenuecat.com, link Stripe + Apple + Google
- [ ] If Stripe web only: confirm Apple won't reject during review (test with TestFlight first)

---

## 🔵 Mobile App — Store Submission

- [ ] Design app icon — 1024 × 1024 px, no transparency, no rounded corners (PNG)
- [ ] Design splash screen — 2732 × 2732 px, dark background (#0d0d0d), centred logo
- [ ] Run `npx capacitor-assets generate` to produce all icon/splash sizes
- [ ] iOS screenshots — minimum 3 × iPhone 6.7" + 3 × iPhone 6.5"
- [ ] Android screenshots — minimum 2 × phone, optional tablet
- [ ] Apple Developer account enrolled ($99/yr) — developer.apple.com
- [ ] Google Play Console account created ($25 one-time) — play.google.com/console
- [ ] `cd _mobile && npm install && npx cap add ios && npx cap add android`
- [ ] `npm run sync` — copy webapp into mobile build
- [ ] iOS: Xcode → Archive → upload to App Store Connect
- [ ] iOS: TestFlight internal test before public submission
- [ ] Android: Android Studio → signed AAB → upload to Play Console (Internal Testing first)
- [ ] Universal Links (iOS) + App Links (Android) for Supabase auth redirects
- [ ] Production APNS certificate added to Supabase (push notifications)
- [ ] Swap localStorage supplement reminders for @capacitor/push-notifications

---

## 🟡 Marketing & Legal

- [ ] Privacy policy page live with URL (required by both stores + Stripe)
- [ ] Terms of service page live (include subscription + refund terms)
- [ ] Refund policy defined — currently UI says "30-day money-back guarantee", confirm this is intentional and add to ToS
- [ ] App Store listing copy — name, subtitle, description, keywords
- [ ] Google Play listing copy — title, short description, full description, tags
- [ ] Age rating questionnaire completed in both store dashboards
- [ ] Landing page updated with App Store + Google Play download badges
- [ ] Social media accounts set up (Instagram, TikTok minimum)
- [ ] Launch email drafted to existing user base

---

## 🟡 Technical / QA

- [ ] Full Playwright test run on final build before submission
- [ ] Test auth flow inside Capacitor (sign up, sign in, deep link redirect)
- [ ] Test push notifications on real iOS + Android device
- [ ] Verify Supabase prod schema has `user_supplements` table
- [ ] Verify all Supabase Edge Functions deployed to prod (birthday-emails, holiday-emails, renewal-reminder)
- [ ] Performance audit — Lighthouse score on webapp before wrapping
- [ ] Error monitoring set up (Sentry or similar) — optional but recommended

---

## Notes

- `_mobile/LAUNCH_GUIDE.md` — full step-by-step mobile build instructions
- **Do Stripe live mode switch before any marketing push** — test purchases go nowhere
- Submit to Google Play first — faster review, more lenient on payment rules
- Keep webapp and mobile build separate until submission day
- Stripe payouts take 7 days on first payout, then follow your schedule
