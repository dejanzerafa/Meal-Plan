-- supabase/cron-jobs.sql
-- Schedules the three email functions with pg_cron. Run in the Supabase SQL editor.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- HISTORY — why this file looks the way it does
-- ─────────────────────────────────────────────────────────────────────────────
-- This file once carried the live CRON_SECRET in plain text, in four places, and
-- was served at soulgainz.app/supabase/cron-jobs.sql. That value is compromised
-- and remains in git history; rotating it is the fix (see the scheduled
-- rotate-cron-secret task). The rewrite after that replaced the literal with the
-- placeholder REPLACE_WITH_CRON_SECRET_FROM_SUPABASE_VAULT — and, applied as-is,
-- every job 401'd daily, silently, which looked exactly like the emails having
-- stopped. It also targeted Supabase Edge Function copies of the three functions,
-- which were never deployed.
--
-- NOW:
--   • The secret lives in Supabase Vault and is read at run time. This file
--     never contains it and can be committed.
--   • The jobs call the NETLIFY functions that are actually deployed, with
--     Authorization: Bearer <secret>, which is the gate those functions accept.
--   • Nothing here requires the Pro plan; pg_cron and pg_net are free-tier.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- ONE-TIME SETUP (do these BEFORE running the rest of this file)
-- ─────────────────────────────────────────────────────────────────────────────
--   1. Rotate CRON_SECRET: generate a new value (e.g. `openssl rand -hex 32`),
--      set it in Netlify → app site → Environment variables → CRON_SECRET, and
--      redeploy the app site.
--   2. Put the SAME value in Vault — run this ONCE, in its own query, then
--      clear the editor so the value is not saved in query history:
--
--        select vault.create_secret('<paste the new CRON_SECRET here>', 'cron_secret');
--
--      To rotate later:  select vault.update_secret(
--                          (select id from vault.secrets where name = 'cron_secret'),
--                          '<new value>');
--   3. Extensions: Dashboard → Database → Extensions → enable pg_cron and pg_net
--      (or the two lines below).
--
-- Then paste everything below and Run.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Refuse to schedule anything until the secret exists. A missing secret would
-- schedule three jobs that 401 forever — the exact failure this file used to have.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    raise exception 'vault secret "cron_secret" not found — do the ONE-TIME SETUP at the top of this file first';
  end if;
end $$;

-- A helper so each job is one line and the header logic lives in one place.
create or replace function public.sg_cron_call(fn_name text)
returns bigint
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  secret text;
  req    bigint;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'cron_secret';
  if secret is null then raise exception 'cron_secret missing from vault'; end if;
  select net.http_post(
    url     := 'https://soulgainz.app/.netlify/functions/' || fn_name,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret),
    body    := '{}'::jsonb,
    timeout_milliseconds := 25000
  ) into req;
  return req;
end;
$$;

-- Lock the helper down: only the cron runner (postgres) may call it. Without
-- this, anyone with a connection could fire mass mail from support@.
revoke all on function public.sg_cron_call(text) from public, anon, authenticated;

-- Idempotent re-run: drop what exists.
select cron.unschedule(jobname) from cron.job
 where jobname in ('birthday-emails', 'holiday-emails', 'renewal-reminder');

-- 08:00 UTC = 11:00 Doha. Renewal reminders go first so a customer whose card
-- is about to be charged hears about it before any celebratory mail.
select cron.schedule('renewal-reminder', '0 8 * * *', $$select public.sg_cron_call('renewal-reminder')$$);
select cron.schedule('birthday-emails',  '15 8 * * *', $$select public.sg_cron_call('birthday-emails')$$);
select cron.schedule('holiday-emails',   '30 8 * * *', $$select public.sg_cron_call('holiday-emails')$$);

-- ── Verify ────────────────────────────────────────────────────────────────────
select jobname, schedule, active from cron.job
 where jobname in ('birthday-emails', 'holiday-emails', 'renewal-reminder')
 order by jobname;

-- Run history (after the first firing). status_code 200 = the function accepted
-- the secret. 401 = Vault and Netlify have different values.
--   select j.jobname, r.status, r.start_time, r.return_message
--     from cron.job_run_details r join cron.job j on j.jobid = r.jobid
--    order by r.start_time desc limit 20;
--   select id, status_code, created from net._http_response order by created desc limit 10;
