# SoulGainz — Mobile App Launch Guide

This folder contains everything needed to publish SoulGainz on the
**Apple App Store** and **Google Play Store** using Capacitor.

> The webapp (`../index.html`) is **not affected** by anything in here.
> This is a parallel build track only.

---

## Prerequisites (one-time setup)

### Accounts
| Store | Cost | Link |
|---|---|---|
| Apple Developer Program | $99 / year | https://developer.apple.com/programs/ |
| Google Play Console | $25 one-time | https://play.google.com/console/ |

### Tools
| Tool | Required for |
|---|---|
| Node.js ≥ 18 | Running Capacitor CLI |
| Xcode ≥ 15 (Mac only) | iOS build + submission |
| Android Studio | Android build + submission |
| CocoaPods (`sudo gem install cocoapods`) | iOS dependencies |

---

## Step 1 — Install dependencies

```bash
cd _mobile
npm install
```

---

## Step 2 — Add platform projects (first time only)

```bash
npx cap add ios
npx cap add android
```

This creates `ios/` and `android/` folders. They are git-ignored by default
(add to `.gitignore` if not already there — they're large and regeneratable).

---

## Step 3 — Sync webapp into the mobile build

Run this every time `index.html` changes:

```bash
npm run sync
```

This copies `index.html` + assets into `www/`, injects the Capacitor bridge,
then calls `npx cap sync` to push changes into iOS and Android projects.

---

## Step 4 — Build for iOS

```bash
npm run ios
```

1. Xcode opens with the `ios/App/App.xcworkspace` project
2. Select your Apple Developer Team in Signing & Capabilities
3. Set Bundle Identifier to `com.soulgainz.app`
4. Product → Archive
5. Distribute App → App Store Connect → Upload
6. Go to App Store Connect → submit for review

**TestFlight** (recommended first): distribute the archive to TestFlight
for internal testing before submitting to public review.

---

## Step 5 — Build for Android

```bash
npm run android
```

1. Android Studio opens with the `android/` project
2. Build → Generate Signed Bundle/APK → Android App Bundle (.aab)
3. Create or use existing keystore (keep the keystore file safe — you need
   it for every future update)
4. Upload the `.aab` to Google Play Console → Production or Internal Testing

---

## Assets to prepare before submission

### App Icons

Place your master icon (1024×1024 px, no rounded corners, no transparency)
at `assets/icons/icon.png`, then use a tool like
[capacitor-assets](https://github.com/ionic-team/capacitor-assets) to
auto-generate all required sizes:

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```

### Splash Screen

Place a 2732×2732 px splash image at `assets/splash/splash.png`.
Same command above generates all sizes.

### Store Listing Screenshots

Required before submission:
- **iOS**: at least 3 screenshots for iPhone 6.7" and 6.5"
- **Android**: at least 2 screenshots (phone), optional tablet

Use the live webapp in Chrome DevTools device mode, or Xcode Simulator /
Android Emulator, to capture these.

---

## Checklist before submitting

- [ ] App icon done (all sizes generated)
- [ ] Splash screen done
- [ ] Screenshots done (iOS + Android)
- [ ] Privacy policy URL live and linked in store listing
- [ ] App description + short description written
- [ ] Keywords / search tags chosen
- [ ] Age rating questionnaire completed in store dashboards
- [ ] Supabase: confirm `user_supplements` table exists in prod schema
- [ ] Stripe: confirm webhook URLs are production (not test mode)
- [ ] Push notifications: production APNS certificate added to Supabase
- [ ] TestFlight beta tested internally before App Store submission

---

## Useful commands

| Command | What it does |
|---|---|
| `npm run sync` | Copy webapp → www + npx cap sync |
| `npm run ios` | Open Xcode |
| `npm run android` | Open Android Studio |
| `npx cap doctor` | Check environment for issues |
| `npx cap ls` | List installed platforms |

---

## Notes

- **Deep links**: Supabase auth email links use `https://` — configure
  Universal Links (iOS) and App Links (Android) in Capacitor so auth
  redirects land back inside the app, not the browser.
- **Push notifications**: the Supabase reminder system already writes to
  `sg_supp_reminders` in localStorage; when running in Capacitor, swap
  this out for `@capacitor/push-notifications` for proper native alerts.
- **In-app purchases**: if you later want to offer subscriptions inside the
  native app, both stores require using their own IAP (RevenueCat is the
  easiest bridge). Stripe web-based checkout still works for the PWA.
