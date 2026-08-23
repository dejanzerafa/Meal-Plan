-- ════════════════════════════════════════════════════════════════════════════
-- SoulGainz — RLS security fix
--
-- RUN THIS IN THE SUPABASE SQL EDITOR BEFORE TAKING REAL MONEY.
-- Dashboard → SQL Editor → New query → paste → Run.
--
-- Found during the full security review. Three policies let the browser write
-- or read things only the server should control. The app's entire
-- `canTrustUnlocks` / `_serverVerified` model sits on top of #1, so until this
-- runs, that machinery provides the appearance of security rather than security.
--
-- Safe to run more than once (drops are IF EXISTS).
-- Nothing here deletes data.
-- ════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. profiles — stop the client writing its own entitlement
--
-- WAS: create policy "Own profile" on profiles for all using (auth.uid() = id);
--
-- `for all` includes UPDATE on EVERY column, so any signed-in user could run
--     supabase.from('profiles').update({ tier:'annual', is_admin:true })
-- from the browser console and get permanent, server-verified "annual" that is
-- indistinguishable from a paying customer — plus admin rights.
--
-- Users still need to update their own name/settings, so we keep an UPDATE
-- policy but revoke the entitlement columns at the GRANT level. Column-level
-- privileges are checked independently of RLS, so this holds even though the
-- row-level policy still matches.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Own profile" on public.profiles;

-- Read your own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Insert your own row (first sign-in creates the stub)
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Update your own row — but only the columns granted below
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- The entitlement columns become server-only. Only the service_role key
-- (stripe-webhook.js, redeem-promo.js) can write these.
revoke update on public.profiles from authenticated;

grant update (
  first_name,
  last_name,
  email,
  last_seen_at
) on public.profiles to authenticated;

-- NOTE: if you add a new user-editable profile column later, it must be added
-- to the GRANT above or writes to it will silently fail. That is the intended
-- trade-off — new columns are locked by default rather than open by default.


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. promo_codes — stop the client reading and deactivating codes
--
-- WAS: "All users read active promo_codes"  → any signed-in user could
--      `select * from promo_codes` and read the `code` column for EVERY live
--      code, then redeem one for a free paid tier.
--      "Anon can deactivate promo_codes"    → an unauthenticated visitor could
--      set active=false on the entire table.
--
-- Redemption runs server-side in redeem-promo.js with the service_role key,
-- which bypasses RLS entirely — so the browser never needs any access here.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "All users read active promo_codes" on public.promo_codes;
drop policy if exists "Anon can deactivate promo_codes"   on public.promo_codes;

revoke all on public.promo_codes from anon, authenticated;

alter table public.promo_codes enable row level security;
-- No policies for anon/authenticated = no access. service_role still has full
-- access because it bypasses RLS.


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Verify
-- ─────────────────────────────────────────────────────────────────────────────

-- Should list ONLY the three profiles_* policies:
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename in ('profiles', 'promo_codes')
order by tablename, policyname;

-- Should show ONLY first_name, last_name, email, last_seen_at:
select column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name   = 'profiles'
  and grantee      = 'authenticated'
  and privilege_type = 'UPDATE'
order by column_name;


-- ════════════════════════════════════════════════════════════════════════════
-- AFTER RUNNING — smoke test these still work:
--   1. Sign in, edit your name in the ME tab           → should save
--   2. Complete a test checkout                        → tier should update
--   3. Redeem a promo code                             → should still work
--   4. In the browser console, as a signed-in user:
--        await sb.from('profiles').update({tier:'annual'}).eq('id', <your id>)
--      → should now FAIL. If it succeeds, the revoke did not apply.
-- ════════════════════════════════════════════════════════════════════════════
