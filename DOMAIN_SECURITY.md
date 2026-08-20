# SoulGainz — Domain Ownership, Security & Brand Protection

*Last updated: August 2026*

---

## 1. What You Own

| Asset | Status | Where |
|---|---|---|
| `soulgainz.app` domain | ✅ Registered | Google Domains (now Squarespace Domains) |
| `soulgainz.app` SSL cert | ✅ Auto-managed | Netlify (Let's Encrypt, auto-renews) |
| SoulGainz brand name | ⚠️ Not trademarked | — register ASAP |
| App Store listing (iOS) | ⏳ Pending | Apple Developer — enrollment pending |
| Google Play listing | ⏳ Pending | Play Console — identity verification pending |

---

## 2. Domain Security — Action Checklist

### ✅ Already handled
- **HTTPS / SSL** — Netlify handles this automatically. Your cert auto-renews every 90 days via Let's Encrypt. No action needed.
- **Domain registration** — `soulgainz.app` is registered. `.app` domains are HTTPS-only by design (Google's registry forces HTTPS). You cannot serve HTTP on `.app` — this is a security feature, not a limitation.

### ⚠️ Do these now

#### Domain Lock (Transfer Lock)
Prevents unauthorised domain transfer away from your registrar.
1. Go to [domains.squarespace.com](https://domains.squarespace.com) (Google Domains migrated here)
2. Sign in → find `soulgainz.app`
3. Go to **Security** → enable **Domain lock** (also called Transfer lock)
4. This stops anyone from initiating a domain transfer without your explicit approval

#### WHOIS Privacy
Hides your personal contact details (name, email, address) from the public WHOIS database.
- Squarespace Domains includes WHOIS Privacy free. Check it's enabled:
  1. domains.squarespace.com → `soulgainz.app` → **Privacy**
  2. Toggle **Privacy protection** ON

#### DNSSEC
Adds a cryptographic signature to your DNS records, preventing DNS spoofing attacks.
- Squarespace Domains supports DNSSEC. Enable it:
  1. domains.squarespace.com → `soulgainz.app` → **Security** → **DNSSEC**
  2. Enable and save
- Netlify also supports DNSSEC — no extra config needed on their side

#### Two-Factor Authentication
Secure your Squarespace Domains account with 2FA:
1. squarespace.com → Account → Security → enable Authenticator App 2FA
2. Also enable 2FA on your Netlify account (netlify.com → User settings → Security)

#### Auto-Renew
Make sure auto-renew is ON for your domain:
- domains.squarespace.com → `soulgainz.app` → **Registration** → **Auto-renew: ON**
- `.app` domains expire and can be snatched within hours if you miss renewal

---

## 3. Email Security (SPF / DKIM / DMARC)

Currently you send emails via **Resend** (`resend.com`). To prevent spoofing and improve deliverability:

### Check your current DNS records in Netlify or Squarespace:

**SPF record** (prevents spoofing):
```
TXT  @   "v=spf1 include:_spf.resend.com ~all"
```

**DKIM** — Resend provides a DKIM key when you verify your domain. Go to:
1. resend.com → Domains → `soulgainz.app` → verify it
2. Add the TXT records Resend gives you to your DNS

**DMARC** (tells receivers what to do with failures):
```
TXT  _dmarc   "v=DMARC1; p=quarantine; rua=mailto:support@soulgainz.com"
```

Add these in your DNS settings (either at Squarespace Domains or Netlify DNS, wherever you manage DNS).

---

## 4. Professional Email

Currently using `support@soulgainz.com` in the app, but this address may not be set up. Options:

### Option A — Google Workspace (recommended, $6/mo USD)
- `support@soulgainz.app` or `dejan@soulgainz.app`
- Full Gmail interface, professional, integrates with everything
- Setup: workspace.google.com → add custom domain → add MX records to Squarespace DNS

### Option B — Resend Inbound (free, tech setup)
- Forward `support@soulgainz.app` to your personal email
- Handle support replies manually

### Option C — Cloudflare Email Routing (free)
- Free email forwarding: `support@soulgainz.app` → your personal inbox
- cloudflare.com → free plan → Email → Email Routing

---

## 5. Trademark Registration — SoulGainz

**This is your most important brand protection action.**

Without a trademark, anyone can register "SoulGainz" or a similar name and you have limited legal recourse.

### Australia (IP Australia)

**Cost:** ~AUD $250 per class (online application)
**Time:** 7–13 months to registration
**Classes to register:**
- Class 42 — Software as a service (SaaS), app services
- Class 41 — Education, fitness, health information services
- Class 35 — Subscription services, meal planning

**Apply at:** [ipaustralia.gov.au/trade-marks](https://www.ipaustralia.gov.au/trade-marks/applying-for-a-trade-mark)

### USA (USPTO) — if targeting US market
**Cost:** ~USD $350 per class (TEAS Plus online)
**Time:** 8–12 months
**Apply at:** [uspto.gov/trademarks](https://www.uspto.gov/trademarks)

### Recommendation
Register in Australia first (~AUD $500 for 2 classes). If you scale to the US market, register there too. Use a trademark attorney for the US filing — it's complex. For Australia, you can self-file.

---

## 6. App Store Name Protection

- **App Store Connect**: Your app name `SoulGainz – Meal Prep & Macros` is reserved once your app is submitted. Apple prevents others from using the exact name.
- **Google Play**: Same — your app ID `com.soulgainz.app` and app name are protected once published.
- **Register the domain variants**: Consider buying `soulgainz.com` and `soulgainz.co` and redirecting them to `soulgainz.app` to prevent squatters.

---

## 7. Limited Liability — What's Already in Place

### ✅ Done
- **T&C checkbox on signup** — users must explicitly accept Terms of Service before creating an account
- **Terms acceptance timestamp** — `terms_accepted_at` ISO timestamp stored in Supabase user metadata on signup (added August 2026)
- **Terms version** — `terms_version: "2026-08"` stored so you know which version they accepted
- **Health disclaimer** — explicit "not medical advice" + "consult a professional" in Terms
- **Limitation of liability clause** — liability capped at 12-month payment amount
- **Jurisdiction clause** — Victoria, Australia courts
- **Australian Consumer Law carve-out** — statutory rights preserved

### ⚠️ Recommended additions

#### Store acceptance in Supabase profiles table
Run this SQL in Supabase to add the column:
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '2026-08';
```

Then add a Supabase trigger or update the Netlify webhook to write it on signup:
```sql
-- In your stripe-webhook or Supabase auth trigger:
UPDATE profiles 
SET terms_accepted_at = NOW(), terms_version = '2026-08'
WHERE id = auth.uid();
```

#### Full Terms of Service page
Currently terms are shown inline in the app. Consider adding `soulgainz.app/terms` as a full standalone page (already linked in Privacy Policy). This makes it legally defensible — courts are more comfortable with a URL-accessible document.

You can add a simple `terms.html` page mirroring the in-app text.

#### Business Structure
If not already done, register as a sole trader (ABN) or Pty Ltd in Australia:
- **Sole trader**: ABN registration, free. Provides some separation. Tax is personal rate.
- **Pty Ltd**: ~AUD $500 to register via ASIC. Provides true liability separation — your personal assets are protected if the company is sued. Highly recommended as you scale.

---

## 8. Priority Action Plan

| Priority | Action | Cost | Time |
|---|---|---|---|
| 🔴 Urgent | Enable domain lock on Squarespace | Free | 5 min |
| 🔴 Urgent | Verify WHOIS privacy is ON | Free | 5 min |
| 🔴 Urgent | Enable 2FA on Squarespace + Netlify | Free | 10 min |
| 🔴 Urgent | Back up keystore to iCloud | Free | 2 min |
| 🟠 Soon | Set up DKIM on Resend for soulgainz.app | Free | 30 min |
| 🟠 Soon | Add DMARC record to DNS | Free | 10 min |
| 🟠 Soon | Add `terms_accepted_at` column to Supabase profiles | Free | 10 min |
| 🟡 This quarter | File trademark — Australia (Class 41 + 42) | AUD $500 | Self-file |
| 🟡 This quarter | Register `soulgainz.com` + `soulgainz.co` | ~$30/yr | 5 min |
| 🟡 This quarter | Set up professional email (Google Workspace or Cloudflare routing) | $6/mo or free | 30 min |
| 🟢 When scaling | Register trademark in USA (USPTO) | USD $700 | Use attorney |
| 🟢 When scaling | Incorporate Pty Ltd | AUD $500 | Use accountant |
