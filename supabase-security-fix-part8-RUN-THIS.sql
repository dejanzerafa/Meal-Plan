-- supabase-security-fix-part8-RUN-THIS.sql
--
-- Paste the whole file into the Supabase SQL editor and hit Run.
--
-- Two problems, one of which is a live personal-data exposure.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. THE WAITLIST IS PUBLICLY READABLE AND WRITABLE RIGHT NOW
-- ─────────────────────────────────────────────────────────────────────────────
-- supabase/waitlist_table.sql created this:
--
--     create policy "service_role full access" on public.waitlist
--       for all using (true) with check (true);
--
-- There is no `TO service_role` clause, so the policy applies to **PUBLIC** —
-- which includes `anon`. And Supabase's default GRANT ALL on the table was never
-- revoked. So with the anon key that is published in index.html, on every user's
-- phone, anyone can run:
--
--     GET    /rest/v1/waitlist?select=*     -> every pre-launch email and name
--     DELETE /rest/v1/waitlist?id=neq.0     -> deletes the entire list
--
-- The file's own comment three lines below the policy says "No public read access
-- (keep emails private)". The policy grants exactly the opposite.
--
-- Why the earlier audits missed it: part 6 checked whether each table had RLS
-- enabled and at least one policy. This table has both. It does not check whether
-- the policy is RESTRICTIVE, and `using (true)` is not.
--
-- The service role bypasses RLS entirely, so the Netlify functions never needed
-- this policy. Dropping it costs nothing.

begin;

drop policy if exists "service_role full access" on public.waitlist;

-- Belt and braces: remove the default grants too, so the table is unreachable
-- through PostgREST even if a permissive policy is ever added again.
revoke all on public.waitlist from anon, authenticated;

commit;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. THE NEXT TABLE YOU CREATE WILL HAVE THE SAME HOLE
-- ─────────────────────────────────────────────────────────────────────────────
-- Nothing in parts 1-7 changed Supabase's DEFAULT privileges. Each part revoked
-- grants on the objects that existed on the day it ran. The defaults are still
-- armed, so every future `create table` and `create view` in `public` is born
-- with GRANT ALL to anon and authenticated — which is precisely how the waitlist
-- table and the four analytics views got exposed in the first place.
--
-- This makes the safe state the default. After it, a new table is unreachable
-- until you deliberately grant access to it.

alter default privileges in schema public
  revoke all on tables    from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges in schema public
  revoke all on functions from anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY — this is the last statement, so its result is what you will see.
-- Expect ZERO rows. Any row is a table still reachable with the anon key.
-- ─────────────────────────────────────────────────────────────────────────────
select
  t.table_name,
  g.grantee,
  g.privilege_type
from information_schema.tables t
join information_schema.role_table_grants g
  on g.table_name = t.table_name and g.table_schema = t.table_schema
where t.table_schema = 'public'
  and g.grantee in ('anon', 'authenticated')
  and t.table_name in ('waitlist', 'events', 'feedback', 'users', 'subscriptions',
                       'birthday_codes', 'calc_email_sends', 'email_signups')
order by t.table_name, g.grantee, g.privilege_type;


-- ─────────────────────────────────────────────────────────────────────────────
-- SEPARATELY — CHECK `events` BY HAND. It may never have had RLS at all.
-- ─────────────────────────────────────────────────────────────────────────────
-- There are two different definitions of `events` in this repo. analytics.sql
-- creates it with the shape track-event.js actually writes (session_id, email,
-- event_name, properties) and gives it NO RLS and NO policy. supabase-schema.sql
-- creates a different one WITH a policy. Which one is live depends on which file
-- was run, and that determines whether every event row — each carrying an email
-- address — is readable with the anon key.
--
-- Run this and read the result:
--
--     select relname, relrowsecurity as rls_on
--     from pg_class
--     where relname = 'events' and relnamespace = 'public'::regnamespace;
--
-- If rls_on is false:
--
--     alter table public.events enable row level security;
--     revoke all on public.events from anon, authenticated;
--
-- The Netlify function writes with the service key, so it keeps working.


-- ─────────────────────────────────────────────────────────────────────────────
-- AND ROTATE THE CRON SECRET — this is not optional
-- ─────────────────────────────────────────────────────────────────────────────
-- supabase/cron-jobs.sql held the live CRON_SECRET in plain text, in four places,
-- in a tracked file. netlify.toml has `publish = "."`, and .netlifyignore did not
-- exclude the supabase directory — so it was being served at
-- https://soulgainz.app/supabase/cron-jobs.sql to anyone who asked for it.
--
-- With it, anyone could invoke birthday-emails, holiday-emails and
-- renewal-reminder on demand: mass mail from your domain, burning the Resend
-- quota and the sending reputation, and minting Stripe promotion codes.
--
-- The file is now redacted and the directory is excluded from the deploy, but the
-- old value is in the git history and must be treated as compromised.
--
--   1. Generate a new secret.
--   2. Update it in Supabase (Settings -> Edge Functions -> Secrets) and in the
--      Netlify environment variables.
--   3. Re-create the cron jobs with the new value.
