# Meal Prep — Database & Email Architecture

A clear, phased plan for building the customer database, email automation, and payment infrastructure without overengineering early.

---

## Phase 1 — Right Now (free, ~10 min setup)

You already have email capture on the landing page (Netlify Forms). That's enough to start.

### What's already working

- **Email capture form** on landing page footer (`#signup` section)
- **Netlify Forms** captures every signup → visible in Netlify dashboard
- **Honeypot anti-spam** field included
- **Source tracking** (`landing-footer`) so you know where signups came from
- **Free tier limit:** 100 submissions/month, then $19/mo for higher tier

### How to access captured emails

1. Log into **app.netlify.com** → your site → **Forms** tab
2. See every submission, export to CSV anytime
3. No additional setup needed

### Limitations

- No automated emails yet (you'd manually export and import to a sender)
- No payment data linked (Stripe not live yet)
- No user accounts (no login system)

This is fine for the first 50–100 signups. Don't overbuild.

---

## Phase 2 — When You Have First Revenue (~$50/month total)

Once Stripe is live and you have 5+ paying customers, upgrade to a proper stack.

### Recommended stack

| Component | Tool | Free tier | Notes |
|-----------|------|-----------|-------|
| **Database** | [Supabase](https://supabase.com) | 500MB, 50k MAU | PostgreSQL + auth + realtime |
| **Auth** | Supabase Auth | Included | Email/password, magic links, OAuth |
| **Email service** | [Resend](https://resend.com) | 3,000/mo, 100/day | Best DX, transactional + marketing |
| **Payments** | Stripe | Pay-per-tx | Already planned |
| **Server logic** | Netlify Functions | 125k/mo | Already on Netlify |
| **Marketing emails** | [MailerLite](https://mailerlite.com) | 1,000 contacts | If you need campaigns |

Total cost at this scale: **$0** until you exceed free tiers.

### Database schema (PostgreSQL via Supabase)

```sql
-- USERS — every account holder
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  first_name    text,
  last_name     text,
  email_verified boolean DEFAULT false,
  marketing_opt_in boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- PROFILES — macro calculator data
CREATE TABLE profiles (
  user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dob           date,
  gender        text CHECK (gender IN ('male','female','other')),
  height_cm     int,
  weight_kg     numeric(5,2),
  job           text,
  steps         text,
  training      text,
  goal          text CHECK (goal IN ('lose','maintain','gain')),
  bmr           int,
  tdee          int,
  target_kcal   int,
  target_p      int,
  target_c      int,
  target_f      int,
  updated_at    timestamptz DEFAULT now()
);

-- SUBSCRIPTIONS — Stripe sync via webhooks
CREATE TABLE subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id     text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id        text,
  plan_type              text CHECK (plan_type IN ('lifetime','annual','monthly','calculator')),
  status                 text CHECK (status IN ('active','cancelled','past_due','trialing')),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean DEFAULT false,
  created_at             timestamptz DEFAULT now()
);

-- EMAIL_SIGNUPS — landing page captures (no account)
CREATE TABLE email_signups (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text UNIQUE NOT NULL,
  source             text DEFAULT 'landing-page',
  converted_to_user  boolean DEFAULT false,
  user_id            uuid REFERENCES users(id),
  created_at         timestamptz DEFAULT now()
);

-- EVENTS — activity log for marketing intelligence
CREATE TABLE events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id),
  event_type  text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_type    ON events(event_type);
```

### Event types to track

| Event | When | Why |
|-------|------|-----|
| `signup` | User creates account | Conversion tracking |
| `email_captured` | Lead magnet form | Top of funnel |
| `recipe_viewed` | Opens a recipe | Engagement |
| `meal_set` | Picks lunch/dinner | Active user signal |
| `calc_used` | Saves macro profile | Premium feature usage |
| `payment_succeeded` | Stripe webhook | Revenue tracking |
| `payment_failed` | Stripe webhook | Trigger reminder email |
| `subscription_cancelled` | Stripe webhook | Churn analysis |

---

## Phase 3 — Email Automation (when you have 100+ users)

Wire automated emails via Resend triggered by events.

### Email types

| Email | Trigger | Content |
|-------|---------|---------|
| **Welcome** | New signup | "Thanks for joining — here's how to start" + free recipe |
| **Profile reminder** | 3 days, no profile | "Get your personalised macros — calculator is ready" |
| **Payment receipt** | `payment_succeeded` | Standard receipt with invoice link |
| **Payment retry** | `payment_failed` | "Update your card to keep access" |
| **Trial ending** | 2 days before period end | "Your subscription renews in 2 days" |
| **Cancellation save** | `subscription_cancelled` | "We're sad to see you go — special offer" |
| **Recipe drop** | New recipe added | "We just added X — check it out" |
| **Reactivation** | Lapsed 30+ days | "Come back — 50% off" |

### Implementation pattern

Each email is a Netlify Function triggered by:
1. **Stripe webhook** (payment events)
2. **Supabase database trigger** (signup, profile saved)
3. **Scheduled cron** (Netlify Scheduled Functions — daily check for trial-ending users)

Example function structure:
```
/.netlify/functions/
  ├── stripe-webhook.ts      ← receives payment events
  ├── supabase-webhook.ts    ← receives DB events
  ├── send-welcome.ts        ← email template + Resend send
  ├── send-receipt.ts        ← payment receipt
  ├── daily-trial-check.ts   ← cron job for trial reminders
  └── unsubscribe.ts         ← GDPR-compliant opt-out
```

---

## Phase 4 — Marketing Layer (200+ users)

When you want to send broadcasts ("New recipe! 30% off this week!"):

- **MailerLite** ($10/mo for 500 contacts) — best UX, drag-drop campaigns
- **Klaviyo** ($45/mo for 500) — best segmentation, e-commerce focus
- **Beehiiv** ($0–39/mo) — best for newsletter/content marketing

These plug into Supabase via API: pull users → segment → send campaign → track opens/clicks → write back to events table.

---

## Stripe Customer ↔ Database flow

```
┌─────────────┐     stripe.customers.create()      ┌─────────────┐
│   App UI    │ ─────────────────────────────────→ │   Stripe    │
└─────────────┘                                    └──────┬──────┘
                                                          │
                                          webhook         │
                                    customer.subscription │
                                          .created        │
                                                          ↓
                                                   ┌─────────────┐
                                                   │  Netlify Fn │
                                                   └──────┬──────┘
                                                          │
                                                INSERT INTO
                                                          ↓
                                                   ┌─────────────┐
                                                   │  Supabase   │
                                                   │  users      │
                                                   │  subs       │
                                                   │  events     │
                                                   └──────┬──────┘
                                                          │
                                                trigger send
                                                          ↓
                                                   ┌─────────────┐
                                                   │   Resend    │
                                                   │  (welcome)  │
                                                   └─────────────┘
```

---

## What to do right now

1. **Deploy the email capture form** (already built) → Netlify auto-detects it on next deploy
2. **Wait for first 20 signups** to validate demand
3. **Set up Stripe** (your other in-progress task)
4. **Then** wire Supabase + Resend in Phase 2

Don't build Phase 2 before you have signups. Don't build Phase 3 before you have paying users. Don't build Phase 4 before you've sent 5+ manual emails to validate that audience.

---

## Cost projection by user count

| Users | Stack | Monthly cost |
|-------|-------|--------------|
| 0–100 | Netlify Forms only | **$0** |
| 100–1,000 | Supabase + Resend free | **$0** |
| 1,000–5,000 | Supabase Pro + Resend Pro | **~$45/mo** |
| 5,000–10,000 | + MailerLite | **~$75/mo** |
| 10,000+ | Custom evaluation | varies |

You should be at $200–500/mo gross revenue before paying $45/mo for infrastructure.
