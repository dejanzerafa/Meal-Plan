-- supabase-schema-fix-part15-RUN-THIS.sql
-- 2026-09-06 — recipe release control from the app, no deploy required.
--
-- Until now releasing a recipe meant editing RECIPE_TIER_PENDING in index.html
-- and redeploying (recipe-release.html did that through a GitHub token stored
-- in the browser). This table makes release a data operation:
--
--   • the app ships every staged recipe in PENDING_RECIPES, hidden;
--   • a row here with status = 'released' makes that recipe visible to the
--     tier named in `tier`, from the next app launch, with a 🔥 NEW badge for
--     60 days;
--   • 'held' / 'pending' keep it hidden (held = "decided not now").
--
-- Reads: anyone (anon + signed-in) can read RELEASED rows only — that is all
-- the app needs and it leaks nothing but ids. Writes: admins only, through the
-- same is_admin flag the promo_codes policy already uses.

begin;

create table if not exists public.recipe_releases (
  recipe_id   text primary key,
  status      text not null default 'pending' check (status in ('pending','released','held')),
  tier        text check (tier in ('monthly','annual')),
  released_at timestamptz,
  updated_at  timestamptz not null default now(),
  updated_by  text,
  note        text,
  -- a released row must say which tier it was released to
  constraint recipe_releases_tier_when_released check (status <> 'released' or tier is not null)
);

alter table public.recipe_releases enable row level security;

drop policy if exists "Anyone reads released recipes" on public.recipe_releases;
create policy "Anyone reads released recipes" on public.recipe_releases
  for select using (status = 'released');

drop policy if exists "Admins manage recipe_releases" on public.recipe_releases;
create policy "Admins manage recipe_releases" on public.recipe_releases
  for all
  using  (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

grant select on public.recipe_releases to anon, authenticated;
grant insert, update, delete on public.recipe_releases to authenticated;   -- RLS above limits this to admins

-- keep updated_at honest
create or replace function public.recipe_releases_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'released' and (old is null or old.status is distinct from 'released') then
    new.released_at := coalesce(new.released_at, now());
  end if;
  if new.status <> 'released' then new.released_at := null; end if;
  return new;
end $$;
drop trigger if exists trg_recipe_releases_touch on public.recipe_releases;
create trigger trg_recipe_releases_touch
  before insert or update on public.recipe_releases
  for each row execute function public.recipe_releases_touch();

-- The master account is the admin. is_admin is server-only (part 12/13 revoked
-- client writes on profiles' privileged columns), so this is the one place it is set.
update public.profiles set is_admin = true where lower(email) = 'dejan.zerafa@icloud.com';

commit;

-- ── Verify ────────────────────────────────────────────────────────────────────
select 'table exists' as check_, (to_regclass('public.recipe_releases') is not null)::text as result
union all
select 'RLS enabled', (select relrowsecurity::text from pg_class where oid = 'public.recipe_releases'::regclass)
union all
select 'policies', (select count(*)::text from pg_policies where tablename = 'recipe_releases')
union all
select 'master is_admin', (select coalesce(is_admin,false)::text from public.profiles where lower(email) = 'dejan.zerafa@icloud.com')
union all
select 'anon can INSERT (must be false)', (select bool_or(privilege_type = 'INSERT')::text from information_schema.role_table_grants where table_name = 'recipe_releases' and grantee = 'anon');
