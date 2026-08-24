-- supabase-security-fix-part6.sql
-- RUN THIS ONE FIRST, BEFORE part 5 section A. It takes two seconds and it is
-- the most serious thing found in the whole Supabase review.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT YOUR RLS AUDIT SHOWED
-- ─────────────────────────────────────────────────────────────────────────────
-- The TABLES are fine. Every one has rls_enabled = true. Several have zero
-- policies (users, subscriptions, events, feedback, recipe_unlocks,
-- birthday_codes, calc_email_sends) — RLS denies by default, so zero policies
-- means nobody reads them through PostgREST at all. The Netlify functions use
-- the service key, which bypasses RLS, so they keep working. Nothing to fix.
--
-- The four VIEWS are the problem:
--
--   active_members      rls_enabled = false   anon_can_select = true
--   lapsed_members      rls_enabled = false   anon_can_select = true
--   broadcast_audience  rls_enabled = false   anon_can_select = true
--   user_overview       rls_enabled = false   anon_can_select = true
--
-- A view does not inherit the row-level security of the tables it reads. It runs
-- as its OWNER. So these four reach straight past the policies protecting
-- `users`, `profiles` and `subscriptions`.
--
-- They are reachable at /rest/v1/<view> with the anon key, which is published in
-- index.html and in every copy of the app on every user's phone.
--
-- What that exposes today, to anyone who views source:
--
--   user_overview       every user's email, first and last name, DATE OF BIRTH,
--                       gender, height, weight, goal, calorie and macro targets,
--                       tier, tier_via, tier_expires
--   active_members      every paying member's email, name, tier, renewal date
--   lapsed_members      every ex-member's email, name, last tier, lapse date
--   broadcast_audience  every email address you hold — customers AND leads
--
-- DOB, gender, height and weight are health-adjacent personal data. Under
-- Qatar's PDPPL and under GDPR for any EEA/UK user, an unauthenticated read of
-- that is a reportable personal data breach, not a hardening opportunity.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY REVOKING IS SAFE
-- ─────────────────────────────────────────────────────────────────────────────
-- Verified by grep across the whole repo: NOTHING reads these four views.
-- Not index.html, not any of the 26 Netlify functions, not the marketing site.
-- They are admin analytics views, created for reporting and never wired up.
-- The service key ignores GRANTs anyway, so any future admin tooling that uses
-- SUPABASE_SERVICE_KEY keeps working untouched.

begin;

revoke all on public.user_overview      from anon, authenticated;
revoke all on public.active_members     from anon, authenticated;
revoke all on public.lapsed_members     from anon, authenticated;
revoke all on public.broadcast_audience from anon, authenticated;

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY — expect ZERO rows.
-- ─────────────────────────────────────────────────────────────────────────────
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('user_overview','active_members','lapsed_members','broadcast_audience')
  and grantee    in ('anon','authenticated')
order by table_name, grantee, privilege_type;


-- ─────────────────────────────────────────────────────────────────────────────
-- CONFIRM IT IS ACTUALLY CLOSED — do this from a terminal, not here.
-- ─────────────────────────────────────────────────────────────────────────────
-- The SQL editor runs as a privileged role, so it cannot prove what `anon` can
-- see. Test the way an attacker would, with the public anon key:
--
--   curl -s "https://rjreunvnsfjclpighogp.supabase.co/rest/v1/user_overview?select=email,dob&limit=5" \
--     -H "apikey: <the anon key from index.html>"
--
-- BEFORE this script: returns rows of real emails and dates of birth.
-- AFTER:              {"code":"42501","message":"permission denied for view user_overview"}
--
-- Run it before and after, so you have seen the difference yourself rather than
-- taking my word for it. Repeat for active_members, lapsed_members and
-- broadcast_audience.


-- ─────────────────────────────────────────────────────────────────────────────
-- IF YOU EVER WANT THESE VIEWS BACK, IN-APP
-- ─────────────────────────────────────────────────────────────────────────────
-- Do not simply re-grant. On Postgres 15+ (Supabase is on 15+), recreate them
-- with security_invoker, which makes a view respect the CALLER's RLS instead of
-- the owner's:
--
--   alter view public.user_overview set (security_invoker = on);
--
-- With that set, `user_overview` would return only the caller's own row, because
-- profiles_select_own restricts it to auth.uid() = id. That is the correct shape
-- for anything user-facing. For genuine admin reporting, leave the views
-- revoked and read them from a Netlify function using the service key, where
-- you can gate on is_admin.
