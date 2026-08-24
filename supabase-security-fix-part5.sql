-- supabase-security-fix-part5.sql
-- Run in the Supabase SQL editor. Section A is the cleanup; section B is a
-- check that matters more than the cleanup does — read its note before running.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- CONTEXT
-- ─────────────────────────────────────────────────────────────────────────────
-- Your survey returned all 17 remaining objects in `public` with TRUNCATE,
-- TRIGGER and REFERENCES granted to both `anon` and `authenticated`. That is
-- Supabase's default GRANT ALL, untouched since the project was created.
-- `profiles` is correctly absent — part 4 already cleaned it.
--
-- TRUNCATE is the one that actually matters: **row-level security does not
-- apply to TRUNCATE**, so no policy anywhere can stop it. `subscriptions`,
-- `users`, `redemptions` and `meal_logs` are all emptiable in one statement
-- with RLS offering nothing.
--
-- Four of the 17 are views, not tables — active_members, lapsed_members,
-- broadcast_audience, user_overview. A loop over `pg_tables` silently skips
-- views, so this one is driven by the grants themselves and covers both.

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION A — revoke the three unused privileges, everywhere they appear.
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT, INSERT, UPDATE and DELETE are deliberately untouched: the app really
-- does delete from promo_codes, user_supplements, meal_logs, favourites and
-- cooked_it, and those paths must keep working.
do $$
declare
  r record;
begin
  for r in
    select distinct table_name
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated')
      and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
  loop
    execute format(
      'revoke truncate, trigger, references on public.%I from anon, authenticated',
      r.table_name
    );
    raise notice 'revoked truncate/trigger/references on %', r.table_name;
  end loop;
end $$;

-- VERIFY — expect ZERO rows.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee      in ('anon', 'authenticated')
  and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
order by table_name, grantee, privilege_type;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION B — RUN THIS SEPARATELY. It is the more important question.
-- ─────────────────────────────────────────────────────────────────────────────
-- TRUNCATE needs someone to get SQL execution as anon/authenticated, which
-- PostgREST does not give them. It is defence in depth.
--
-- SELECT does not need that. PostgREST exposes it directly at
-- /rest/v1/<table>, using the anon key that is published in the app — so for
-- any table with SELECT granted and RLS **disabled**, anyone with that key can
-- read every row. That list includes `users`, `subscriptions`, `redemptions`,
-- `feedback`, `waitlist` and `email_signups`: names, emails, tiers, payment
-- history, and everyone who ever joined the waitlist.
--
-- Views are the sharp edge here. A view does NOT inherit the RLS of the tables
-- it reads. `user_overview`, `active_members`, `lapsed_members` and
-- `broadcast_audience` sound exactly like joins over users/profiles/
-- subscriptions — if they are SELECT-able by anon, they can expose the very
-- rows the base tables' policies protect.
--
-- Expect: rls_enabled = true on every TABLE that holds user data.
select
  c.relname                                as object_name,
  case c.relkind when 'r' then 'table' when 'v' then 'view' when 'm' then 'matview' else c.relkind::text end as kind,
  c.relrowsecurity                         as rls_enabled,
  c.relforcerowsecurity                    as rls_forced,
  (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as policy_count,
  bool_or(g.grantee = 'anon')              as anon_can_select,
  bool_or(g.grantee = 'authenticated')     as auth_can_select
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join information_schema.role_table_grants g
  on g.table_schema = 'public'
 and g.table_name   = c.relname
 and g.privilege_type = 'SELECT'
 and g.grantee in ('anon', 'authenticated')
where n.nspname = 'public'
  and c.relkind in ('r', 'v', 'm')
group by c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity
order by
  -- worst first: readable by anon, no RLS
  (bool_or(g.grantee = 'anon') and not c.relrowsecurity) desc,
  c.relname;

-- Send me that output before changing anything in section B. Turning RLS on
-- without the right policies locks the app out of its own data, and the fix
-- differs per table: some need a policy, some should simply have SELECT revoked
-- from anon, and the views may be better dropped or recreated with
-- security_invoker = on (Postgres 15+), which makes them respect the caller's
-- RLS instead of the view owner's.
