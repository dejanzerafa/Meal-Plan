-- supabase-schema-fix-part13-RUN-THIS.sql
--
-- Identity integrity. Paste the whole file, hit Run. Idempotent.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT IS WRONG
-- ─────────────────────────────────────────────────────────────────────────────
--   A. profiles.email is client-writable (part 3 grants it for insert/update,
--      because the app's upsert sends it) AND it is the key the Stripe webhook
--      joins on when it writes entitlements by email (stripe-webhook.js:161,
--      :453, :496). So a signed-in user can set their profiles.email to another
--      customer's address and, on that customer's next renewal event, receive
--      tier_via='stripe' + tier_expires — or have their tier nulled by the
--      other customer's cancellation. There is also no uniqueness on the
--      column, so an update-by-email can hit several rows.
--
--      Revoking the column would break every profile save (PostgREST upsert
--      is INSERT … ON CONFLICT DO UPDATE over every column sent). Instead a
--      trigger overwrites whatever the client sends with the address from
--      auth.users for that id. The client keeps working; the value cannot be
--      anything but the truth.
--
--   B. users.marketing_opt_in defaults TRUE. save-user.js defaults false, but
--      the webhook's upsert never sets it, so every Stripe-created row inherits
--      true and receives holiday/birthday mail nobody consented to.
--
--   C. The events table has two definitions in the repo (supabase-schema.sql
--      and analytics.sql) with different column sets. The live table carries
--      both sets — someone reconciled it by hand. Make the repo match, so a
--      rebuild from source produces a table both writers can use.

-- ── A. profiles.email is derived, never chosen ───────────────────────────────
create or replace function public.profiles_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The auth address is the identity. Ignore whatever arrived in the row.
  select lower(email) into new.email from auth.users where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_profiles_email_from_auth on public.profiles;
create trigger trg_profiles_email_from_auth
  before insert or update of email on public.profiles
  for each row execute function public.profiles_email_from_auth();

-- Normalise what is already there, then make it unique.
update public.profiles p
   set email = lower(u.email)
  from auth.users u
 where u.id = p.id
   and (p.email is distinct from lower(u.email));

create unique index if not exists profiles_email_lower_uniq
  on public.profiles (lower(email));

-- ── B. Consent is opt-in ──────────────────────────────────────────────────────
alter table public.users
  alter column marketing_opt_in set default false;

-- ── C. events: one table, both shapes ────────────────────────────────────────
alter table public.events
  add column if not exists event_type text,
  add column if not exists event_name text,
  add column if not exists user_id    uuid,
  add column if not exists session_id text,
  add column if not exists email      text,
  add column if not exists metadata   jsonb,
  add column if not exists properties jsonb,
  add column if not exists created_at timestamptz not null default now();

-- Neither writer fills the other's NOT NULL column, so neither may be NOT NULL.
alter table public.events alter column event_type drop not null;
alter table public.events alter column event_name drop not null;

create index if not exists idx_events_created_at on public.events (created_at);


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────────────────────────────────────────
select 'A trigger present' as check_,
       (select count(*)::text from pg_trigger where tgname = 'trg_profiles_email_from_auth') as result
union all
select 'A profiles.email <> auth email (must be 0)',
       (select count(*)::text from public.profiles p join auth.users u on u.id = p.id
         where p.email is distinct from lower(u.email))
union all
select 'A unique index on lower(email)',
       (select count(*)::text from pg_indexes where indexname = 'profiles_email_lower_uniq')
union all
select 'B users.marketing_opt_in default',
       (select column_default from information_schema.columns
         where table_schema='public' and table_name='users' and column_name='marketing_opt_in')
union all
select 'C events has both event_type and event_name, both nullable',
       (select string_agg(column_name || ':' || is_nullable, ', ' order by column_name)
          from information_schema.columns
         where table_schema='public' and table_name='events' and column_name in ('event_type','event_name'));
