-- supabase-security-fix-part4.sql
-- RUN AFTER part 3. Takes a few seconds.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY — from your part 3 verification output
-- ─────────────────────────────────────────────────────────────────────────────
-- Part 3 worked: INSERT and UPDATE no longer appear for `anon` or
-- `authenticated`. But the same query showed these still granted on
-- public.profiles, to BOTH roles:
--
--     DELETE, TRUNCATE, REFERENCES, TRIGGER
--
-- DELETE is currently contained: there is no DELETE policy on profiles, and RLS
-- denies by default, so it fails. That is one policy away from not being true,
-- and nothing in the app deletes a profile from the client (verified — the app
-- only deletes from promo_codes, user_supplements, meal_logs, favourites and
-- cooked_it; the profile deletes in netlify/functions run under the service key,
-- which these grants do not affect).
--
-- TRUNCATE is the one that matters: **row-level security does not apply to
-- TRUNCATE**. A policy cannot restrict it. Anyone able to issue TRUNCATE as
-- `authenticated` or `anon` empties the entire profiles table — every user's
-- targets, body stats and tier, gone, with RLS offering no protection at all.
--
-- TRIGGER lets a role attach a trigger function to the table. REFERENCES lets a
-- role point a foreign key at it, which can then block deletes elsewhere.
-- Neither is needed by the app.
--
-- None of these are reachable through PostgREST today, so this is defence in
-- depth rather than an open door. It costs nothing to close.

begin;

revoke delete, truncate, references, trigger on public.profiles from authenticated;
revoke delete, truncate, references, trigger on public.profiles from anon;

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY — run this on its own afterwards.
-- ─────────────────────────────────────────────────────────────────────────────
-- Expect exactly TWO rows, both SELECT:
--     anon           | SELECT
--     authenticated  | SELECT
--
-- SELECT stays because the app must read your own profile; the
-- `profiles_select_own` policy restricts that to auth.uid() = id.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name   = 'profiles'
  and grantee      in ('authenticated', 'anon')
order by grantee, privilege_type;


-- ─────────────────────────────────────────────────────────────────────────────
-- ALSO RUN THIS — part 3's first query, on its own.
-- ─────────────────────────────────────────────────────────────────────────────
-- The Supabase editor only shows the result of the LAST statement, so when you
-- ran part 3 this one scrolled past unseen. It is the single most important
-- check of the whole exercise.
--
-- Expect ZERO rows. Any row here is a column a signed-in user can still write to
-- give themselves a paid tier or admin rights.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name   = 'profiles'
  and grantee      in ('authenticated', 'anon')
  and column_name  in ('tier', 'tier_via', 'tier_label', 'tier_expires', 'is_admin')
order by grantee, column_name;


-- ─────────────────────────────────────────────────────────────────────────────
-- WORTH CHECKING — the same TRUNCATE exposure on your other tables.
-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase's default GRANT ALL applies to every table in `public`, so the tables
-- below very likely have the same TRUNCATE grant. RLS cannot protect any of
-- them from it.
--
-- Review the output before acting: the app DOES legitimately delete from
-- promo_codes, user_supplements, meal_logs, favourites and cooked_it, so revoke
-- TRUNCATE from those but leave their DELETE alone.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee      in ('authenticated', 'anon')
  and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
order by table_name, grantee, privilege_type;

-- Once you have seen that list and are happy, this revokes TRUNCATE (and the two
-- unused privileges) across every table in public, from both roles, without
-- touching SELECT/INSERT/UPDATE/DELETE:
--
--   do $$
--   declare t record;
--   begin
--     for t in select tablename from pg_tables where schemaname = 'public' loop
--       execute format('revoke truncate, trigger, references on public.%I from authenticated, anon', t.tablename);
--     end loop;
--   end $$;
