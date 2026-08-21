-- ── profiles table: add tracking columns + ensure all data fields exist ──────
-- Run in Supabase SQL Editor → New Query.
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- 1. Add last_seen_at (stamped on every sign-in)
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- 2. Add onboarded_at (stamped once on first account creation / upload)
alter table public.profiles
  add column if not exists onboarded_at timestamptz;

-- 3. Ensure all profile data columns exist (in case they were missed earlier)
alter table public.profiles
  add column if not exists first_name  text,
  add column if not exists last_name   text,
  add column if not exists dob         date,
  add column if not exists gender      text,
  add column if not exists height_cm   numeric,
  add column if not exists weight_kg   numeric,
  add column if not exists goal        text,
  add column if not exists activity    text,
  add column if not exists kcal_target int,
  add column if not exists protein_g   int,
  add column if not exists carb_g      int,
  add column if not exists fat_g       int,
  add column if not exists macro_mode  text default 'auto',
  add column if not exists p_nudge     int  default 0,
  add column if not exists c_nudge     int  default 0,
  add column if not exists f_nudge     int  default 0,
  add column if not exists tier        text,
  add column if not exists tier_via    text,
  add column if not exists tier_label  text,
  add column if not exists tier_expires date,
  add column if not exists updated_at  timestamptz default now();

-- 4. Indexes for common admin/analytics queries
create index if not exists idx_profiles_email      on public.profiles(email);
create index if not exists idx_profiles_tier       on public.profiles(tier);
create index if not exists idx_profiles_last_seen  on public.profiles(last_seen_at desc);
create index if not exists idx_profiles_onboarded  on public.profiles(onboarded_at);

-- 5. Backfill last_seen_at for existing rows that have updated_at
update public.profiles
  set last_seen_at = updated_at
  where last_seen_at is null and updated_at is not null;

-- ── waitlist users table: ensure name columns exist ──────────────────────────
-- The `users` table is the waitlist/marketing list used by save-user.js.
alter table public.users
  add column if not exists first_name   text,
  add column if not exists last_name    text,
  add column if not exists calc_used    boolean default false,
  add column if not exists welcome_sent boolean default false,
  add column if not exists updated_at   timestamptz default now();

create index if not exists idx_users_email on public.users(email);

-- ── View: combined user overview (for admin analytics) ───────────────────────
-- Join waitlist list with auth profiles for a full picture of each user.
create or replace view public.user_overview as
  select
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.dob,
    p.gender,
    p.height_cm,
    p.weight_kg,
    p.goal,
    p.activity,
    p.kcal_target,
    p.protein_g,
    p.carb_g,
    p.fat_g,
    p.tier,
    p.tier_via,
    p.tier_expires,
    p.onboarded_at,
    p.last_seen_at,
    p.updated_at                          as profile_updated_at,
    u.marketing_opt_in,
    u.welcome_sent,
    u.calc_used,
    u.created_at                          as waitlist_joined_at
  from public.profiles p
  left join public.users u on lower(u.email) = lower(p.email);

-- Note: this view uses service_role key in Netlify functions — no RLS needed.
-- For direct Supabase dashboard access, query this view from SQL Editor.
