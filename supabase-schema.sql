-- ═══════════════════════════════════════════════════════════════════
-- MEAL PREP — SUPABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════
-- Paste this entire file into Supabase SQL Editor and click "Run".
-- Idempotent — safe to re-run if you need to update.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. USERS ────────────────────────────────────────────────────────
-- One row per paying customer (email is identity).
CREATE TABLE IF NOT EXISTS users (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 text UNIQUE NOT NULL,
  stripe_customer_id    text UNIQUE,
  first_name            text,
  last_name             text,
  marketing_opt_in      boolean DEFAULT true,
  welcome_sent          boolean DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);


-- ── 2. SUBSCRIPTIONS ────────────────────────────────────────────────
-- Each paid tier (lifetime, quarterly, monthly, calculator).
-- Lifetime + calculator are one-time but stored here for unified history.
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id   text UNIQUE,
  stripe_session_id        text UNIQUE,
  tier                     text CHECK (tier IN ('lifetime','quarterly','monthly','calculator')) NOT NULL,
  status                   text CHECK (status IN ('active','cancelled','past_due','trialing','expired')) DEFAULT 'active',
  current_period_start     timestamptz,
  current_period_end       timestamptz,  -- NULL = lifetime
  cancel_at_period_end     boolean DEFAULT false,
  amount_paid              numeric(10,2),
  created_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subs_user      ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_status    ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subs_period    ON subscriptions(current_period_end);


-- ── 3. RECIPE UNLOCKS ────────────────────────────────────────────────
-- Per-recipe purchases ($1.99 each).
CREATE TABLE IF NOT EXISTS recipe_unlocks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id            text NOT NULL,
  stripe_session_id    text UNIQUE,
  amount_paid          numeric(10,2),
  created_at           timestamptz DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_unlocks_user    ON recipe_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_recipe  ON recipe_unlocks(recipe_id);


-- ── 4. EMAIL SIGNUPS ─────────────────────────────────────────────────
-- Landing page captures (no payment yet). Source tracking lets you
-- compare conversion by placement (hero vs footer vs paid ad campaign).
CREATE TABLE IF NOT EXISTS email_signups (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                text UNIQUE NOT NULL,
  source               text DEFAULT 'landing-page',
  converted_at         timestamptz,  -- when they upgraded to paying user
  user_id              uuid REFERENCES users(id),
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signups_email     ON email_signups(email);
CREATE INDEX IF NOT EXISTS idx_signups_source    ON email_signups(source);
CREATE INDEX IF NOT EXISTS idx_signups_converted ON email_signups(converted_at);


-- ── 5. EVENTS ────────────────────────────────────────────────────────
-- Activity log for analytics + behavioural emails.
CREATE TABLE IF NOT EXISTS events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  event_type    text NOT NULL,
  metadata      jsonb,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user  ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type  ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_date  ON events(created_at);


-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════
-- Enable RLS on all tables. The anon key (used client-side) gets
-- read-only access where appropriate. Service-role key (server-side
-- in Netlify Functions) bypasses RLS entirely.

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_unlocks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_signups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;

-- Default deny-all (RLS denies by default with no policies)
-- All access goes through service_role key in backend functions.

-- Allow public to insert email signups (so a frontend form COULD post
-- directly if needed). The Netlify function can also do this.
CREATE POLICY "Allow public email signup"
  ON email_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════
-- USEFUL VIEWS (optional but handy)
-- ═══════════════════════════════════════════════════════════════════

-- Active paying members (for sending broadcasts to subscribers)
CREATE OR REPLACE VIEW active_members AS
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  s.tier,
  s.current_period_end,
  s.created_at AS subscribed_at
FROM users u
JOIN subscriptions s ON s.user_id = u.id
WHERE s.status = 'active'
  AND (s.current_period_end IS NULL OR s.current_period_end > now())
  AND s.tier IN ('lifetime','quarterly','monthly')
  AND u.marketing_opt_in = true;


-- Lapsed users (subscription ended) — for win-back campaigns
CREATE OR REPLACE VIEW lapsed_members AS
SELECT
  u.id,
  u.email,
  u.first_name,
  s.tier AS last_tier,
  s.current_period_end AS lapsed_at
FROM users u
JOIN subscriptions s ON s.user_id = u.id
WHERE s.status IN ('cancelled','expired','past_due')
  AND u.marketing_opt_in = true;


-- All emails for broadcast (signups + customers, deduplicated)
CREATE OR REPLACE VIEW broadcast_audience AS
SELECT email, 'paying' AS segment, first_name FROM users WHERE marketing_opt_in = true
UNION
SELECT es.email, 'lead' AS segment, NULL AS first_name
FROM email_signups es
LEFT JOIN users u ON u.email = es.email
WHERE u.id IS NULL;


-- ═══════════════════════════════════════════════════════════════════
-- TEST QUERY — paste this after creation to verify it worked
-- ═══════════════════════════════════════════════════════════════════
-- SELECT
--   (SELECT count(*) FROM users)          AS total_users,
--   (SELECT count(*) FROM subscriptions)  AS total_subs,
--   (SELECT count(*) FROM recipe_unlocks) AS total_recipe_purchases,
--   (SELECT count(*) FROM email_signups)  AS total_leads;
