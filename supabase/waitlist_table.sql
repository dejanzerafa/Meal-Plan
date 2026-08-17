-- Run this in Supabase → SQL Editor
-- Creates the waitlist table for pre-launch email capture

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  source     text default 'waitlist_page',
  joined_at  timestamptz not null default now()
);

-- Index for fast email lookups / dedup checks
create index if not exists waitlist_email_idx on public.waitlist (email);

-- Row Level Security — service role can read/write; public cannot
alter table public.waitlist enable row level security;

-- Allow the service role (used by Netlify functions) full access
create policy "service_role full access" on public.waitlist
  for all
  using (true)
  with check (true);

-- No public read access (keep emails private)
-- To export your list: Supabase dashboard → Table Editor → waitlist → Export CSV
