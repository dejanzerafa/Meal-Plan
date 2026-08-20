# SoulGainz — Domain & Security Actions (Do These Now)

*Last updated: August 2026 — Manual steps only. Do in order.*

---

## ✅ Already Done (by Claude)
- T&C jurisdiction fixed → Qatar (was Victoria, Australia)
- T&C footer updated → soulgainz.app/terms (not email)
- Privacy Policy OAIC reference removed (not relevant for Qatar)
- `terms.html` standalone page created and deployed
- `supabase-migration.sql` ready to run
- iCloud sync script updated — full backup including keystore

---

## 🔴 URGENT — Do These Today

### 1. Run Supabase Migration (5 min)
1. Go to: **supabase.com → your project → SQL Editor → New Query**
2. Copy the contents of `supabase-migration.sql`
3. Paste and click **Run**
4. Verify it returns the two columns: `terms_accepted_at`, `terms_version`

---

### 2. Enable Domain Lock (5 min)
Prevents anyone from transferring your domain away without your approval.

1. Go to: **[domains.squarespace.com](https://domains.squarespace.com)**
2. Sign in → find `soulgainz.app`
3. Click the domain → **Security** tab
4. Toggle **Domain lock (Transfer lock)** → ON
5. Save

---

### 3. Verify WHOIS Privacy is ON (3 min)
Hides your name, email, phone from the public WHOIS database.

1. Same page: domains.squarespace.com → `soulgainz.app`
2. Click **Privacy** tab
3. Confirm **Privacy protection** is toggled ON
4. If it's off, toggle it ON and save

---

### 4. Enable Auto-Renew (2 min)
`.app` domains can be snatched within hours of expiry.

1. domains.squarespace.com → `soulgainz.app` → **Registration** tab
2. Confirm **Auto-renew** is ON
3. Confirm your payment method is current

---

### 5. Enable 2FA on Squarespace Account (10 min)
1. Go to: **squarespace.com → account icon → Account Settings → Security**
2. Click **Set up two-factor authentication**
3. Choose **Authenticator App** (Google Authenticator or Authy)
4. Scan the QR code and save your backup codes in a safe place

---

### 6. Enable 2FA on Netlify (5 min)
1. Go to: **app.netlify.com → your avatar → User settings**
2. Click **Security** → **Two-factor authentication**
3. Enable with an Authenticator App
4. Save backup codes

---

## 🟠 Do This Week

### 7. Enable DNSSEC (10 min)
Adds cryptographic signatures to your DNS records — prevents DNS hijacking.

1. domains.squarespace.com → `soulgainz.app` → **Security** tab
2. Look for **DNSSEC** section → Enable
3. No additional Netlify config needed

---

### 8. Set Up DKIM on Resend (30 min)
Required for email deliverability. Proves your emails came from you.

1. Go to: **[resend.com](https://resend.com) → Domains → Add Domain**
2. Enter: `soulgainz.app`
3. Resend will give you 2-3 DNS records to add (TXT/CNAME)
4. Go to: **Squarespace Domains → soulgainz.app → DNS → Add Record**
   - Or Netlify DNS if you manage DNS there
5. Add each record Resend gives you
6. Back in Resend → click **Verify** (can take up to 48h to propagate)

---

### 9. Add SPF Record (10 min)
Tells email servers that Resend is authorised to send on your behalf.

Add this DNS TXT record:
```
Type:  TXT
Name:  @  (or leave blank for root domain)
Value: v=spf1 include:_spf.resend.com ~all
TTL:   3600
```

Where to add: Squarespace Domains → `soulgainz.app` → DNS → Add Record

---

### 10. Add DMARC Record (10 min)
Tells receiving servers what to do with emails that fail SPF/DKIM.

```
Type:  TXT
Name:  _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:support@soulgainz.com
TTL:   3600
```

Start with `p=quarantine` — move to `p=reject` after you confirm email is working.

---

## 🟡 This Quarter

### 11. Back Up Keystore to iCloud (2 min)
Your Android signing keystore MUST be backed up. Without it you can never update your Play Store app.

Run this in Terminal:
```bash
cp ~/Desktop/Cowork/SoulGainz/_mobile/soulgainz-release.keystore \
   ~/Library/Mobile\ Documents/com~apple~CloudDocs/soulgainz-release.keystore
```

Also store the keystore password somewhere safe (1Password, iCloud Keychain, etc.).

---

### 12. Run iCloud Full Sync (2 min)
Backs up your entire SoulGainz project folder to iCloud Drive.

```bash
bash ~/Desktop/Cowork/SoulGainz/sync-to-icloud.sh
```

To set up automatic hourly sync:
```bash
cp ~/Desktop/Cowork/SoulGainz/com.soulgainz.icloud-sync.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.soulgainz.icloud-sync.plist
```

---

### 13. Trademark Registration

**You are in Qatar — register here first:**

1. **Qatar Ministry of Commerce and Industry (MoCI)**
   - URL: moec.gov.qa → Intellectual Property → Trademarks
   - Classes: 42 (SaaS/Software), 41 (Education/Fitness)
   - Cost: ~QAR 1,500–2,500 self-filed
   - This establishes your **priority date** — critical for global protection

2. **WIPO Madrid Protocol (within 6 months of Qatar filing)**
   - URL: wipo.int/madrid/en
   - File once, designate: USA + UK + EU + Australia
   - Cost: ~USD 1,000–1,800 for 4 countries
   - This is the most cost-effective global protection

**Do NOT file in Australia first — you're not based there. Qatar filing is the right starting point.**

---

### 14. Register soulgainz.com + soulgainz.co (5 min, ~$30/yr)
Prevents brand squatters from registering similar domains and confusing your users.

Both domains redirect to soulgainz.app:
1. Register on Squarespace Domains, Namecheap, or Cloudflare Registrar
2. Set up URL forwarding → soulgainz.app

---

## Summary Checklist

| # | Task | Time | Cost | Status |
|---|---|---|---|---|
| 1 | Run Supabase migration SQL | 5 min | Free | ⬜ |
| 2 | Domain lock on Squarespace | 5 min | Free | ⬜ |
| 3 | Verify WHOIS privacy ON | 3 min | Free | ⬜ |
| 4 | Enable auto-renew | 2 min | Free | ⬜ |
| 5 | 2FA on Squarespace | 10 min | Free | ⬜ |
| 6 | 2FA on Netlify | 5 min | Free | ⬜ |
| 7 | Enable DNSSEC | 10 min | Free | ⬜ |
| 8 | DKIM on Resend | 30 min | Free | ⬜ |
| 9 | SPF record | 10 min | Free | ⬜ |
| 10 | DMARC record | 10 min | Free | ⬜ |
| 11 | Back up keystore to iCloud | 2 min | Free | ⬜ |
| 12 | Run iCloud full sync | 2 min | Free | ⬜ |
| 13 | Trademark — Qatar then WIPO | 1-2 hrs | QAR 1,500 + USD 1,200 | ⬜ |
| 14 | Register soulgainz.com + .co | 5 min | ~$30/yr | ⬜ |
