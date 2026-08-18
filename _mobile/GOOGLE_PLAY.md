# SoulGainz — Google Play Setup Guide

## What you need before starting
- [ ] Google Play Console account created ($25 paid ✅)
- [ ] Android Studio installed (download: developer.android.com/studio)
- [ ] This repo cloned on your Mac

---

## Step 1 — Install Android Studio

Download from: https://developer.android.com/studio
- Drag to Applications
- Open it, go through the setup wizard (installs Android SDK automatically)
- When asked about SDK components, accept the defaults

---

## Step 2 — Add the Android platform (Terminal)

```bash
cd ~/Desktop/Cowork/SoulGainz/_mobile
npm install
npm run sync
npx cap add android
```

This creates an `android/` folder with a full Android Studio project inside.

---

## Step 3 — Open in Android Studio

```bash
npm run android
```

Android Studio opens. Wait for it to finish indexing (bottom progress bar).

---

## Step 4 — Generate your signing keystore (ONE TIME — keep this file safe)

In Terminal:

```bash
cd ~/Desktop/Cowork/SoulGainz/_mobile
bash generate-keystore.sh
```

This creates `soulgainz-release.keystore`. 
⚠️  BACK THIS FILE UP. If you lose it, you can never update your app on Google Play.
Store it in: iCloud Drive, a password manager, or anywhere safe outside this repo.

---

## Step 5 — Build a signed release .aab

Inside Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle** → Next
3. Click **Choose existing** → select `soulgainz-release.keystore`
4. Enter the passwords you set during keystore creation
5. Key alias: `soulgainz`
6. Choose **release** → Finish

The `.aab` file will be at:
`android/app/build/outputs/bundle/release/app-release.aab`

---

## Step 6 — Create your app in Google Play Console

1. Go to https://play.google.com/console
2. **Create app** → App name: `SoulGainz – Meal Prep & Macros`
3. Default language: English (Australia) or English (United States)
4. App or Game: **App**
5. Free or Paid: **Free** (you monetise via subscription inside the app)
6. Accept policies → Create app

---

## Step 7 — Fill in the store listing

Go to **Store presence → Main store listing**

### App name
```
SoulGainz – Meal Prep & Macros
```

### Short description (80 chars max)
```
High-protein meal prep. Macro tracking. Weekly plans. Built for gym-goers.
```

### Full description
Copy from `STORE_LISTING_COPY.md` → Google Play section

### Graphics to upload (all in `_mobile/assets/`)
| Asset | File | Size |
|---|---|---|
| App icon | `google-play-icon-512.png` | 512×512 |
| Feature graphic | `google-play-feature-graphic.png` | 1024×500 |
| Screenshots | Capture from emulator (see Step 8) | min 2 |

### Category
Health & Fitness

### Privacy policy
```
https://soulgainz.app/privacy
```

---

## Step 8 — Capture screenshots from the emulator

1. In Android Studio: **Tools → Device Manager → Create Device**
2. Pick **Pixel 8 Pro** (or similar) → Download latest API → Finish
3. Click ▶ to launch the emulator
4. Your app opens automatically (or run `npm run android` again)
5. Use the emulator's camera button (📷) in the side toolbar to screenshot
6. Screenshots save to your Desktop

Capture at least 2-3 screens: Home/Plan view, Recipe detail, Shopping list.

---

## Step 9 — Set up closed testing (required for new accounts)

Google requires new developer accounts to run a **closed test with 12+ testers for 14 days** before going live.

1. Go to **Testing → Closed testing → Create track**
2. Name it "Beta"
3. Upload your `.aab` file
4. Add testers: **Testers → Create email list**
5. Add 12+ email addresses (friends, family, waitlist users with Android phones)
6. Share the opt-in URL with them — they install via Play Store

After 14 days with 12+ active testers, you can apply to go to **Production**.

---

## Step 10 — Submit to Production

Once the 14-day closed test is done:
1. **Production → Create new release**
2. Upload the same (or updated) `.aab`
3. Fill in release notes:
```
SoulGainz is here. 173 high-protein, macro-verified meal prep recipes. Weekly planner, shopping list, macro calculator. Feed your soul. Fuel your gainz.
```
4. **Review release → Start rollout to Production**

Google reviews usually take 1-3 days.

---

## Useful commands

```bash
npm run sync          # Sync latest index.html → android project
npm run android       # Open Android Studio
npx cap doctor        # Check environment
```
