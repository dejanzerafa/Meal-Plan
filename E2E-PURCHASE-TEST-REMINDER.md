# ⚠️ Reminder: Run E2E Purchase Test — SoulGainz Meal Prep App

**Date:** 2026-05-17  
**Status:** Pending — Still on Stripe TEST keys. Do NOT go live until this passes.

---

## What to Test

### 1. Open the app
- Try **https://soulgainz.app** first
- Fallback: **https://soulgainz.netlify.app** (if DNS not yet resolved)

### 2. Sign up with a test email
- Use a throwaway/test email address you can check

### 3. Purchase each plan type using the Stripe test card:
| Field | Value |
|---|---|
| Card number | `4242 4242 4242 4242` |
| Expiry | Any future date (e.g. 12/29) |
| CVC | Any 3 digits (e.g. 123) |

### 4. After each purchase, verify:
- [ ] Redirected to the **success page** correctly
- [ ] **Unlock state applied** — recipes/calculator unlocked as expected
- [ ] **Welcome email received** in the test email inbox
- [ ] **User appears in Supabase** users table with correct subscription tier

### 5. Test the restore account flow:
- Clear `localStorage` in the browser (DevTools → Application → Local Storage → Clear)
- Re-open the app
- Use **"Sign in"** to restore purchases by email
- Confirm subscription state is correctly restored

---

## Before Going Live Checklist
- [ ] All plan types purchased and verified successfully
- [ ] Restore flow works cleanly
- [ ] Welcome emails landing in inbox (not spam)
- [ ] Supabase records look correct
- [ ] `STRIPE_ENABLED=true` and all env vars confirmed in Netlify dashboard

**Only switch to live Stripe keys after all of the above pass cleanly.**
