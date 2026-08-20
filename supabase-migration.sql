-- ============================================================
-- SoulGainz — Supabase Migration
-- Add terms acceptance columns to profiles table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Add terms_accepted_at and terms_version columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '2026-08';

-- Step 2: Index for compliance queries
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted_at
  ON profiles (terms_accepted_at);

-- Step 3: Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('terms_accepted_at', 'terms_version')
ORDER BY column_name;

-- ============================================================
-- IMPORTANT NOTES:
--
-- The terms_accepted_at timestamp is already being written to
-- Supabase auth.users metadata on signup via:
--
--   sb.auth.signUp({ email, password, options: {
--     data: {
--       terms_accepted_at: new Date().toISOString(),
--       terms_version: "2026-08"
--     }
--   }})
--
-- This migration also stores it in the profiles table so you
-- can query it directly in SQL without going through auth.users.
--
-- To backfill existing users from auth metadata:
-- ============================================================

-- Step 4 (Optional): Backfill existing users who signed up before this migration
-- Only run this if you have existing users you want to backfill.
-- This copies terms data from auth.users metadata → profiles.

/*
UPDATE profiles p
SET
  terms_accepted_at = (au.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMPTZ,
  terms_version     = COALESCE(au.raw_user_meta_data->>'terms_version', '2026-08')
FROM auth.users au
WHERE p.id = au.id
  AND au.raw_user_meta_data->>'terms_accepted_at' IS NOT NULL
  AND p.terms_accepted_at IS NULL;
*/

-- ============================================================
-- OPTIONAL: Auto-sync trigger (advanced)
-- If you want terms_accepted_at to write to profiles automatically
-- whenever a user signs up, add this trigger.
-- Note: Requires the handle_new_user trigger to already exist and
--       pass through metadata, OR create a separate trigger below.
-- ============================================================

/*
CREATE OR REPLACE FUNCTION sync_terms_acceptance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET
    terms_accepted_at = (NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMPTZ,
    terms_version     = NEW.raw_user_meta_data->>'terms_version'
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_terms_sync ON auth.users;
CREATE TRIGGER on_auth_user_terms_sync
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_terms_acceptance();
*/

-- ============================================================
-- COMPLIANCE QUERY — Check who has accepted terms:
-- ============================================================

-- Count users who have/haven't accepted
SELECT
  COUNT(*) FILTER (WHERE terms_accepted_at IS NOT NULL) AS accepted,
  COUNT(*) FILTER (WHERE terms_accepted_at IS NULL)     AS not_recorded,
  COUNT(*)                                               AS total
FROM profiles;

-- List users who haven't accepted (pre-migration users)
-- SELECT id, created_at FROM profiles WHERE terms_accepted_at IS NULL;
