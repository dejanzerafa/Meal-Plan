-- ═════════════════════════════════════════════════════════════════════════════
-- SoulGainz — Supabase data-layer DIAGNOSTIC  (2026-09-05)
--
-- READ-ONLY. Every statement is a SELECT. No DDL, no DML, no functions created,
-- nothing altered. Safe to run on production as many times as you like.
--
-- Purpose: confirm, against the LIVE database, the findings of the repo-only
-- audit of the 19 .sql files, index.html and the 24 Netlify functions. The repo
-- cannot tell us which of two conflicting definitions of `events` or
-- `promo_codes` is live, which columns were added by hand in the dashboard, or
-- whether duplicate / orphan rows exist. This script answers those questions.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste the whole file.
--   The editor only DISPLAYS the result of the LAST statement, so:
--     * Press Run once as-is and you get SECTION 13 — the one-screen SUMMARY of
--       every duplicate / orphan / discrepancy / missing-column check.
--     * To see any other section, highlight that section's statement and Run.
--   Nothing here depends on anything else having run first.
--
-- ROBUSTNESS
--   Sections 10-13 use query_to_xml() to run each check dynamically, guarded by
--   to_regclass() / information_schema, so a check that refers to a table or
--   column that does not exist in your project is reported as "SKIPPED" instead
--   of aborting the script. query_to_xml is a built-in read-only function; the
--   SQL it runs is only ever a SELECT.
--
-- Sections
--    1  every table in public: exact row count, RLS state, policy count, owner
--    2  every column: type, nullable, default  (+ timestamp hygiene flags)
--    3  every index, unique or not, with definition
--    4  every foreign key with ON DELETE / ON UPDATE action
--    5  every CHECK constraint (subscriptions.status / tier live definition)
--    6  every RLS policy with USING and WITH CHECK expressions
--    7  every grant to anon / authenticated (table + column level), default
--       privileges, views and their security_invoker setting
--    8  triggers on auth.users and the function bodies behind them
--    9  schema drift: columns / tables the CODE uses, present or MISSING;
--       which of the two `events` / `promo_codes` shapes is live
--   10  expected unique constraints: present or MISSING
--   11  duplicate detection
--   12  orphan detection
--   13  discrepancy detection + ONE-SCREEN SUMMARY (last statement)
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 — every table in public: exact row count, RLS, policies, owner
-- ─────────────────────────────────────────────────────────────────────────────
select
  c.relname                                        as table_name,
  case c.relkind when 'r' then 'table' when 'v' then 'view'
                 when 'm' then 'matview' when 'p' then 'partitioned' end as kind,
  case when c.relkind in ('r','p') then
    (xpath('/row/n/text()',
       query_to_xml(format('select count(*) as n from %I.%I', n.nspname, c.relname),
                    false, true, '')))[1]::text::bigint
  end                                              as exact_row_count,
  c.relrowsecurity                                 as rls_enabled,
  c.relforcerowsecurity                            as rls_forced,
  (select count(*) from pg_policies p
     where p.schemaname = n.nspname and p.tablename = c.relname) as policy_count,
  pg_get_userbyid(c.relowner)                      as owner,
  pg_size_pretty(pg_total_relation_size(c.oid))    as total_size
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r','p','v','m')
order by c.relkind, c.relname;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 — every column per table: type, nullable, default, hygiene flags
--   flag = 'TIMESTAMP WITHOUT TZ'   column is `timestamp` not `timestamptz`
--   flag = 'NO DEFAULT'             a *_at / created / updated column with no default
--   flag = 'DATE AS TEXT'           a date-like column stored as text
-- ─────────────────────────────────────────────────────────────────────────────
select
  c.table_name,
  c.ordinal_position                as pos,
  c.column_name,
  c.data_type,
  c.character_maximum_length        as max_len,
  c.is_nullable,
  c.column_default,
  concat_ws(' | ',
    case when c.data_type = 'timestamp without time zone' then 'TIMESTAMP WITHOUT TZ' end,
    case when c.data_type like 'timestamp%' and c.column_default is null
          and c.column_name in ('created_at','updated_at','joined_at','sent_at','cooked_at','redeemed_at')
         then 'NO DEFAULT' end,
    case when c.data_type = 'text'
          and (c.column_name in ('date','dob','tier_expires') or c.column_name like '%_date')
         then 'DATE AS TEXT' end
  )                                 as flags
from information_schema.columns c
join information_schema.tables t
  on t.table_schema = c.table_schema and t.table_name = c.table_name
where c.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
order by c.table_name, c.ordinal_position;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3 — every index, unique or not
-- ─────────────────────────────────────────────────────────────────────────────
select
  t.relname                          as table_name,
  i.relname                          as index_name,
  ix.indisunique                     as is_unique,
  ix.indisprimary                    as is_primary,
  ix.indisvalid                      as is_valid,
  (select string_agg(a.attname, ', ' order by k.ord)
     from unnest(ix.indkey) with ordinality k(attnum, ord)
     join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum) as columns,
  pg_get_indexdef(ix.indexrelid)     as definition,
  pg_size_pretty(pg_relation_size(ix.indexrelid)) as size
from pg_index ix
join pg_class t on t.oid = ix.indrelid
join pg_class i on i.oid = ix.indexrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
order by t.relname, ix.indisprimary desc, ix.indisunique desc, i.relname;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4 — every foreign key with its ON DELETE / ON UPDATE action
--   Expect: anything keyed on a per-user id should point at auth.users(id)
--   or profiles(id) with ON DELETE CASCADE. 'NO ACTION' on a user-keyed FK
--   means deleting that user from auth will FAIL (blocked) or leave orphans.
-- ─────────────────────────────────────────────────────────────────────────────
select
  con.conname                                   as constraint_name,
  src_ns.nspname || '.' || src.relname          as from_table,
  (select string_agg(a.attname, ', ' order by k.ord)
     from unnest(con.conkey) with ordinality k(attnum, ord)
     join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum) as from_columns,
  dst_ns.nspname || '.' || dst.relname          as to_table,
  (select string_agg(a.attname, ', ' order by k.ord)
     from unnest(con.confkey) with ordinality k(attnum, ord)
     join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.attnum) as to_columns,
  case con.confdeltype
    when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE'
    when 'n' then 'SET NULL'  when 'd' then 'SET DEFAULT' end as on_delete,
  case con.confupdtype
    when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE'
    when 'n' then 'SET NULL'  when 'd' then 'SET DEFAULT' end as on_update,
  con.convalidated                               as validated
from pg_constraint con
join pg_class src      on src.oid = con.conrelid
join pg_namespace src_ns on src_ns.oid = src.relnamespace
join pg_class dst      on dst.oid = con.confrelid
join pg_namespace dst_ns on dst_ns.oid = dst.relnamespace
where con.contype = 'f'
  and src_ns.nspname = 'public'
order by from_table, constraint_name;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5 — every CHECK / UNIQUE / PK constraint (live definition)
--   Look at subscriptions_status_check: the webhook writes Stripe's spelling
--   'canceled' (one L) and also 'unpaid' / 'incomplete' / 'paused'. If the live
--   CHECK still says 'cancelled' those updates are rejected.
-- ─────────────────────────────────────────────────────────────────────────────
select
  rel.relname                     as table_name,
  con.conname                     as constraint_name,
  case con.contype when 'c' then 'CHECK' when 'u' then 'UNIQUE'
                   when 'p' then 'PRIMARY KEY' when 'x' then 'EXCLUSION' end as type,
  pg_get_constraintdef(con.oid)   as definition
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public'
  and con.contype in ('c','u','p','x')
order by rel.relname, con.contype, con.conname;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6 — every RLS policy with USING and WITH CHECK
--   Red flags:  qual = 'true' / with_check = 'true' -> applies to every row
--               roles = '{public}'       -> no TO clause, so anon is included
--               'not scoped to auth.uid()' -> row filter does not use the caller
--   Note: for FOR ALL / FOR UPDATE policies a NULL with_check means Postgres
--   re-uses the USING expression for new rows — that is fine, not a gap.
-- ─────────────────────────────────────────────────────────────────────────────
select
  p.tablename,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd,
  p.qual                                       as using_expr,
  p.with_check                                 as with_check_expr,
  concat_ws(' | ',
    case when p.qual = 'true' then 'USING(true)' end,
    case when p.with_check = 'true' then 'WITH CHECK(true)' end,
    case when p.cmd in ('ALL','UPDATE') and p.with_check is null then 'with_check inherits USING' end,
    case when p.roles = '{public}' then 'APPLIES TO anon' end,
    case when coalesce(p.qual, p.with_check) not like '%auth.uid()%'
          and coalesce(p.qual, p.with_check) not in ('true')
         then 'not scoped to auth.uid()' end
  )                                            as flags
from pg_policies p
where p.schemaname = 'public'
order by p.tablename, p.policyname;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7a — table-level grants to anon / authenticated
--   After parts 1-9 the ONLY rows here should be for: profiles (SELECT),
--   meal_logs, favourites, cooked_it, user_supplements (S/I/U/D) and, if the
--   in-app admin panel is meant to work, promo_codes. Anything else is drift.
-- ─────────────────────────────────────────────────────────────────────────────
select
  g.table_name,
  g.grantee,
  string_agg(g.privilege_type, ', ' order by g.privilege_type) as privileges
from information_schema.role_table_grants g
where g.table_schema = 'public'
  and g.grantee in ('anon','authenticated')
group by g.table_name, g.grantee
order by g.table_name, g.grantee;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7b — column-level grants to anon / authenticated (all tables)
--   profiles must NOT list tier, tier_via, tier_label, tier_expires, is_admin
--   under INSERT or UPDATE for either role.
-- ─────────────────────────────────────────────────────────────────────────────
select
  cp.table_name,
  cp.grantee,
  cp.privilege_type,
  string_agg(cp.column_name, ', ' order by cp.column_name) as columns,
  bool_or(cp.column_name in ('tier','tier_via','tier_label','tier_expires','is_admin')
          and cp.privilege_type in ('INSERT','UPDATE'))    as ENTITLEMENT_COLUMN_WRITABLE
from information_schema.column_privileges cp
where cp.table_schema = 'public'
  and cp.grantee in ('anon','authenticated')
group by cp.table_name, cp.grantee, cp.privilege_type
order by cp.table_name, cp.grantee, cp.privilege_type;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7c — default privileges (part 8 should have revoked these)
--   Expect: rows for anon/authenticated whose privileges are EMPTY or absent.
-- ─────────────────────────────────────────────────────────────────────────────
select
  pg_get_userbyid(d.defaclrole)   as granted_by_role,
  n.nspname                        as in_schema,
  case d.defaclobjtype when 'r' then 'tables' when 'S' then 'sequences'
                       when 'f' then 'functions' when 'T' then 'types' end as object_type,
  d.defaclacl::text                as acl
from pg_default_acl d
left join pg_namespace n on n.oid = d.defaclnamespace
order by 1,2,3;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7d — views: definition, security_invoker, and whether anon can read
--   user_overview / active_members / lapsed_members / broadcast_audience read
--   straight past RLS unless security_invoker = on. Part 6 revoked them; this
--   confirms it held.
-- ─────────────────────────────────────────────────────────────────────────────
select
  c.relname                                            as view_name,
  coalesce(
    (select bool_or(opt like 'security_invoker=%true%' or opt = 'security_invoker=on')
       from unnest(c.reloptions) opt), false)          as security_invoker,
  has_table_privilege('anon',          c.oid, 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_can_select,
  pg_get_viewdef(c.oid, true)                          as definition
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v','m')
order by c.relname;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 8 — triggers on auth.users and on public tables, with function source
--   Expect on_auth_user_created -> handle_new_user() inserting (id, email) into
--   profiles. If it is missing, profiles rows only exist for users who opened
--   the app after signup, and the "auth.users with no profile" orphan check in
--   section 12 will be non-zero.
-- ─────────────────────────────────────────────────────────────────────────────
select
  n.nspname || '.' || c.relname     as on_table,
  t.tgname                          as trigger_name,
  t.tgenabled                       as enabled_flag,
  pg_get_triggerdef(t.oid)          as trigger_def,
  p.proname                         as function_name,
  p.prosecdef                       as security_definer,
  pg_get_functiondef(p.oid)         as function_source
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal
  and n.nspname in ('auth','public')
order by 1, 2;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 9 — SCHEMA DRIFT: every table.column the CODE reads or writes.
--   status = MISSING  ->  that code path fails (PostgREST 400 / 42703) today.
--   Sources are file:line in the repo so you can see exactly what breaks.
-- ─────────────────────────────────────────────────────────────────────────────
with expected(tbl, col, used_by, note) as (values
  -- subscriptions: written by stripe-webhook.js
  ('subscriptions','at_risk',              'stripe-webhook.js:270,325,337,484', 'NOT in any .sql file — every update that includes it fails'),
  ('subscriptions','cancel_at_period_end', 'stripe-webhook.js:292 renewal-reminder.js:78', null),
  ('subscriptions','stripe_session_id',    'stripe-webhook.js:116', null),
  -- users: read by admin-list-users.js
  ('users','subscription_status',          'admin-list-users.js:72', 'NOT in any .sql file — admin-list-users returns 400 if missing'),
  ('users','plan_type',                    'admin-list-users.js:72', 'NOT in any .sql file — admin-list-users returns 400 if missing'),
  ('users','calc_used',                    'save-user.js check-user.js restore-account.js', 'analytics.sql / profiles_sync migration'),
  ('users','welcome_sent',                 'save-user.js:206', null),
  ('users','marketing_opt_in',             'save-user.js holiday-emails.js birthday-emails.js', null),
  ('users','date_of_birth',                'birthday-emails.js:80', 'nothing in the repo ever WRITES this column'),
  ('users','stripe_customer_id',           'stripe-webhook.js customer-portal.js', null),
  -- promo_codes: two conflicting CREATE TABLEs in the repo
  ('promo_codes','redeemed_by',            'redeem-promo.js:143', 'only in supabase/migrations/20260818 — if setup.sql created the table this is MISSING and redemption always returns 409'),
  ('promo_codes','redeemed_at',            'redeem-promo.js:144', 'same'),
  ('promo_codes','duration_days',          'redeem-promo.js index.html:13163', null),
  ('promo_codes','created_by',             'index.html:13164', null),
  -- events: two conflicting CREATE TABLEs in the repo
  ('events','event_name',                  'track-event.js:170', 'analytics.sql shape'),
  ('events','session_id',                  'track-event.js:171', 'analytics.sql shape'),
  ('events','email',                       'track-event.js:172', 'analytics.sql shape'),
  ('events','properties',                  'track-event.js:173', 'analytics.sql shape'),
  ('events','event_type',                  'stripe-webhook.js:188,227', 'supabase-schema.sql shape'),
  ('events','user_id',                     'stripe-webhook.js:187,226', 'supabase-schema.sql shape'),
  ('events','metadata',                    'stripe-webhook.js:189,228', 'supabase-schema.sql shape'),
  -- feedback: no CREATE TABLE anywhere in the repo
  ('feedback','category',                  'send-feedback.js:133', 'table has no DDL in the repo'),
  ('feedback','message',                   'send-feedback.js:134', null),
  ('feedback','email',                     'send-feedback.js:135', null),
  ('feedback','tier',                      'send-feedback.js:136', null),
  ('feedback','device',                    'send-feedback.js:137', null),
  ('feedback','tab',                       'send-feedback.js:138', null),
  -- profiles: written by the client under the user JWT and by the server
  ('profiles','onboarded_at',              'index.html:10397,14870', null),
  ('profiles','last_seen_at',              'index.html:14792', null),
  ('profiles','terms_accepted_at',         'supabase-migration.sql only', 'no code writes it — dead unless backfilled'),
  ('profiles','terms_version',             'supabase-migration.sql only', 'no code writes it'),
  ('profiles','is_admin',                  'supabase-setup.sql policy only', 'index.html uses a hard-coded ADMIN_EMAILS list, never this column'),
  ('profiles','macro_mode',                'index.html:10371', null),
  ('profiles','p_nudge',                   'index.html:10372', null),
  -- waitlist
  ('waitlist','joined_at',                 'waitlist.js:100 send-launch-email.js:68', null),
  ('waitlist','name',                      'waitlist.js:100', null),
  -- calc_email_sends
  ('calc_email_sends','sent_date',         'send-calc-followup.js:89', null),
  -- redemptions: only exists if supabase-setup.sql ran; embedded by admin panel
  ('redemptions','code',                   'index.html:13135 embeds redemptions(count)', 'embed needs an FK promo_codes<->redemptions which no .sql defines -> PGRST200'),
  -- recipe_unlocks: read but never written
  ('recipe_unlocks','recipe_id',           'restore-account.js:186', 'nothing in the repo ever INSERTs into recipe_unlocks')
)
select
  e.tbl, e.col,
  case
    when to_regclass('public.' || e.tbl) is null then 'TABLE MISSING'
    when c.column_name is null then 'COLUMN MISSING'
    else 'ok (' || c.data_type || ')'
  end                as status,
  e.used_by,
  e.note
from expected e
left join information_schema.columns c
  on c.table_schema = 'public' and c.table_name = e.tbl and c.column_name = e.col
order by (case when to_regclass('public.' || e.tbl) is null then 0 when c.column_name is null then 1 else 2 end), e.tbl, e.col;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 10 — expected UNIQUE constraints / indexes: present or MISSING
--   The client upserts with onConflict on the first six. Without a matching
--   unique index Postgres answers 42P10 and the app swallows it (part 10 was
--   written to fix three of these — this confirms it applied).
-- ─────────────────────────────────────────────────────────────────────────────
with expected(tbl, cols, why) as (values
  ('meal_logs',        'user_id, date',        'index.html:10428 onConflict user_id,date'),
  ('user_supplements', 'user_id, name',        'index.html:13649 onConflict user_id,name'),
  ('cooked_it',        'user_id, recipe_id',   'index.html:10418,15293 onConflict user_id,recipe_id'),
  ('favourites',       'user_id, recipe_id',   'index.html:10408,15283 onConflict user_id,recipe_id'),
  ('profiles',         'id',                   'index.html upsert onConflict id (PK)'),
  ('users',            'email',                'stripe-webhook.js:76 onConflict email; save-user.js relies on it'),
  ('waitlist',         'email',                'waitlist.js:101 onConflict email'),
  ('promo_codes',      'code',                 'redeem-promo.js lookup by code'),
  ('calc_email_sends', 'email, sent_date',     'send-calc-followup.js:93 relies on 23505'),
  ('subscriptions',    'stripe_subscription_id','stripe-webhook.js:123 relies on 23505 for retries'),
  ('subscriptions',    'stripe_session_id',    'stripe-webhook.js:123 relies on 23505 for retries'),
  ('birthday_codes',   'user_id, year',        'birthday-emails.js dedup'),
  ('recipe_unlocks',   'user_id, recipe_id',   'schema'),
  ('redemptions',      'user_id, code',        'schema')
),
live as (
  select t.relname as tbl,
         (select string_agg(a.attname, ', ' order by k.ord)
            from unnest(ix.indkey) with ordinality k(attnum, ord)
            join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum) as cols,
         i.relname as index_name
  from pg_index ix
  join pg_class t on t.oid = ix.indrelid
  join pg_class i on i.oid = ix.indexrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public' and ix.indisunique
)
select
  e.tbl, e.cols as unique_on,
  case
    when to_regclass('public.' || e.tbl) is null then 'TABLE MISSING'
    when l.index_name is null then 'MISSING — upsert/onConflict on this key fails with 42P10'
    else 'ok: ' || l.index_name
  end as status,
  e.why
from expected e
left join live l on l.tbl = e.tbl and l.cols = e.cols
order by (case when l.index_name is null then 0 else 1 end), e.tbl;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 11 — DUPLICATE detection (guarded; SKIPPED if table/column absent)
--   n      = number of duplicate groups
--   sample = up to 5 offending keys
-- ─────────────────────────────────────────────────────────────────────────────
with checks(section, name, needs_tables, needs_cols, q) as (values
  ('11 duplicates','profiles: same email (case-insensitive)',
     array['public.profiles'], array['profiles.email'],
     $q$ select lower(trim(email)) as k, count(*) as c from public.profiles where email is not null group by 1 having count(*) > 1 $q$),
  ('11 duplicates','users: same email (case-insensitive) — UNIQUE is case-sensitive so this CAN happen',
     array['public.users'], array['users.email'],
     $q$ select lower(trim(email)) as k, count(*) as c from public.users group by 1 having count(*) > 1 $q$),
  ('11 duplicates','users: same stripe_customer_id',
     array['public.users'], array['users.stripe_customer_id'],
     $q$ select stripe_customer_id as k, count(*) as c from public.users where stripe_customer_id is not null group by 1 having count(*) > 1 $q$),
  ('11 duplicates','waitlist: same email (case-insensitive)',
     array['public.waitlist'], array['waitlist.email'],
     $q$ select lower(trim(email)) as k, count(*) as c from public.waitlist group by 1 having count(*) > 1 $q$),
  ('11 duplicates','email_signups: same email (case-insensitive)',
     array['public.email_signups'], array['email_signups.email'],
     $q$ select lower(trim(email)) as k, count(*) as c from public.email_signups group by 1 having count(*) > 1 $q$),
  ('11 duplicates','subscriptions: >1 ACTIVE/trialing per user_id',
     array['public.subscriptions'], array['subscriptions.user_id','subscriptions.status'],
     $q$ select user_id::text as k, count(*) as c from public.subscriptions where status in ('active','trialing') group by 1 having count(*) > 1 $q$),
  ('11 duplicates','subscriptions: same stripe_subscription_id',
     array['public.subscriptions'], array['subscriptions.stripe_subscription_id'],
     $q$ select stripe_subscription_id as k, count(*) as c from public.subscriptions where stripe_subscription_id is not null group by 1 having count(*) > 1 $q$),
  ('11 duplicates','meal_logs: >1 row per (user_id, date)',
     array['public.meal_logs'], array['meal_logs.user_id','meal_logs.date'],
     $q$ select user_id::text || ' @ ' || date::text as k, count(*) as c from public.meal_logs group by 1 having count(*) > 1 $q$),
  ('11 duplicates','user_supplements: >1 row per (user_id, name)',
     array['public.user_supplements'], array['user_supplements.user_id','user_supplements.name'],
     $q$ select user_id::text || ' / ' || name as k, count(*) as c from public.user_supplements group by 1 having count(*) > 1 $q$),
  ('11 duplicates','user_supplements: >1 row per (user_id, lower(name)) — case-variant dupes',
     array['public.user_supplements'], array['user_supplements.user_id','user_supplements.name'],
     $q$ select user_id::text || ' / ' || lower(trim(name)) as k, count(*) as c from public.user_supplements group by 1 having count(*) > 1 $q$),
  ('11 duplicates','favourites: >1 row per (user_id, recipe_id)',
     array['public.favourites'], array['favourites.user_id','favourites.recipe_id'],
     $q$ select user_id::text || ' / ' || recipe_id as k, count(*) as c from public.favourites group by 1 having count(*) > 1 $q$),
  ('11 duplicates','cooked_it: >1 row per (user_id, recipe_id)',
     array['public.cooked_it'], array['cooked_it.user_id','cooked_it.recipe_id'],
     $q$ select user_id::text || ' / ' || recipe_id as k, count(*) as c from public.cooked_it group by 1 having count(*) > 1 $q$),
  ('11 duplicates','birthday_codes: >1 row per (user_id, year)',
     array['public.birthday_codes'], array['birthday_codes.user_id','birthday_codes.year'],
     $q$ select user_id::text || ' / ' || year::text as k, count(*) as c from public.birthday_codes group by 1 having count(*) > 1 $q$),
  ('11 duplicates','promo_codes: same code',
     array['public.promo_codes'], array['promo_codes.code'],
     $q$ select code as k, count(*) as c from public.promo_codes group by 1 having count(*) > 1 $q$),
  ('11 duplicates','calc_email_sends: >1 row per (email, sent_date)',
     array['public.calc_email_sends'], array['calc_email_sends.email','calc_email_sends.sent_date'],
     $q$ select email || ' @ ' || sent_date::text as k, count(*) as c from public.calc_email_sends group by 1 having count(*) > 1 $q$),
  ('11 duplicates','same email present in BOTH users and waitlist (overlap, not necessarily wrong)',
     array['public.users','public.waitlist'], array['users.email','waitlist.email'],
     $q$ select lower(u.email) as k, 1 as c from public.users u join public.waitlist w on lower(w.email) = lower(u.email) $q$),
  ('11 duplicates','same email present in BOTH users and email_signups',
     array['public.users','public.email_signups'], array['users.email','email_signups.email'],
     $q$ select lower(u.email) as k, 1 as c from public.users u join public.email_signups w on lower(w.email) = lower(u.email) $q$),
  ('11 duplicates','same email present in BOTH waitlist and email_signups',
     array['public.waitlist','public.email_signups'], array['waitlist.email','email_signups.email'],
     $q$ select lower(u.email) as k, 1 as c from public.waitlist u join public.email_signups w on lower(w.email) = lower(u.email) $q$)
),
evald as (
  select c.section, c.name,
    (select bool_and(to_regclass(t) is not null) from unnest(c.needs_tables) t) as tables_ok,
    (select bool_and(exists (select 1 from information_schema.columns ic
                              where ic.table_schema = 'public'
                                and ic.table_name  = split_part(col, '.', 1)
                                and ic.column_name = split_part(col, '.', 2)))
       from unnest(c.needs_cols) col) as cols_ok,
    c.q
  from checks c
)
select
  e.section, e.name,
  case when e.tables_ok and e.cols_ok then
    (xpath('/row/n/text()', query_to_xml(
       'select count(*) as n from (' || e.q || ') d', false, true, '')))[1]::text::bigint
  end as n,
  case when e.tables_ok and e.cols_ok then
    (xpath('/row/s/text()', query_to_xml(
       'select coalesce(string_agg(k || '' (x'' || c || '')'', '' | ''), '''') as s from (' || e.q || ' limit 5) d', false, true, '')))[1]::text
  else 'SKIPPED — table or column not present' end as sample
from evald e
order by e.name;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 12 — ORPHAN detection (guarded)
--   Rows whose owner no longer exists, or users who never got their linked rows.
-- ─────────────────────────────────────────────────────────────────────────────
with checks(section, name, needs_tables, needs_cols, q) as (values
  ('12 orphans','profiles.id not in auth.users',
     array['public.profiles','auth.users'], array['profiles.id'],
     $q$ select p.id::text as k, coalesce(p.email,'') as c from public.profiles p left join auth.users au on au.id = p.id where au.id is null $q$),
  ('12 orphans','auth.users with NO profiles row (trigger missing / failed)',
     array['public.profiles','auth.users'], array['profiles.id'],
     $q$ select au.id::text as k, coalesce(au.email,'') as c from auth.users au left join public.profiles p on p.id = au.id where p.id is null $q$),
  ('12 orphans','meal_logs.user_id not in auth.users',
     array['public.meal_logs','auth.users'], array['meal_logs.user_id'],
     $q$ select m.user_id::text as k, count(*)::text as c from public.meal_logs m left join auth.users au on au.id = m.user_id where au.id is null group by 1 $q$),
  ('12 orphans','favourites.user_id not in auth.users',
     array['public.favourites','auth.users'], array['favourites.user_id'],
     $q$ select m.user_id::text as k, count(*)::text as c from public.favourites m left join auth.users au on au.id = m.user_id where au.id is null group by 1 $q$),
  ('12 orphans','cooked_it.user_id not in auth.users',
     array['public.cooked_it','auth.users'], array['cooked_it.user_id'],
     $q$ select m.user_id::text as k, count(*)::text as c from public.cooked_it m left join auth.users au on au.id = m.user_id where au.id is null group by 1 $q$),
  ('12 orphans','user_supplements.user_id not in auth.users',
     array['public.user_supplements','auth.users'], array['user_supplements.user_id'],
     $q$ select m.user_id::text as k, count(*)::text as c from public.user_supplements m left join auth.users au on au.id = m.user_id where au.id is null group by 1 $q$),
  ('12 orphans','redemptions.user_id not in auth.users',
     array['public.redemptions','auth.users'], array['redemptions.user_id'],
     $q$ select m.user_id::text as k, count(*)::text as c from public.redemptions m left join auth.users au on au.id = m.user_id where au.id is null group by 1 $q$),
  ('12 orphans','promo_codes.created_by not in auth.users',
     array['public.promo_codes','auth.users'], array['promo_codes.created_by'],
     $q$ select m.code as k, m.created_by::text as c from public.promo_codes m left join auth.users au on au.id = m.created_by where m.created_by is not null and au.id is null $q$),
  ('12 orphans','promo_codes.redeemed_by not in auth.users',
     array['public.promo_codes','auth.users'], array['promo_codes.redeemed_by'],
     $q$ select m.code as k, m.redeemed_by::text as c from public.promo_codes m left join auth.users au on au.id = m.redeemed_by where m.redeemed_by is not null and au.id is null $q$),
  ('12 orphans','subscriptions.user_id not in users (users.id space, NOT auth)',
     array['public.subscriptions','public.users'], array['subscriptions.user_id'],
     $q$ select s.user_id::text as k, count(*)::text as c from public.subscriptions s left join public.users u on u.id = s.user_id where u.id is null group by 1 $q$),
  ('12 orphans','subscriptions whose users.email has NO auth.users account (paid, cannot sign in)',
     array['public.subscriptions','public.users','auth.users'], array['subscriptions.user_id','users.email'],
     $q$ select lower(u.email) as k, s.tier || '/' || s.status as c from public.subscriptions s join public.users u on u.id = s.user_id left join auth.users au on lower(au.email) = lower(u.email) where au.id is null $q$),
  ('12 orphans','subscriptions whose users.email has NO profiles row (entitlement had nowhere to land)',
     array['public.subscriptions','public.users','public.profiles'], array['subscriptions.user_id','users.email','profiles.email'],
     $q$ select lower(u.email) as k, s.tier || '/' || s.status as c from public.subscriptions s join public.users u on u.id = s.user_id left join public.profiles p on lower(p.email) = lower(u.email) where p.id is null $q$),
  ('12 orphans','birthday_codes.user_id not in users',
     array['public.birthday_codes','public.users'], array['birthday_codes.user_id'],
     $q$ select b.user_id::text as k, count(*)::text as c from public.birthday_codes b left join public.users u on u.id = b.user_id where u.id is null group by 1 $q$),
  ('12 orphans','events.user_id not in users (supabase-schema.sql shape only)',
     array['public.events','public.users'], array['events.user_id'],
     $q$ select e.user_id::text as k, count(*)::text as c from public.events e left join public.users u on u.id = e.user_id where e.user_id is not null and u.id is null group by 1 $q$),
  ('12 orphans','email_signups.user_id not in users',
     array['public.email_signups','public.users'], array['email_signups.user_id'],
     $q$ select e.user_id::text as k, count(*)::text as c from public.email_signups e left join public.users u on u.id = e.user_id where e.user_id is not null and u.id is null group by 1 $q$),
  ('12 orphans','recipe_unlocks.user_id not in users',
     array['public.recipe_unlocks','public.users'], array['recipe_unlocks.user_id'],
     $q$ select e.user_id::text as k, count(*)::text as c from public.recipe_unlocks e left join public.users u on u.id = e.user_id where u.id is null group by 1 $q$),
  ('12 orphans','users rows with no auth account AND no waitlist row (marketing-only leads via save-user)',
     array['public.users','auth.users','public.waitlist'], array['users.email','waitlist.email'],
     $q$ select lower(u.email) as k, coalesce(u.created_at::text,'') as c from public.users u left join auth.users au on lower(au.email) = lower(u.email) left join public.waitlist w on lower(w.email) = lower(u.email) where au.id is null and w.id is null $q$)
),
evald as (
  select c.section, c.name,
    (select bool_and(to_regclass(t) is not null) from unnest(c.needs_tables) t) as tables_ok,
    (select bool_and(exists (select 1 from information_schema.columns ic
                              where ic.table_schema = 'public'
                                and ic.table_name  = split_part(col, '.', 1)
                                and ic.column_name = split_part(col, '.', 2)))
       from unnest(c.needs_cols) col) as cols_ok,
    c.q
  from checks c
)
select
  e.section, e.name,
  case when e.tables_ok and e.cols_ok then
    (xpath('/row/n/text()', query_to_xml(
       'select count(*) as n from (' || e.q || ') d', false, true, '')))[1]::text::bigint
  end as n,
  case when e.tables_ok and e.cols_ok then
    (xpath('/row/s/text()', query_to_xml(
       'select coalesce(string_agg(k || '' ('' || c || '')'', '' | ''), '''') as s from (' || e.q || ' limit 5) d', false, true, '')))[1]::text
  else 'SKIPPED — table or column not present' end as sample
from evald e
order by e.name;


-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 13 — DISCREPANCY detection + ONE-SCREEN SUMMARY
--   This is the LAST statement, so it is what a single Run displays.
--   It re-runs sections 11 and 12 and adds the cross-table consistency checks.
--   Read the `verdict` column: anything that is not 'ok' or 'SKIPPED' is a
--   real inconsistency in the live data.
-- ─────────────────────────────────────────────────────────────────────────────
with checks(section, name, needs_tables, needs_cols, q) as (values
  -- ── 13a. email / identity consistency ─────────────────────────────────────
  ('13 discrepancy','profiles.email <> auth.users.email for the same id',
     array['public.profiles','auth.users'], array['profiles.email'],
     $q$ select p.id::text as k, coalesce(p.email,'<null>') || ' vs ' || coalesce(au.email,'<null>') as c from public.profiles p join auth.users au on au.id = p.id where lower(trim(coalesce(p.email,''))) is distinct from lower(trim(coalesce(au.email,''))) $q$),
  ('13 discrepancy','profiles.email is NULL (trigger did not fill it / row created by client without email)',
     array['public.profiles'], array['profiles.email'],
     $q$ select p.id::text as k, '' as c from public.profiles p where p.email is null or trim(p.email) = '' $q$),
  ('13 discrepancy','profiles.email not lower-cased or has whitespace (webhook joins on exact lowercase)',
     array['public.profiles'], array['profiles.email'],
     $q$ select p.email as k, p.id::text as c from public.profiles p where p.email is not null and p.email <> lower(trim(p.email)) $q$),
  ('13 discrepancy','users.email not lower-cased or has whitespace (save-user.js does NOT normalise; webhook does)',
     array['public.users'], array['users.email'],
     $q$ select u.email as k, u.id::text as c from public.users u where u.email <> lower(trim(u.email)) $q$),
  ('13 discrepancy','waitlist.email not lower-cased',
     array['public.waitlist'], array['waitlist.email'],
     $q$ select w.email as k, '' as c from public.waitlist w where w.email <> lower(trim(w.email)) $q$),
  ('13 discrepancy','users row matches a profile only case-INsensitively (exact-match joins in code miss it)',
     array['public.users','public.profiles'], array['users.email','profiles.email'],
     $q$ select u.email as k, p.email as c from public.users u join public.profiles p on lower(trim(p.email)) = lower(trim(u.email)) and p.email <> u.email $q$),
  ('13 discrepancy','first/last name differ between users and profiles for the same email',
     array['public.users','public.profiles'], array['users.first_name','profiles.first_name','users.last_name','profiles.last_name'],
     $q$ select lower(u.email) as k, coalesce(u.first_name,'')||' '||coalesce(u.last_name,'')||' vs '||coalesce(p.first_name,'')||' '||coalesce(p.last_name,'') as c from public.users u join public.profiles p on lower(p.email) = lower(u.email) where (u.first_name is not null or u.last_name is not null) and (p.first_name is not null or p.last_name is not null) and (coalesce(u.first_name,'') <> coalesce(p.first_name,'') or coalesce(u.last_name,'') <> coalesce(p.last_name,'')) $q$),
  ('13 discrepancy','auth.users raw_user_meta_data first_name differs from profiles.first_name',
     array['public.profiles','auth.users'], array['profiles.first_name'],
     $q$ select au.id::text as k, coalesce(au.raw_user_meta_data->>'first_name','')||' vs '||coalesce(p.first_name,'') as c from auth.users au join public.profiles p on p.id = au.id where au.raw_user_meta_data->>'first_name' is not null and coalesce(p.first_name,'') <> '' and au.raw_user_meta_data->>'first_name' <> p.first_name $q$),
  ('13 discrepancy','DOB in profiles.dob but users.date_of_birth is NULL for the same email (birthday emails never fire)',
     array['public.users','public.profiles'], array['users.date_of_birth','profiles.dob'],
     $q$ select lower(u.email) as k, coalesce(p.dob::text,'') as c from public.users u join public.profiles p on lower(p.email) = lower(u.email) where p.dob is not null and u.date_of_birth is null $q$),
  -- ── 13b. entitlement consistency ──────────────────────────────────────────
  ('13 discrepancy','profiles.tier <> tier of the LATEST subscriptions row for that email',
     array['public.users','public.profiles','public.subscriptions'], array['profiles.tier','subscriptions.tier','subscriptions.created_at'],
     $q$ select lower(u.email) as k, coalesce(p.tier,'<null>') || ' vs latest sub ' || s.tier || '/' || s.status as c from public.users u join public.profiles p on lower(p.email) = lower(u.email) join lateral (select tier, status from public.subscriptions where user_id = u.id order by created_at desc limit 1) s on true where coalesce(p.tier,'') is distinct from s.tier $q$),
  ('13 discrepancy','profiles.tier_via = stripe but NO active/trialing subscription for that email (cancelled but not downgraded, or sub row never written)',
     array['public.users','public.profiles','public.subscriptions'], array['profiles.tier_via','subscriptions.status'],
     $q$ select lower(p.email) as k, coalesce(p.tier,'') || ' exp ' || coalesce(p.tier_expires::text,'') as c from public.profiles p where p.tier_via = 'stripe' and not exists (select 1 from public.users u join public.subscriptions s on s.user_id = u.id where lower(u.email) = lower(p.email) and s.status in ('active','trialing')) $q$),
  ('13 discrepancy','ACTIVE subscription but profiles.tier is NULL for that email (paid, not entitled)',
     array['public.users','public.profiles','public.subscriptions'], array['profiles.tier','subscriptions.status'],
     $q$ select lower(u.email) as k, s.tier || ' since ' || s.created_at::date as c from public.subscriptions s join public.users u on u.id = s.user_id left join public.profiles p on lower(p.email) = lower(u.email) where s.status in ('active','trialing') and (p.id is null or p.tier is null) $q$),
  ('13 discrepancy','profiles.tier set but tier_expires is in the PAST (app treats as free; server never cleared it)',
     array['public.profiles'], array['profiles.tier','profiles.tier_expires'],
     $q$ select lower(coalesce(p.email,p.id::text)) as k, p.tier || ' expired ' || p.tier_expires::text as c from public.profiles p where p.tier is not null and p.tier_expires is not null and p.tier_expires::text <> '' and left(p.tier_expires::text,10)::date < current_date $q$),
  ('13 discrepancy','profiles.tier holds a value the app does not recognise (expects monthly/annual/dev/free)',
     array['public.profiles'], array['profiles.tier'],
     $q$ select coalesce(p.tier,'') as k, count(*)::text as c from public.profiles p where p.tier is not null and p.tier not in ('monthly','annual','dev','free') group by 1 $q$),
  ('13 discrepancy','profiles.is_admin = true (column is never read by code; policy on promo_codes depends on it)',
     array['public.profiles'], array['profiles.is_admin'],
     $q$ select coalesce(p.email,p.id::text) as k, '' as c from public.profiles p where p.is_admin = true $q$),
  ('13 discrepancy','subscriptions.status value distribution (look for canceled vs cancelled, unpaid, paused)',
     array['public.subscriptions'], array['subscriptions.status'],
     $q$ select coalesce(status,'<null>') as k, count(*)::text as c from public.subscriptions group by 1 $q$),
  ('13 discrepancy','subscriptions ACTIVE with current_period_end in the past (webhook status update never landed)',
     array['public.subscriptions'], array['subscriptions.status','subscriptions.current_period_end'],
     $q$ select coalesce(stripe_subscription_id, id::text) as k, current_period_end::date::text as c from public.subscriptions where status = 'active' and current_period_end is not null and current_period_end < now() $q$),
  ('13 discrepancy','subscriptions with tier outside monthly/annual (webhook only writes those two)',
     array['public.subscriptions'], array['subscriptions.tier'],
     $q$ select tier as k, count(*)::text as c from public.subscriptions where tier not in ('monthly','annual') group by 1 $q$),
  ('13 discrepancy','users with stripe_customer_id but NO subscriptions row',
     array['public.users','public.subscriptions'], array['users.stripe_customer_id'],
     $q$ select lower(u.email) as k, u.stripe_customer_id as c from public.users u where u.stripe_customer_id is not null and not exists (select 1 from public.subscriptions s where s.user_id = u.id) $q$),
  ('13 discrepancy','promo_codes inactive but redeemed_by NULL (deactivated by old client path, or deleted-then-recreated)',
     array['public.promo_codes'], array['promo_codes.active','promo_codes.redeemed_by'],
     $q$ select code as k, coalesce(label,'') as c from public.promo_codes where active = false and redeemed_by is null $q$),
  ('13 discrepancy','profiles.tier_via = promo but no promo_codes row redeemed_by this user',
     array['public.profiles','public.promo_codes'], array['profiles.tier_via','promo_codes.redeemed_by'],
     $q$ select coalesce(p.email,p.id::text) as k, coalesce(p.tier_label,'') as c from public.profiles p where p.tier_via = 'promo' and not exists (select 1 from public.promo_codes pc where pc.redeemed_by = p.id) $q$),
  -- ── 13c. consent / marketing ──────────────────────────────────────────────
  ('13 discrepancy','users.marketing_opt_in = true (schema default was TRUE; save-user now defaults FALSE — these may be unconsented)',
     array['public.users'], array['users.marketing_opt_in'],
     $q$ select lower(email) as k, coalesce(created_at::date::text,'') as c from public.users where marketing_opt_in = true $q$),
  ('13 discrepancy','users.date_of_birth populated (nothing in the repo writes it — expect 0)',
     array['public.users'], array['users.date_of_birth'],
     $q$ select lower(email) as k, date_of_birth::text as c from public.users where date_of_birth is not null $q$),
  -- ── 13d. timestamp sanity ─────────────────────────────────────────────────
  ('13 discrepancy','profiles.updated_at older than created_at, or NULL',
     array['public.profiles'], array['profiles.updated_at','profiles.created_at'],
     $q$ select p.id::text as k, coalesce(p.updated_at::text,'<null>') as c from public.profiles p where p.updated_at is null or p.updated_at < p.created_at $q$),
  ('13 discrepancy','meal_logs.date not in YYYY-MM-DD form (column is text)',
     array['public.meal_logs'], array['meal_logs.date'],
     $q$ select m.date::text as k, count(*)::text as c from public.meal_logs m where m.date::text !~ '^\d{4}-\d{2}-\d{2}$' group by 1 $q$),
  ('13 discrepancy','profiles.tier_expires mixed formats (bare date vs ISO timestamp — webhook and redeem-promo differ)',
     array['public.profiles'], array['profiles.tier_expires'],
     $q$ select case when length(p.tier_expires::text) = 10 then 'bare date' when p.tier_expires::text like '%T%' then 'ISO timestamp' else 'other: ' || p.tier_expires::text end as k, count(*)::text as c from public.profiles p where p.tier_expires is not null group by 1 $q$),

  -- ── 11 duplicates (repeated here for the one-screen summary) ──────────────
  ('11 duplicates','profiles: same email (case-insensitive)',
     array['public.profiles'], array['profiles.email'],
     $q$ select lower(trim(email)) as k, count(*)::text as c from public.profiles where email is not null group by 1 having count(*) > 1 $q$),
  ('11 duplicates','users: same email (case-insensitive)',
     array['public.users'], array['users.email'],
     $q$ select lower(trim(email)) as k, count(*)::text as c from public.users group by 1 having count(*) > 1 $q$),
  ('11 duplicates','subscriptions: >1 ACTIVE/trialing per user_id',
     array['public.subscriptions'], array['subscriptions.user_id','subscriptions.status'],
     $q$ select user_id::text as k, count(*)::text as c from public.subscriptions where status in ('active','trialing') group by 1 having count(*) > 1 $q$),
  ('11 duplicates','meal_logs: >1 row per (user_id, date)',
     array['public.meal_logs'], array['meal_logs.user_id','meal_logs.date'],
     $q$ select user_id::text || ' @ ' || date::text as k, count(*)::text as c from public.meal_logs group by 1 having count(*) > 1 $q$),
  ('11 duplicates','user_supplements: >1 row per (user_id, name)',
     array['public.user_supplements'], array['user_supplements.user_id','user_supplements.name'],
     $q$ select user_id::text || ' / ' || name as k, count(*)::text as c from public.user_supplements group by 1 having count(*) > 1 $q$),
  ('11 duplicates','favourites: >1 row per (user_id, recipe_id)',
     array['public.favourites'], array['favourites.user_id','favourites.recipe_id'],
     $q$ select user_id::text || ' / ' || recipe_id as k, count(*)::text as c from public.favourites group by 1 having count(*) > 1 $q$),
  ('11 duplicates','cooked_it: >1 row per (user_id, recipe_id)',
     array['public.cooked_it'], array['cooked_it.user_id','cooked_it.recipe_id'],
     $q$ select user_id::text || ' / ' || recipe_id as k, count(*)::text as c from public.cooked_it group by 1 having count(*) > 1 $q$),
  ('11 duplicates','email in BOTH users and waitlist',
     array['public.users','public.waitlist'], array['users.email','waitlist.email'],
     $q$ select lower(u.email) as k, '' as c from public.users u join public.waitlist w on lower(w.email) = lower(u.email) $q$),

  -- ── 12 orphans (repeated for the summary) ─────────────────────────────────
  ('12 orphans','profiles.id not in auth.users',
     array['public.profiles','auth.users'], array['profiles.id'],
     $q$ select p.id::text as k, coalesce(p.email,'') as c from public.profiles p left join auth.users au on au.id = p.id where au.id is null $q$),
  ('12 orphans','auth.users with NO profiles row',
     array['public.profiles','auth.users'], array['profiles.id'],
     $q$ select au.id::text as k, coalesce(au.email,'') as c from auth.users au left join public.profiles p on p.id = au.id where p.id is null $q$),
  ('12 orphans','meal_logs/favourites/cooked_it/user_supplements.user_id not in auth.users (combined)',
     array['public.meal_logs','public.favourites','public.cooked_it','public.user_supplements','auth.users'],
     array['meal_logs.user_id','favourites.user_id','cooked_it.user_id','user_supplements.user_id'],
     $q$ select t.tbl || ':' || t.user_id::text as k, count(*)::text as c from (select 'meal_logs' tbl, user_id from public.meal_logs union all select 'favourites', user_id from public.favourites union all select 'cooked_it', user_id from public.cooked_it union all select 'user_supplements', user_id from public.user_supplements) t left join auth.users au on au.id = t.user_id where au.id is null group by 1 $q$),
  ('12 orphans','subscriptions.user_id not in users',
     array['public.subscriptions','public.users'], array['subscriptions.user_id'],
     $q$ select s.user_id::text as k, count(*)::text as c from public.subscriptions s left join public.users u on u.id = s.user_id where u.id is null group by 1 $q$),
  ('12 orphans','subscriptions whose email has NO auth account',
     array['public.subscriptions','public.users','auth.users'], array['subscriptions.user_id','users.email'],
     $q$ select lower(u.email) as k, s.tier || '/' || s.status as c from public.subscriptions s join public.users u on u.id = s.user_id left join auth.users au on lower(au.email) = lower(u.email) where au.id is null $q$),
  ('12 orphans','subscriptions whose email has NO profiles row',
     array['public.subscriptions','public.users','public.profiles'], array['subscriptions.user_id','users.email','profiles.email'],
     $q$ select lower(u.email) as k, s.tier || '/' || s.status as c from public.subscriptions s join public.users u on u.id = s.user_id left join public.profiles p on lower(p.email) = lower(u.email) where p.id is null $q$),
  ('12 orphans','promo_codes.created_by / redeemed_by not in auth.users',
     array['public.promo_codes','auth.users'], array['promo_codes.created_by','promo_codes.redeemed_by'],
     $q$ select m.code as k, 'created_by=' || coalesce(m.created_by::text,'') || ' redeemed_by=' || coalesce(m.redeemed_by::text,'') as c from public.promo_codes m left join auth.users a1 on a1.id = m.created_by left join auth.users a2 on a2.id = m.redeemed_by where (m.created_by is not null and a1.id is null) or (m.redeemed_by is not null and a2.id is null) $q$),

  -- ── 9 / 10 schema drift (repeated for the summary, as counts of MISSING) ──
  ('09 schema drift','code-used columns MISSING from live schema (see section 9 for the list)',
     array['public.profiles'], array['profiles.id'],
     $q$ select e.tbl || '.' || e.col as k, '' as c from (values ('subscriptions','at_risk'),('users','subscription_status'),('users','plan_type'),('users','calc_used'),('users','welcome_sent'),('promo_codes','redeemed_by'),('promo_codes','redeemed_at'),('promo_codes','duration_days'),('events','event_name'),('events','properties'),('events','event_type'),('events','metadata'),('feedback','category'),('feedback','tab'),('profiles','onboarded_at'),('profiles','last_seen_at'),('waitlist','joined_at'),('calc_email_sends','sent_date')) e(tbl,col) where not exists (select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=e.tbl and c.column_name=e.col) $q$),
  ('10 unique keys','expected UNIQUE keys MISSING (see section 10 for the list)',
     array['public.profiles'], array['profiles.id'],
     $q$ select e.tbl || '(' || e.cols || ')' as k, '' as c from (values ('meal_logs','user_id, date'),('user_supplements','user_id, name'),('cooked_it','user_id, recipe_id'),('favourites','user_id, recipe_id'),('users','email'),('waitlist','email'),('promo_codes','code'),('calc_email_sends','email, sent_date'),('subscriptions','stripe_subscription_id'),('birthday_codes','user_id, year')) e(tbl,cols) where to_regclass('public.'||e.tbl) is not null and not exists (select 1 from pg_index ix join pg_class t on t.oid = ix.indrelid join pg_namespace n on n.oid = t.relnamespace where n.nspname='public' and t.relname = e.tbl and ix.indisunique and (select string_agg(a.attname, ', ' order by k.ord) from unnest(ix.indkey) with ordinality k(attnum, ord) join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum) = e.cols) $q$),
  ('07 grants','tables still granted to anon/authenticated OUTSIDE the six the client uses',
     array['public.profiles'], array['profiles.id'],
     $q$ select g.table_name || ' -> ' || g.grantee as k, string_agg(g.privilege_type, ',') as c from information_schema.role_table_grants g where g.table_schema='public' and g.grantee in ('anon','authenticated') and g.table_name not in ('profiles','meal_logs','favourites','cooked_it','user_supplements','promo_codes') group by 1 $q$),
  ('07 grants','profiles entitlement columns writable by anon/authenticated (must be 0)',
     array['public.profiles'], array['profiles.tier'],
     $q$ select cp.grantee || ':' || cp.privilege_type || ':' || cp.column_name as k, '' as c from information_schema.column_privileges cp where cp.table_schema='public' and cp.table_name='profiles' and cp.grantee in ('anon','authenticated') and cp.privilege_type in ('INSERT','UPDATE') and cp.column_name in ('tier','tier_via','tier_label','tier_expires','is_admin') $q$),
  ('06 policies','policies with USING (true) / WITH CHECK (true), or not scoped to auth.uid()',
     array['public.profiles'], array['profiles.id'],
     $q$ select p.tablename || '.' || p.policyname as k, coalesce(p.cmd,'') || ' roles=' || p.roles::text as c from pg_policies p where p.schemaname='public' and (p.qual = 'true' or p.with_check = 'true' or coalesce(p.qual, p.with_check) not like '%auth.uid()%') $q$),
  ('04 foreign keys','user-keyed FKs in public that are NOT ON DELETE CASCADE',
     array['public.profiles'], array['profiles.id'],
     $q$ select src.relname || '.' || (select string_agg(a.attname, ',') from unnest(con.conkey) k(attnum) join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum) || ' -> ' || dn.nspname || '.' || dst.relname as k, case con.confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' else con.confdeltype::text end as c from pg_constraint con join pg_class src on src.oid = con.conrelid join pg_namespace sn on sn.oid = src.relnamespace join pg_class dst on dst.oid = con.confrelid join pg_namespace dn on dn.oid = dst.relnamespace where con.contype = 'f' and sn.nspname = 'public' and con.confdeltype <> 'c' $q$),
  ('01 tables','tables in public with RLS DISABLED',
     array['public.profiles'], array['profiles.id'],
     $q$ select c.relname as k, '' as c from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity $q$)
),
evald as (
  select c.section, c.name,
    (select bool_and(to_regclass(t) is not null) from unnest(c.needs_tables) t) as tables_ok,
    (select bool_and(exists (select 1 from information_schema.columns ic
                              where ic.table_schema = 'public'
                                and ic.table_name  = split_part(col, '.', 1)
                                and ic.column_name = split_part(col, '.', 2)))
       from unnest(c.needs_cols) col) as cols_ok,
    c.q
  from checks c
),
result as (
  select
    e.section, e.name, e.tables_ok and e.cols_ok as runnable,
    case when e.tables_ok and e.cols_ok then
      (xpath('/row/n/text()', query_to_xml(
         'select count(*) as n from (' || e.q || ') d', false, true, '')))[1]::text::bigint
    end as n,
    case when e.tables_ok and e.cols_ok then
      (xpath('/row/s/text()', query_to_xml(
         'select coalesce(string_agg(k || case when c = '''' then '''' else '' ('' || c || '')'' end, '' | ''), '''') as s from (' || e.q || ' limit 5) d', false, true, '')))[1]::text
    end as sample
  from evald e
)
select
  r.section,
  r.name                                              as check_name,
  case
    when not r.runnable then 'SKIPPED (table/column absent)'
    when r.name like '%distribution%' or r.name like '%mixed formats%' then 'INFO'
    when r.n = 0 then 'ok'
    else 'FOUND ' || r.n
  end                                                 as verdict,
  r.n                                                 as count,
  coalesce(r.sample, '')                              as sample_up_to_5
from result r
order by
  case when not r.runnable then 3 when r.n > 0 then 0 when r.n = 0 then 2 else 1 end,
  r.section, r.name;

-- ═════════════════════════════════════════════════════════════════════════════
-- END. Nothing above modified anything.
-- ═════════════════════════════════════════════════════════════════════════════
