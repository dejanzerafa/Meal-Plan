-- ═══════════════════════════════════════════════════════════════
-- SoulGainz — Supabase Setup Script
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Profiles ──────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  first_name   text,
  last_name    text,
  dob          text,
  gender       text,
  height_cm    numeric,
  weight_kg    numeric,
  goal         text,
  activity     text,
  kcal_target  numeric,
  protein_g    numeric,
  carb_g       numeric,
  fat_g        numeric,
  macro_mode   text default 'auto',
  p_nudge      numeric default 0,
  c_nudge      numeric default 0,
  f_nudge      numeric default 0,
  tier         text,
  tier_via     text,
  tier_label   text,
  tier_expires text,
  is_admin     boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── 2. Meal logs ─────────────────────────────────────────────
create table if not exists meal_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  date       text not null,
  lunch_id   text,
  dinner_id  text,
  batch_size integer default 7,
  created_at timestamptz default now()
);

-- ── 3. Favourites ────────────────────────────────────────────
create table if not exists favourites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  recipe_id  text not null,
  created_at timestamptz default now(),
  unique(user_id, recipe_id)
);

-- ── 4. Cooked-it tracking ────────────────────────────────────
create table if not exists cooked_it (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  recipe_id  text not null,
  cooked_at  timestamptz default now()
);

-- ── 5. Promo codes ───────────────────────────────────────────
create table if not exists promo_codes (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  tier       text not null,
  expires    date,
  label      text,
  active        boolean default true,
  duration_days integer,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now()
);

-- ── 6. Redemptions ───────────────────────────────────────────
create table if not exists redemptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  code          text not null,
  tier_granted  text,
  tier_expires  text,
  redeemed_at   timestamptz default now(),
  unique(user_id, code)
);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════

alter table profiles    enable row level security;
alter table meal_logs   enable row level security;
alter table favourites  enable row level security;
alter table cooked_it   enable row level security;
alter table promo_codes enable row level security;
alter table redemptions enable row level security;

-- Profiles: users see + edit only their own row
create policy "Own profile" on profiles for all using (auth.uid() = id);

-- Meal logs: own rows only
create policy "Own meal_logs" on meal_logs for all using (auth.uid() = user_id);

-- Favourites: own rows only
create policy "Own favourites" on favourites for all using (auth.uid() = user_id);

-- Cooked-it: own rows only
create policy "Own cooked_it" on cooked_it for all using (auth.uid() = user_id);

-- Promo codes: admins manage, all authenticated users can read active codes
create policy "Admins manage promo_codes" on promo_codes for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "All users read active promo_codes" on promo_codes for select
  using (active = true and auth.uid() is not null);

-- Anonymous users can deactivate (mark active=false) promo codes on redemption
-- This prevents code reuse from different devices even without a login session
create policy "Anon can deactivate promo_codes" on promo_codes for update
  using (true)
  with check (active = false);

-- Redemptions: own rows only (insert allowed for self)
create policy "Own redemptions" on redemptions for all using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- Auto-create profile row on signup
-- ═══════════════════════════════════════════════════════════════
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- Make yourself admin (run AFTER creating your account in the app)
-- Replace the email with yours:
-- ═══════════════════════════════════════════════════════════════
-- update profiles set is_admin = true where email = 'dejan.zerafa@icloud.com';


-- ═══════════════════════════════════════════════════════════════
-- Supplements tracker (premium feature)
-- ═══════════════════════════════════════════════════════════════
create table if not exists user_supplements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  name         text not null,
  dose         text,
  unit         text default 'mg',
  times        jsonb default '[]',   -- array of "HH:MM" strings
  notes        text,
  active       boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table user_supplements enable row level security;
create policy "Own supplements" on user_supplements for all using (auth.uid() = user_id);
