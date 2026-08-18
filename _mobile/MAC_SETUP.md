# SoulGainz — Mac Setup Guide
# Run these commands in Terminal from the _mobile/ folder

## 1 — Open Terminal and navigate to the project

```bash
cd ~/Desktop/Cowork/SoulGainz/_mobile
```

---

## 2 — Install dependencies (already done, but run if node_modules is missing)

```bash
npm install
```

---

## 3 — Install CocoaPods (required for iOS — one-time)

```bash
sudo gem install cocoapods
```

If that fails on a newer Mac, try:
```bash
brew install cocoapods
```

---

## 4 — Add iOS and Android platforms (first time only)

```bash
npx cap add ios
npx cap add android
```

This creates `ios/` and `android/` folders (~300MB combined). Takes 1-2 min.

---

## 5 — Sync the latest webapp into the mobile build

Run this every time you update index.html:

```bash
npm run sync
```

This copies index.html + vendor files into www/, injects the Capacitor bridge,
then pushes everything into the iOS/Android projects.

---

## 6 — Generate all app icon + splash screen sizes

```bash
npx @capacitor/assets generate --iconBackgroundColor '#0C0B0A' --iconBackgroundColorDark '#0C0B0A' --splashBackgroundColor '#0C0B0A' --splashBackgroundColorDark '#0C0B0A'
```

Icons are sourced from:
  assets/icons/icon.png   — 1024×1024 (already done ✅)
  assets/splash/splash.png — 2732×2732 (already done ✅)

---

## 7 — Open in Xcode (iOS)

```bash
npm run ios
```

Inside Xcode:
1. Click the "App" project in the left sidebar
2. Go to "Signing & Capabilities"
3. Select your Apple Developer Team (once your enrollment is approved)
4. Bundle Identifier should already be: com.soulgainz.app
5. Product → Archive
6. In the Organizer window: Distribute App → App Store Connect → Upload

**TestFlight first** (recommended):
After uploading, go to App Store Connect → TestFlight and invite yourself
to test before submitting to public review.

---

## 8 — Open in Android Studio (Android)

First, install Android Studio: https://developer.android.com/studio

```bash
npm run android
```

Inside Android Studio:
1. Build → Generate Signed Bundle / APK
2. Choose "Android App Bundle" (.aab)
3. Create a new keystore (save it somewhere safe — you need it for every update)
4. Build → release
5. Upload the .aab to Google Play Console

---

## Quick reference

| Command | What it does |
|---|---|
| `npm run sync` | Copy webapp → www/ + cap sync |
| `npm run ios` | Open Xcode |
| `npm run android` | Open Android Studio |
| `npx cap doctor` | Check for setup issues |
| `npx cap ls` | List installed platforms |

---

## Checklist before App Store submission

- [ ] Apple Developer enrollment approved ($99/year)
- [ ] CocoaPods installed (`pod --version`)
- [ ] `npx cap add ios` completed — ios/ folder exists
- [ ] `npx cap add android` completed — android/ folder exists
- [ ] Icons generated (all sizes)
- [ ] Splash screens generated
- [ ] Screenshots captured (at least 3 for iPhone 6.7" in Xcode Simulator)
- [ ] App tested on real device or Simulator
- [ ] Privacy policy URL live at soulgainz.app/privacy ✅
- [ ] Terms URL live at soulgainz.app/terms ✅
- [ ] App Store listing filled in App Store Connect (name, description, keywords)
- [ ] Age rating questionnaire done

## Checklist before Google Play submission

- [ ] Google Play Console account created ($25 one-time)
- [ ] Android Studio installed
- [ ] `npx cap add android` completed
- [ ] Keystore file created and backed up safely
- [ ] .aab built and uploaded
- [ ] Store listing filled (title, description, screenshots)
- [ ] Content rating questionnaire done
- [ ] Privacy policy URL added
