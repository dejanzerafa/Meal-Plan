# SoulGainz — Pre-Launch Checklist

Track everything that needs to be done before going live on the App Store and Google Play.

---

## 🟢 Done (infrastructure & webapp)

- [x] PWA live and installable (index.html deployed via Netlify/GitHub)
- [x] Supabase auth — sign up, sign in, sign out, session persistence
- [x] Stripe payments — monthly, quarterly, annual tiers
- [x] Stripe webhook — tier activation + expiry handling
- [x] Supplement tracker with localStorage + Supabase sync
- [x] Supplement data persists across sign-out / session expiry
- [x] Macro calculator page (calculator.html)
- [x] Blog index + 5 SEO posts
- [x] Sitemap.xml
- [x] Email automation suite (welcome, renewal reminder, birthday, holiday)
- [x] Promo code system with expiry + tier revert
- [x] Shopping list, pantry tab, custom recipe builder
- [x] Favourites, cooked-it tracking, prep calendar
- [x] 173 recipes — all macros verified ingredient by ingredient
- [x] _mobile/ Capacitor scaffold ready (see _mobile/LAUNCH_GUIDE.md)

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

- [ ] Privacy policy page live with URL (required by both stores)
- [ ] Terms of service page live
- [ ] App Store listing copy — name, subtitle, description, keywords
- [ ] Google Play listing copy — title, short description, full description, tags
- [ ] Age rating questionnaire completed in both store dashboards
- [ ] Landing page updated with App Store + Google Play download badges
- [ ] Social media accounts set up (Instagram, TikTok minimum)
- [ ] Launch email drafted to existing user base

---

## 🟡 Stripe / Payments

- [ ] Confirm Stripe is in live mode (not test mode)
- [ ] Confirm webhook URLs point to production Netlify functions
- [ ] Test a real purchase end to end (monthly, then cancel + verify revert)
- [ ] In-app purchases decision: use Stripe web checkout OR add RevenueCat for native IAP
  > Note: Apple takes 30% on IAP. Stripe web checkout avoids this but Apple may flag it.
  > Decision needed before App Store submission.

---

## 🟡 Technical / QA

- [ ] Full Playwright test run on final build before submission
- [ ] Test auth flow inside Capacitor (sign up, sign in, deep link redirect)
- [ ] Test push notifications on real iOS + Android device
- [ ] Verify Supabase prod schema has `user_supplements` table
- [ ] Verify all Supabase Edge Functions deployed to prod
- [ ] Performance audit — Lighthouse score on webapp before wrapping
- [ ] Error monitoring set up (Sentry or similar) — optional but recommended

---

## Notes

- `_mobile/LAUNCH_GUIDE.md` — full step-by-step technical instructions
- Keep webapp and mobile build separate until submission day
- Submit to Google Play first — faster review, easier to fix issues before App Store
