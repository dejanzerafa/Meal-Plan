# 🚀 Stripe + Supabase + Resend — Deployment Guide

You've now got everything to take payments live. Follow these steps **in order**.

---

## ⏱️ Timeline

| Step | Time | What |
|---|---|---|
| 1 | 5 min | Add files to GitHub repo |
| 2 | 5 min | Run Supabase schema |
| 3 | 5 min | Get remaining secret keys |
| 4 | 10 min | Add Netlify environment variables |
| 5 | 5 min | Deploy + create Stripe webhook |
| 6 | 2 min | Flip the STRIPE_ENABLED flag |
| 7 | 5 min | Test with Stripe test card |

**Total: ~40 minutes to live payments.**

---

## Step 1 — Push files to GitHub

Copy these files into your repo at the paths shown:

```
/index.html              ← upload meal-plan.html as this
/landing.html            ← (unchanged)
/method.html             ← (unchanged)
/terms.html              ← (unchanged)
/privacy.html            ← (unchanged)
/success.html            ← NEW
/sw.js                   ← (unchanged)
/netlify.toml            ← NEW
/package.json            ← NEW
/netlify/functions/create-checkout.js     ← NEW
/netlify/functions/stripe-webhook.js      ← NEW
/netlify/functions/verify-session.js      ← NEW
/netlify/functions/customer-portal.js     ← NEW
/netlify/functions/landing-signup.js      ← NEW
```

After pushing, Netlify will detect the functions and install dependencies automatically (Stripe SDK, Supabase SDK).

---

## Step 2 — Set up Supabase database

1. Go to **app.supabase.com** → your project (rjreunvnsfjclpighogp)
2. Left sidebar → **SQL Editor** → **New query**
3. Open `supabase-schema.sql` from the files I built
4. **Paste the entire contents** into the SQL editor
5. Click **Run**

You should see "Success. No rows returned." 5 tables created: `users`, `subscriptions`, `recipe_unlocks`, `email_signups`, `events` plus 3 useful views.

**Verify it worked:**
```sql
SELECT count(*) FROM users;
-- Should return 0 (empty table)
```

---

## Step 3 — Get the remaining secret keys

### Stripe Secret Key
1. dashboard.stripe.com → **Developers** → **API Keys**
2. Under "Standard keys" → click **Reveal test key** for the secret key
3. Copy it (starts with `sk_test_...`)
4. **Don't share it anywhere** — only goes into Netlify env vars

### Supabase Service Role Key
1. app.supabase.com → your project → **Settings** → **API**
2. Scroll to "Project API keys" section
3. Find **service_role secret** (NOT the anon key — different one)
4. Click reveal and copy
5. **Same — never share it**

### Resend API Key
1. resend.com → log in → **API Keys**
2. **Create API Key** → name it "Meal Prep Production" → select "Full access"
3. Copy the key (starts with `re_...`)

---

## Step 4 — Add Netlify environment variables

1. app.netlify.com → your site → **Site configuration** → **Environment variables**
2. Click **Add a variable** → **Add a single variable** for each of these:

| Key | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` (from Step 3) |
| `STRIPE_WEBHOOK_SECRET` | (skip for now — added in Step 5) |
| `SUPABASE_URL` | `https://rjreunvnsfjclpighogp.supabase.co` |
| `SUPABASE_SERVICE_KEY` | (service_role key from Step 3) |
| `RESEND_API_KEY` | `re_...` (from Step 3) |
| `FROM_EMAIL` | `Meal Prep <onboarding@resend.dev>` (works without domain setup) |
| `APP_URL` | `https://dejan-mealplan.netlify.app` |

3. **Trigger a redeploy** — Deploys → **Trigger deploy** → **Deploy site**

---

## Step 5 — Set up Stripe webhook

This is what tells your app when someone has paid.

1. dashboard.stripe.com → **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://dejan-mealplan.netlify.app/.netlify/functions/stripe-webhook`
3. **Listen to:** Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Click **Add endpoint**
5. Click on the new endpoint → **Reveal** the **Signing secret** (starts with `whsec_...`)
6. Go back to Netlify → environment variables
7. Add `STRIPE_WEBHOOK_SECRET` = that `whsec_...` value
8. **Redeploy again**

---

## Step 6 — Flip the live flag

Open your `index.html` (or `meal-plan.html` source):

Find this line near the top of the `<script type="text/babel">` block:
```js
const STRIPE_ENABLED = false;
```

Change to:
```js
const STRIPE_ENABLED = true;
```

Push to GitHub. Netlify auto-deploys in ~30 seconds.

---

## Step 7 — Test the full flow

Open your live app. Click any locked recipe → "💳 $1.99" button → should redirect to Stripe Checkout.

**Use Stripe's test card:**
- Number: `4242 4242 4242 4242`
- Expiry: any future date (e.g. `12/34`)
- CVC: any 3 digits (e.g. `123`)
- ZIP: any (e.g. `12345`)

After payment:
1. ✅ You should land on `/success.html` with confirmation
2. ✅ Click "Open the App →" — recipe should be unlocked
3. ✅ Check Supabase `users` table — your test email should be there
4. ✅ Check `subscriptions` or `recipe_unlocks` table — payment recorded
5. ✅ Check your email inbox — welcome email should arrive

If anything fails, check **Netlify → Functions → Logs** for error messages.

---

## 🎉 Going Live (when ready)

Once you've tested everything in test mode:

1. Stripe → switch to **Live mode** (toggle top right)
2. **Re-create the same products** in live mode (Stripe doesn't share between modes)
3. Get a **live Webhook signing secret** (different from test mode)
4. Update Netlify env vars with `sk_live_...` and the new `whsec_...`
5. Update `STRIPE_PUBLIC_KEY` in `meal-plan.html` to your `pk_live_...` key
6. Update `STRIPE_PRICES` in `meal-plan.html` with the new live price IDs
7. Push, redeploy

---

## 📊 Database queries you'll use

After the first paying customer, log into Supabase → SQL Editor:

**See total revenue:**
```sql
SELECT SUM(amount_paid) AS revenue, count(*) AS payments
FROM subscriptions WHERE status = 'active';
```

**Active subscribers (for broadcasts):**
```sql
SELECT email, tier, current_period_end FROM active_members ORDER BY subscribed_at DESC;
```

**Email list for marketing broadcast:**
```sql
SELECT email, segment FROM broadcast_audience;
```

**Recent activity:**
```sql
SELECT * FROM events ORDER BY created_at DESC LIMIT 50;
```

---

## 🚨 Troubleshooting

**"Checkout creation failed":**
- `STRIPE_SECRET_KEY` not set in Netlify env vars
- Or wrong format (must start with `sk_test_` or `sk_live_`)

**Webhook events not arriving:**
- Stripe → Webhooks → click endpoint → **Recent attempts** tab
- Check the response code; if 400 = signature wrong = `STRIPE_WEBHOOK_SECRET` mismatch

**Supabase rows not appearing:**
- Service-role key wrong (check spelling)
- Or RLS blocking — but service role bypasses RLS, so unlikely

**Emails not sending:**
- `RESEND_API_KEY` not set or invalid
- Free tier limits: 3,000/month, 100/day
- For custom from-domain, verify DNS in resend.com → Domains

---

## 📩 Sending broadcasts (manual for now)

When you want to email all your subscribers about a new recipe drop or seasonal special:

1. Supabase SQL Editor:
   ```sql
   SELECT email FROM active_members;
   ```
2. Click **Download CSV**
3. resend.com → **Audiences** → create one, paste emails
4. Click **Broadcasts** → write your message → send

For automation later, we'll integrate **MailerLite** or **Beehiiv** when you have 100+ subscribers.
