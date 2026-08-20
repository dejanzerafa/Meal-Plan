-- ── promo_codes table + RLS ──────────────────────────────────────────────────
-- Run in Supabase SQL Editor.
-- Promo codes are admin-created, single-use, tied to a recipient email.

create table if not exists public.promo_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  tier          text not null,          -- 'monthly' | 'annual'
  expires       date not null,          -- must be redeemed by this date
  label         text,                   -- recipient email or note
  duration_days int,                    -- access granted for N days after redemption
  created_by    uuid references auth.users(id),
  active        boolean default true,   -- false once redeemed or deleted
  redeemed_by   uuid references auth.users(id),
  redeemed_at   timestamptz,
  created_at    timestamptz default now()
);

-- Index for fast lookup by code
create index if not exists idx_promo_codes_code on public.promo_codes(code);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.promo_codes enable row level security;

-- Anon/authenticated users cannot read promo_codes at all.
-- All reads and writes go through the server-side redeem-promo Netlify function
-- which uses the service_role key (bypasses RLS).

-- Admins only: allow read/write via service key (already bypasses RLS).
-- Drop any old permissive policies:
drop policy if exists "Allow all" on public.promo_codes;
drop policy if exists "Public read" on public.promo_codes;

-- No public access — all operations via service_role key only.
-- (No policy = deny all for anon/authenticated roles)
