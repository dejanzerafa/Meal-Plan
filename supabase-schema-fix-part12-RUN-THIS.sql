-- supabase-schema-fix-part12-RUN-THIS.sql
--
-- Everything the 2026-09-05 diagnostic found. Paste the whole file, hit Run.
-- Idempotent — safe to run twice.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THE DIAGNOSTIC SHOWED
-- ─────────────────────────────────────────────────────────────────────────────
-- The fundamentals are sound: RLS on every table, no entitlement column
-- writable by the client, every unique key present, zero duplicates, zero
-- orphans, emails normalised. Twelve users, two subscriptions.
--
-- What is wrong, in order of consequence:
--
--   A. promo_codes.redeemed_by / redeemed_at DO NOT EXIST. redeem-promo.js
--      PATCHes them on every redemption; PostgREST returns 400; the code reads
--      that as "already claimed" and answers 409. Promo codes have never
--      worked in production.
--
--   B. The one real subscription in the database — dejan.zerafa@icloud.com,
--      Monthly, active since 2026-08-23 — has profiles.tier = NULL. Paid, not
--      entitled. Invisible until now because that account runs on the dev
--      override. This is the exact "paid-but-locked" case from the go-live
--      audit, on the only paying row there is.
--
--   C. recipe_unlocks and redemptions are still fully granted to anon and
--      authenticated. Neither is touched by the client. Part 9 missed them.
--
--   D. promo_codes.created_by → profiles and email_signups.user_id → users are
--      NO ACTION foreign keys, so deleting the admin's own auth account fails
--      while any promo code exists.
--
--   E. email_signups carries an INSERT policy WITH CHECK (true) for anon.
--      Inert (grants were revoked in part 9) but it is one accidental GRANT
--      away from being an open write, which is exactly how the waitlist table
--      got exposed.
--
--   F. Three users have a date of birth in profiles.dob and NULL in
--      users.date_of_birth, which is the column birthday-emails.js reads.
--      Nothing in the repo has ever written users.date_of_birth.
--
--   G. One users row has a double space in the name.
--
-- users.subscription_status / users.plan_type also do not exist; those are
-- fixed in code (admin-list-users.js), not by adding dead columns here.

-- ── A. promo_codes: the two columns redeem-promo.js has always written ────────
alter table public.promo_codes
  add column if not exists redeemed_by uuid references auth.users(id) on delete set null,
  add column if not exists redeemed_at timestamptz;

create index if not exists idx_promo_codes_redeemed_by on public.promo_codes (redeemed_by);

-- ── B. Entitle the paid account ───────────────────────────────────────────────
-- Sets profiles.tier from the LATEST active subscription for any profile whose
-- tier is NULL. Today that is one row; written generally so it is a repair,
-- not a one-off. tier_expires takes the subscription's period end.
with latest as (
  select distinct on (u.email)
         lower(u.email)          as email,
         s.tier,
         s.current_period_end
    from public.subscriptions s
    join public.users u on u.id = s.user_id
   where s.status in ('active', 'trialing')
   order by u.email, s.created_at desc
)
update public.profiles p
   set tier         = l.tier,
       tier_via     = 'stripe',
       tier_label   = initcap(l.tier),
       tier_expires = to_char(l.current_period_end at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
       updated_at   = now()
  from latest l
 where lower(p.email) = l.email
   and p.tier is null;

-- ── C. Revoke the two tables the client never touches ─────────────────────────
revoke all on public.recipe_unlocks from anon, authenticated;
revoke all on public.redemptions    from anon, authenticated;

-- ── D. Foreign keys that block account deletion ───────────────────────────────
-- created_by: keep the code, forget who made it.
alter table public.promo_codes drop constraint if exists promo_codes_created_by_fkey;
alter table public.promo_codes
  add constraint promo_codes_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

-- email_signups.user_id: keep the signup, forget the link.
alter table public.email_signups drop constraint if exists email_signups_user_id_fkey;
alter table public.email_signups
  add constraint email_signups_user_id_fkey
  foreign key (user_id) references public.users(id) on delete set null;

-- ── E. Drop the inert open-write policy ───────────────────────────────────────
drop policy if exists "Allow public email signup" on public.email_signups;

-- ── F. Backfill users.date_of_birth from profiles.dob ─────────────────────────
-- profiles.dob is text; only copy values that parse as a date.
update public.users u
   set date_of_birth = p.dob::date
  from public.profiles p
 where lower(p.email) = lower(u.email)
   and u.date_of_birth is null
   and p.dob ~ '^\d{4}-\d{2}-\d{2}$';

-- ── G. Collapse runs of whitespace in names ───────────────────────────────────
update public.users
   set first_name = regexp_replace(btrim(first_name), '\s+', ' ', 'g'),
       last_name  = regexp_replace(btrim(last_name),  '\s+', ' ', 'g')
 where first_name ~ '\s\s' or last_name ~ '\s\s'
    or first_name <> btrim(first_name) or last_name <> btrim(last_name);

update public.profiles
   set first_name = regexp_replace(btrim(first_name), '\s+', ' ', 'g'),
       last_name  = regexp_replace(btrim(last_name),  '\s+', ' ', 'g')
 where first_name ~ '\s\s' or last_name ~ '\s\s'
    or first_name <> btrim(first_name) or last_name <> btrim(last_name);


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY — last statement. Every row should read ok / 0 except the INFO line.
-- ─────────────────────────────────────────────────────────────────────────────
select 'A promo_codes.redeemed_by exists' as check_,
       (select count(*)::text from information_schema.columns
         where table_schema='public' and table_name='promo_codes' and column_name='redeemed_by') as result
union all
select 'B active sub but profiles.tier NULL (must be 0)',
       (select count(*)::text
          from public.subscriptions s
          join public.users u on u.id = s.user_id
          join public.profiles p on lower(p.email) = lower(u.email)
         where s.status in ('active','trialing') and p.tier is null)
union all
select 'B INFO — entitled profiles now',
       (select coalesce(string_agg(email || ' → ' || tier, ', '), '(none)')
          from public.profiles where tier_via = 'stripe')
union all
select 'C grants on recipe_unlocks/redemptions to anon/authenticated (must be 0)',
       (select count(*)::text from information_schema.role_table_grants
         where table_schema='public' and table_name in ('recipe_unlocks','redemptions')
           and grantee in ('anon','authenticated'))
union all
select 'D user-keyed FKs still NO ACTION (must be 0)',
       (select count(*)::text
          from pg_constraint c
          join pg_class t on t.oid = c.conrelid
         where c.contype = 'f' and t.relname in ('promo_codes','email_signups')
           and c.confdeltype = 'a')
union all
select 'E email_signups open-write policy (must be 0)',
       (select count(*)::text from pg_policies
         where tablename='email_signups' and policyname='Allow public email signup')
union all
select 'F users with DOB in profiles but not users (must be 0)',
       (select count(*)::text
          from public.profiles p join public.users u on lower(u.email)=lower(p.email)
         where p.dob ~ '^\d{4}-\d{2}-\d{2}$' and u.date_of_birth is null)
union all
select 'G names with double spaces (must be 0)',
       (select count(*)::text from public.users
         where first_name ~ '\s\s' or last_name ~ '\s\s');
