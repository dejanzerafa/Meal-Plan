-- supabase-schema-fix-part14-RUN-THIS.sql
-- 2026-09-06 — remove the two test accounts; make dejan.zerafa@icloud.com the
-- permanent master account (dev tier: every recipe, calculator, no expiry).
--
-- BEFORE running: in Stripe (sandbox) → Customers, cancel any active
-- subscription for the two test emails. This SQL removes our records only;
-- it cannot cancel a Stripe subscription. (If you delete a test account from
-- the app's ME tab instead, that cancels Stripe for you — that is the better
-- route while the account can still sign in.)
--
-- Everything is idempotent. Run the whole file, then read the two result sets.

begin;

-- ── 1. Test accounts ──────────────────────────────────────────────────────────
-- auth.users is the root: profiles (id → auth.users) cascades; users (by
-- email) cascades to subscriptions / birthday_codes; the rest are by email.
do $$
declare
  test_emails text[] := array['dejanzerafa@gmail.com', 'accessiehor@gmail.com'];
  e text;
  uid uuid;
begin
  foreach e in array test_emails loop
    -- app data keyed by auth user id
    for uid in select id from auth.users where lower(email) = lower(e) loop
      delete from public.meal_logs        where user_id = uid;
      delete from public.favourites       where user_id = uid;
      delete from public.cooked_it        where user_id = uid;
      delete from public.user_supplements where user_id = uid;
      update public.promo_codes set redeemed_by = null where redeemed_by = uid;
      delete from public.profiles         where id = uid;
    end loop;
    -- rows keyed by email (users cascades to subscriptions + birthday_codes)
    delete from public.users            where lower(email) = lower(e);
    delete from public.events           where lower(email) = lower(e);
    delete from public.waitlist         where lower(email) = lower(e);
    delete from public.email_signups    where lower(email) = lower(e);
    delete from public.calc_email_sends where lower(email) = lower(e);
    begin
      execute 'delete from public.feedback where lower(email) = lower($1)' using e;
    exception when undefined_table then null;
    end;
    -- the auth user last
    delete from auth.users where lower(email) = lower(e);
  end loop;
end $$;

-- ── 2. Master account ─────────────────────────────────────────────────────────
-- tier 'dev' is what the app's DEV_TIERS / isPaid checks recognise as full
-- access. tier_expires NULL = never expires; tier_via 'admin' so the Stripe
-- webhook's revoke path (which only touches tier_via = 'stripe') can never
-- downgrade it, and no renewal-reminder is ever sent for it.
update public.profiles
   set tier         = 'dev',
       tier_via     = 'admin',
       tier_label   = 'Dev Master',
       tier_expires = null
 where lower(email) = 'dejan.zerafa@icloud.com';

-- marketing/billing row: keep, but make sure it is not in any reminder path
update public.users
   set marketing_opt_in = false
 where lower(email) = 'dejan.zerafa@icloud.com';

commit;

-- ── Verify ────────────────────────────────────────────────────────────────────
select 'auth.users left for test emails (must be 0)' as check_,
       count(*)::text as result
  from auth.users where lower(email) in ('dejanzerafa@gmail.com','accessiehor@gmail.com')
union all
select 'public.users left for test emails (must be 0)',
       count(*)::text
  from public.users where lower(email) in ('dejanzerafa@gmail.com','accessiehor@gmail.com')
union all
select 'profiles left for test emails (must be 0)',
       count(*)::text
  from public.profiles where lower(email) in ('dejanzerafa@gmail.com','accessiehor@gmail.com')
union all
select 'master: tier / via / expires',
       coalesce(tier,'NULL') || ' / ' || coalesce(tier_via,'NULL') || ' / ' || coalesce(tier_expires::text,'never')
  from public.profiles where lower(email) = 'dejan.zerafa@icloud.com';
