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
    headers := '{"Content-Type": "application/json", "x-cron-secret": "7ebd7dfdd456b0413fd959ec4d5bc2b5ce94da083f9d49c68bd2888880d27a20"}'::jsonb,
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
    headers := '{"Content-Type": "application/json", "x-cron-secret": "7ebd7dfdd456b0413fd959ec4d5bc2b5ce94da083f9d49c68bd2888880d27a20"}'::jsonb,
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
    headers := '{"Content-Type": "application/json", "x-cron-secret": "7ebd7dfdd456b0413fd959ec4d5bc2b5ce94da083f9d49c68bd2888880d27a20"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- ── Verify jobs were created ──────────────────────────────────────────────
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;

-- ── To manually test a function immediately (optional) ───────────────────
-- SELECT net.http_post(
--   url     := 'https://rjreunvnsfjclpighogp.supabase.co/functions/v1/birthday-emails',
--   headers := '{"Content-Type": "application/json", "x-cron-secret": "7ebd7dfdd456b0413fd959ec4d5bc2b5ce94da083f9d49c68bd2888880d27a20"}'::jsonb,
--   body    := '{}'::jsonb
-- );

-- ── To check cron run history ─────────────────────────────────────────────
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
