-- supabase-security-fix-part9-SECTION-B-ONLY.sql
--
-- Section B of part 9, on its own. Paste the whole file, hit Run.
--
-- Safe to run twice. If Section B already ran, this changes nothing and the
-- verify at the bottom still returns zero rows.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES
-- ─────────────────────────────────────────────────────────────────────────────
-- Revokes anon and authenticated access on the seven tables that still carried
-- full SELECT/INSERT/UPDATE/DELETE, and enables RLS on each.
--
--     users              email, first/last name, DATE OF BIRTH, stripe_customer_id
--     subscriptions      who pays, which tier, how much, renewal dates
--     events             behavioural log, each row carrying an email address
--     feedback           free-text messages + email + device
--     email_signups      addresses
--     calc_email_sends   addresses
--     birthday_codes     issued discount codes
--
-- Your Section A result showed RLS was already ON for all of them with zero
-- policies, which denies by default — so nothing was actually exposed. Good.
-- This closes the grants anyway, because "RLS on with no policy" is one
-- accidental permissive policy away from being open, and that is exactly how
-- the waitlist table got exposed.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY IT IS SAFE — verified against the code, not assumed
-- ─────────────────────────────────────────────────────────────────────────────
--   - index.html references NONE of these seven. Zero .from("users"),
--     .from("events") etc, and zero /rest/v1/<table> fetches. The client only
--     touches profiles, meal_logs, favourites, cooked_it, user_supplements and
--     promo_codes.
--   - Every Netlify function that writes them — track-event.js, waitlist.js,
--     send-feedback.js, save-user.js, stripe-webhook.js — uses
--     SUPABASE_SERVICE_KEY, which bypasses grants AND RLS entirely.
--
-- Nothing in the product loses access.

do $$
declare
  t text;
  targets text[] := array[
    'users','subscriptions','events','feedback',
    'email_signups','calc_email_sends','birthday_codes'
  ];
begin
  foreach t in array targets loop
    if exists (select 1 from pg_class
               where relname = t and relnamespace = 'public'::regnamespace) then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on public.%I from anon, authenticated', t);
      raise notice 'locked: %', t;
    else
      raise notice 'skipped (does not exist): %', t;
    end if;
  end loop;
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY — last statement, so this is the result you will see.
-- Expect: "Success. No rows returned."
-- Any row here is a table still reachable with the public anon key.
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
  and t.table_name in ('users','subscriptions','events','feedback','waitlist',
                       'email_signups','calc_email_sends','birthday_codes')
order by t.table_name, g.grantee, g.privilege_type;
