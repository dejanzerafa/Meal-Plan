-- supabase-security-fix-part9-RUN-THIS.sql
--
-- Paste the whole file, hit Run. Takes a second.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT YOUR PART 8 RESULT SHOWED
-- ─────────────────────────────────────────────────────────────────────────────
-- `waitlist` is gone from the list, so part 8 closed that one. Good.
--
-- But seven tables still carry SELECT, INSERT, UPDATE and DELETE for both `anon`
-- and `authenticated`:
--
--     users              email, first/last name, DATE OF BIRTH, stripe_customer_id,
--                        marketing_opt_in, push_subscription
--     subscriptions      who pays, which tier, how much, renewal dates
--     events             behavioural log, each row carrying an email address
--     feedback           free-text messages + email + device
--     email_signups      addresses
--     calc_email_sends   addresses
--     birthday_codes     issued discount codes
--
-- `anon` is the key published in index.html, on every user's phone, in view-source.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- IS IT ACTUALLY EXPLOITABLE? IT DEPENDS ON RLS, AND THAT IS THE PART TO CHECK
-- ─────────────────────────────────────────────────────────────────────────────
-- Grants and row-level security are two independent layers. PostgREST needs the
-- grant to reach the table at all, and then RLS decides which rows come back.
--
--   RLS ON  + no permissive policy  ->  the grant is harmless, reads return zero
--                                        rows. Ugly, not a breach.
--   RLS OFF + this grant            ->  every row is readable with the anon key.
--                                        That IS a breach.
--
-- Section A below tells you which case you are in for each table. It is the FIRST
-- thing that runs so you see it before anything changes.
--
-- The reason this is a genuine open question rather than a formality: there are
-- two different definitions of `events` in this repo. analytics.sql creates it
-- with the shape track-event.js actually writes and gives it NO RLS and NO policy.
-- supabase-schema.sql creates a different one WITH a policy. Which is live depends
-- on which file was run.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY REVOKING IS SAFE — verified, not assumed
-- ─────────────────────────────────────────────────────────────────────────────
-- Checked against the code before writing this:
--   - index.html references NONE of these seven tables. Zero occurrences of
--     .from("users"), .from("events"), .from("feedback") and so on, and zero
--     /rest/v1/<table> fetches. The client only touches profiles, meal_logs,
--     favourites, cooked_it, user_supplements and promo_codes.
--   - Every Netlify function that writes them — track-event.js, waitlist.js,
--     send-feedback.js, save-user.js, stripe-webhook.js — uses
--     SUPABASE_SERVICE_KEY, which bypasses grants AND RLS entirely.
--
-- So nothing in the product loses access. Nothing breaks.


-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION A — LOOK FIRST. Which tables are actually exposed right now?
-- ═════════════════════════════════════════════════════════════════════════════
-- Read this before scrolling on. Any row with rls_enabled = false AND
-- anon_can_select = true was readable with the public key until section B ran.

select
  c.relname                        as table_name,
  c.relrowsecurity                 as rls_enabled,
  (select count(*) from pg_policies p
     where p.schemaname = 'public' and p.tablename = c.relname) as policy_count,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_can_select,
  case
    when not c.relrowsecurity and has_table_privilege('anon', c.oid, 'SELECT')
      then '>>> EXPOSED — every row readable with the public anon key'
    when c.relrowsecurity and (select count(*) from pg_policies p
           where p.schemaname='public' and p.tablename=c.relname) = 0
      then 'RLS on, no policy — denies by default, grant is inert'
    else 'RLS on with policies — check the policies are restrictive'
  end as verdict
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relkind = 'r'
  and c.relname in ('users','subscriptions','events','feedback',
                    'email_signups','calc_email_sends','birthday_codes','waitlist')
order by c.relrowsecurity, c.relname;


-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION B — CLOSE IT
-- ═════════════════════════════════════════════════════════════════════════════
-- Belt AND braces, deliberately. Enabling RLS alone would be enough, and revoking
-- the grant alone would be enough. Doing both means a future permissive policy
-- cannot silently re-open a table, and neither can a future GRANT.

do $$
declare
  t text;
  targets text[] := array[
    'users','subscriptions','events','feedback',
    'email_signups','calc_email_sends','birthday_codes'
  ];
begin
  foreach t in array targets loop
    -- Skip anything that does not exist in this project rather than failing the
    -- whole script partway through.
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


-- ═════════════════════════════════════════════════════════════════════════════
-- SECTION C — VERIFY. This is the last statement, so its result is what you see.
-- ═════════════════════════════════════════════════════════════════════════════
-- Expect: "Success. No rows returned."
-- Any row here is a table still reachable with the anon key.

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


-- ─────────────────────────────────────────────────────────────────────────────
-- PROVE IT FROM OUTSIDE — do this from a terminal, not here
-- ─────────────────────────────────────────────────────────────────────────────
-- The SQL editor runs as a privileged role, so it cannot show you what `anon`
-- sees. Test the way someone else would, with the key from index.html:
--
--   curl -s "https://rjreunvnsfjclpighogp.supabase.co/rest/v1/users?select=email,date_of_birth&limit=3" \
--     -H "apikey: <anon key from index.html>"
--
-- BEFORE: rows of real emails and dates of birth, or an empty array if RLS was
--         already covering you.
-- AFTER:  {"code":"42501","message":"permission denied for table users"}
--
-- Worth running before and after so you have seen it yourself rather than taking
-- my word for it. Repeat for subscriptions, events and feedback.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- IF SECTION A SHOWED ANY TABLE AS EXPOSED
-- ─────────────────────────────────────────────────────────────────────────────
-- Then personal data was readable with a public key, and under Qatar's PDPPL and
-- under GDPR for any EEA/UK user that is a reportable personal data breach rather
-- than a hardening opportunity. `users` holds dates of birth. Section B closes it
-- going forward, but the assessment of what was reachable, for how long, and
-- whether to notify is a decision for you — worth taking advice on.
--
-- Supabase logs API requests. Storage -> Logs -> API can show whether anything
-- other than your own traffic actually queried these endpoints.
