-- ⚠️  SECURITY: this file previously contained the live CRON_SECRET in plain text,
-- in four places, in a tracked file — and `publish = "."` in netlify.toml meant it
-- was served at https://soulgainz.app/supabase/cron-jobs.sql to anyone who asked.
-- Anyone could fetch it and then invoke birthday-emails, holiday-emails and
-- renewal-reminder at will: mass mail from your domain, on demand, burning the
-- Resend quota and the sending reputation.
--
-- REQUIRED ACTIONS, in order:
--   1. Rotate CRON_SECRET in Supabase (Settings -> Edge Functions -> Secrets)
--      and in Netlify env. The old value must be treated as compromised.
--   2. supabase/ is now in .netlifyignore so this is no longer served.
--   3. The old value REMAINS IN GIT HISTORY. Rotating is what actually fixes it;
--      scrubbing history is optional and does not substitute for rotation.

-- ============================================================
-- SoulGainz — Supabase Cron Jobs
-- Schedules the 3 Edge Functions that previously ran on Netlify.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- Prerequisites:
--   1. pg_cron and pg_net extensions must be enabled
--      Dashboard → Database → Extensions → enable pg_cron and pg_net
--   2. Edge Functions must be deployed first:
--      supabase functions deploy birthday-emails
--      supabase functions deploy holiday-emails
--      supabase functions deploy renewal-reminder
--   3. Set CRON_SECRET env var in both:
--      - Supabase: Dashboard → Settings → Edge Functions → Secrets
--      - (same value used in all 3 functions)
--   4. Update rjreunvnsfjclpighogp below with your Supabase project ref
--      (find it in: Dashboard → Settings → General → Reference ID)
-- ============================================================

-- Enable required extensions (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- Replace these two values before running:
-- ============================================================
-- rjreunvnsfjclpighogp  → e.g. abcdefghijklmnop
-- YOUR_CRON_SECRET  → same value as CRON_SECRET env var
-- ============================================================

-- Remove existing jobs if re-running this script
SELECT cron.unschedule('birthday-emails')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'birthday-emails');
SELECT cron.unschedule('holiday-emails')    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'holiday-emails');
SELECT cron.unschedule('renewal-reminder')  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'renewal-reminder');

-- ── Birthday emails: daily at 08:00 UTC ──────────────────────────────────
SELECT cron.schedule(
  'birthday-emails',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://rjreunvnsfjclpighogp.supabase.co/functions/v1/birthday-emails',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "REPLACE_WITH_CRON_SECRET_FROM_SUPABASE_VAULT"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- ── Holiday emails: daily at 07:00 UTC ───────────────────────────────────
SELECT cron.schedule(
  'holiday-emails',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://rjreunvnsfjclpighogp.supabase.co/functions/v1/holiday-emails',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "REPLACE_WITH_CRON_SECRET_FROM_SUPABASE_VAULT"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- ── Renewal reminders: daily at 09:00 UTC ────────────────────────────────
SELECT cron.schedule(
  'renewal-reminder',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://rjreunvnsfjclpighogp.supabase.co/functions/v1/renewal-reminder',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "REPLACE_WITH_CRON_SECRET_FROM_SUPABASE_VAULT"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- ── Verify jobs were created ──────────────────────────────────────────────
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;

-- ── To manually test a function immediately (optional) ───────────────────
-- SELECT net.http_post(
--   url     := 'https://rjreunvnsfjclpighogp.supabase.co/functions/v1/birthday-emails',
--   headers := '{"Content-Type": "application/json", "x-cron-secret": "REPLACE_WITH_CRON_SECRET_FROM_SUPABASE_VAULT"}'::jsonb,
--   body    := '{}'::jsonb
-- );

-- ── To check cron run history ─────────────────────────────────────────────
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
