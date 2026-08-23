-- ════════════════════════════════════════════════════════════════════════════
-- SoulGainz — RLS fix, PART 2 (REQUIRED — run right after part 1)
--
-- RUN THIS IN THE SUPABASE SQL EDITOR NOW.
-- Dashboard → SQL Editor → New query → paste → Run.
--
-- WHY: part 1 revoked UPDATE on `profiles` and re-granted only four columns
-- (email, first_name, last_name, last_seen_at). That was too narrow — the app
-- also writes the user's own body metrics, macro targets and onboarding
-- timestamps through profileToSbRow() in index.html.
--
-- Effect right now, until this runs:
--   • saving the ME-tab profile fails
--   • calculator results (kcal/protein/carb/fat targets) fail to persist
--   • height / weight / goal / activity fail to persist
--   • the macro nudges fail to persist
-- All of them fail SILENTLY — the app catches and console.warns.
--
-- This grants back only USER-OWNED columns. The entitlement columns
-- (tier, tier_via, tier_label, tier_expires, is_admin) stay server-only,
-- so the protection from part 1 is fully preserved.
--
-- Safe to run more than once.
-- ════════════════════════════════════════════════════════════════════════════


grant update (
  -- identity / contact
  email,
  first_name,
  last_name,

  -- body metrics the user enters about themselves
  dob,
  gender,
  height_cm,
  weight_kg,
  goal,
  activity,

  -- calculator output — derived from the user's own inputs
  kcal_target,
  protein_g,
  carb_g,
  fat_g,
  macro_mode,
  p_nudge,
  c_nudge,
  f_nudge,

  -- housekeeping timestamps written by the client
  onboarded_at,
  last_seen_at,
  updated_at
) on public.profiles to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- Verify — should list the 20 columns above, and MUST NOT contain
-- tier, tier_via, tier_label, tier_expires or is_admin.
-- ─────────────────────────────────────────────────────────────────────────────
select column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name   = 'profiles'
  and grantee      = 'authenticated'
  and privilege_type = 'UPDATE'
order by column_name;


-- ─────────────────────────────────────────────────────────────────────────────
-- If any column above errors with "column ... does not exist", delete that line
-- and re-run — the schema simply doesn't have it, which is harmless.
--
-- Then smoke test, in this order:
--   1. Sign in → ME tab → edit your name → save          ✅ should work
--   2. Run the macro calculator → reload the app          ✅ targets should persist
--   3. Browser console, signed in:
--        await sb.from('profiles').update({tier:'annual'}).eq('id', '<your id>')
--      ❌ should FAIL. If it succeeds, part 1 did not apply.
-- ════════════════════════════════════════════════════════════════════════════
