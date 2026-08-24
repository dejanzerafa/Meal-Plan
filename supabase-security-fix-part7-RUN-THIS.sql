-- supabase-security-fix-part7-RUN-THIS.sql
--
-- This is the last one. Paste the whole file, hit Run.
--
-- It is part 5 section A on its own, with the audit queries stripped out so
-- there is nothing to skip past and nothing to read first.
--
-- WHAT IT DOES
-- Revokes TRUNCATE, TRIGGER and REFERENCES from `anon` and `authenticated` on
-- the 16 remaining objects in `public`. Your survey showed all of them still
-- carrying Supabase's default GRANT ALL. `profiles` and the four views are
-- already done (parts 4 and 6).
--
-- TRUNCATE is the one that matters: row-level security does NOT apply to it, so
-- no policy can stop it. Every table in that list is emptiable in one statement
-- with RLS offering nothing.
--
-- WHAT IT DOES NOT TOUCH
-- SELECT, INSERT, UPDATE and DELETE are left exactly as they are. The app really
-- does delete from promo_codes, user_supplements, meal_logs, favourites and
-- cooked_it, and those paths keep working. Nothing in the app or the 26 Netlify
-- functions uses TRUNCATE, TRIGGER or REFERENCES.

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
  end loop;
end $$;


-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- This is the last statement, so its result is what the editor will show you.
-- Expect: "Success. No rows returned".
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee      in ('anon', 'authenticated')
  and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
order by table_name, grantee, privilege_type;
