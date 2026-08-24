-- supabase-security-fix-part3.sql
-- RUN THIS IN THE SUPABASE SQL EDITOR BEFORE LAUNCH.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY
-- ─────────────────────────────────────────────────────────────────────────────
-- Part 1 revoked UPDATE on public.profiles:
--
--     revoke update on public.profiles from authenticated;
--
-- It never revoked INSERT. Supabase ships a default
-- `GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated`, so INSERT on
-- every column was still granted, and the `profiles_insert_own` policy allows
-- any row where `auth.uid() = id`.
--
-- The attack is one request, using the anon key that is published in the app:
--
--   1. Sign up through the Supabase auth REST API.
--   2. BEFORE the app creates your profile stub, insert your own row:
--        insert into profiles (id, email, tier, tier_expires, is_admin)
--        values (auth.uid(), 'me@example.com', 'annual', '2099-01-01', true);
--
-- The row is yours, so the policy permits it. loadUserData then reads that row
-- back and marks it `_serverVerified: true` — the exact flag the client trusts
-- to decide what a paying customer may see. The entire entitlement model is
-- bypassed at the source, and `is_admin` is granted for free alongside it.
--
-- Revoking UPDATE without revoking INSERT is not a partial fix; it is no fix,
-- because a user can always create their row before the app does.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- THE FIX
-- ─────────────────────────────────────────────────────────────────────────────
-- Mirror what part 2 did for UPDATE: revoke INSERT wholesale, then grant back
-- only the columns a user legitimately supplies about themselves. Entitlement
-- and privilege columns (tier, tier_via, tier_label, tier_expires, is_admin)
-- are writable ONLY by the service key, i.e. only by the Stripe webhook and the
-- promo redemption function.

begin;

-- 1. Remove the blanket INSERT grant.
revoke insert on public.profiles from authenticated;
revoke insert on public.profiles from anon;

-- 2. Grant back exactly the user-owned columns.
--    Keep this list in sync with profileToSbRow() in index.html — if you add a
--    profile field there and forget it here, saving a profile starts failing
--    silently for every user. (That is what happened when part 1 granted 4
--    columns while the client wrote 20.)
grant insert (
  activity,
  c_nudge,
  carb_g,
  dob,
  email,
  f_nudge,
  fat_g,
  first_name,
  gender,
  goal,
  height_cm,
  id,
  kcal_target,
  last_name,
  last_seen_at,
  macro_mode,
  onboarded_at,
  p_nudge,
  protein_g,
  updated_at,
  weight_kg
) on public.profiles to authenticated;

-- 3. Do the same for UPDATE, derived from the same list, so part 2 and part 3
--    cannot drift apart as the client changes.
revoke update on public.profiles from authenticated;
revoke update on public.profiles from anon;
grant update (
  activity,
  c_nudge,
  carb_g,
  dob,
  email,
  f_nudge,
  fat_g,
  first_name,
  gender,
  goal,
  height_cm,
  id,
  kcal_target,
  last_name,
  last_seen_at,
  macro_mode,
  onboarded_at,
  p_nudge,
  protein_g,
  updated_at,
  weight_kg
) on public.profiles to authenticated;

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY — run this after the transaction above.
-- ─────────────────────────────────────────────────────────────────────────────
-- Expect ZERO rows. Any row returned is a column a signed-in user can still
-- write to grant themselves access or admin rights.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name   = 'profiles'
  and grantee      in ('authenticated', 'anon')
  and column_name  in ('tier', 'tier_via', 'tier_label', 'tier_expires', 'is_admin')
order by grantee, column_name;

-- Also confirm the table-level grants are gone (expect no INSERT/UPDATE rows
-- for authenticated or anon):
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name   = 'profiles'
  and grantee      in ('authenticated', 'anon')
order by grantee, privilege_type;

-- ─────────────────────────────────────────────────────────────────────────────
-- AFTER RUNNING — smoke test, because a too-narrow grant fails silently.
-- ─────────────────────────────────────────────────────────────────────────────
--   1. Sign up as a brand-new user in the app.
--   2. Complete the macro calculator and save.
--   3. Reload. Your targets must still be there.
--
-- If the profile does not persist, a column the client writes is missing from
-- the grant list above. Check the browser console for a PostgREST 42501
-- ("permission denied for column ...") and add that column.
