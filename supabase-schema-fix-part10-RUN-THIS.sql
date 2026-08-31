-- supabase-schema-fix-part10-RUN-THIS.sql
--
-- Not security this time — correctness. Paste the whole file, hit Run.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT IS BROKEN
-- ─────────────────────────────────────────────────────────────────────────────
-- The app upserts with three `onConflict` targets that have no matching unique
-- constraint. Postgres answers 42P10 ("there is no unique or exclusion constraint
-- matching the ON CONFLICT specification"), and every one of those calls sits
-- inside a `catch` that only does console.warn.
--
-- So they fail silently, every time:
--
--   meal_logs        onConflict "user_id,date"        index.html uploadLocalDataToSupabase
--   user_supplements onConflict "user_id,name"        index.html supplement sync
--   cooked_it        onConflict "user_id,recipe_id"   index.html toggleCooked
--
-- What the user sees: prep days never reach the server, so the calendar is
-- device-only and a new phone starts empty. Supplements do not sync. Marking a
-- recipe cooked may not persist.
--
-- Two columns are also written by the app but exist in no .sql file in the repo:
-- `profiles.onboarded_at` and `profiles.last_seen_at`. They were probably added by
-- hand in the dashboard — which is exactly the drift this file fixes, because a
-- rebuild from the SQL would produce a schema the app cannot write to.
--
-- Everything here is idempotent. Safe to run twice.


-- ═════════════════════════════════════════════════════════════════════════════
-- 1. The three missing unique constraints
-- ═════════════════════════════════════════════════════════════════════════════
-- Duplicates are removed first, keeping the newest row of each group, because
-- adding a unique index over existing duplicates would fail.

-- ── meal_logs (user_id, date) ────────────────────────────────────────────────
delete from public.meal_logs a
using public.meal_logs b
where a.user_id = b.user_id
  and a.date    = b.date
  and a.ctid    < b.ctid;

create unique index if not exists meal_logs_user_date_uniq
  on public.meal_logs (user_id, date);

-- ── user_supplements (user_id, name) ─────────────────────────────────────────
delete from public.user_supplements a
using public.user_supplements b
where a.user_id = b.user_id
  and a.name    = b.name
  and a.ctid    < b.ctid;

create unique index if not exists user_supplements_user_name_uniq
  on public.user_supplements (user_id, name);

-- ── cooked_it (user_id, recipe_id) ───────────────────────────────────────────
delete from public.cooked_it a
using public.cooked_it b
where a.user_id   = b.user_id
  and a.recipe_id = b.recipe_id
  and a.ctid      < b.ctid;

create unique index if not exists cooked_it_user_recipe_uniq
  on public.cooked_it (user_id, recipe_id);


-- ═════════════════════════════════════════════════════════════════════════════
-- 2. Columns the app writes that no .sql file creates
-- ═════════════════════════════════════════════════════════════════════════════
alter table public.profiles add column if not exists onboarded_at timestamptz;
alter table public.profiles add column if not exists last_seen_at timestamptz;

-- The app writes these under the user's own JWT, so they need column-level grants
-- consistent with parts 2-4. Neither is security-relevant: they are timestamps,
-- not entitlements.
grant update (onboarded_at, last_seen_at) on public.profiles to authenticated;
grant insert (onboarded_at, last_seen_at) on public.profiles to authenticated;


-- ═════════════════════════════════════════════════════════════════════════════
-- 3. VERIFY — last statement, so this is the result you will see.
-- ═════════════════════════════════════════════════════════════════════════════
-- Expect exactly 3 rows, one per index. Fewer means something did not apply.

select
  i.indexrelid::regclass::text as index_name,
  t.relname                    as table_name,
  i.indisunique                as is_unique
from pg_index i
join pg_class t on t.oid = i.indrelid
where t.relnamespace = 'public'::regnamespace
  and i.indexrelid::regclass::text in (
    'meal_logs_user_date_uniq',
    'user_supplements_user_name_uniq',
    'cooked_it_user_recipe_uniq'
  )
order by table_name;


-- ─────────────────────────────────────────────────────────────────────────────
-- AFTERWARDS
-- ─────────────────────────────────────────────────────────────────────────────
-- The app change that goes with this: setCalLogs now calls saveMealLogToSupabase
-- and removeMealLogFromSupabase. Those two functions were fully written and had
-- ZERO callers, so meal_logs was a read-only table — loadUserData merged rows back
-- in on every focus while nothing ever wrote one. That is why un-logging a prep day
-- did not stick: the local delete was immediately undone by the next merge.
--
-- To confirm it works: log a prep day in the app, then in the SQL editor run
--   select * from public.meal_logs order by created_at desc limit 5;
-- The row should be there. Un-log it and it should disappear.
