-- supabase-schema-fix-part11-RUN-THIS.sql
--
-- The subscriptions ledger. Paste the whole file, hit Run.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT IS BROKEN
-- ─────────────────────────────────────────────────────────────────────────────
-- The app grants access from profiles.tier, and that path works — which is why
-- none of this was noticed. The subscriptions table underneath it has been
-- failing silently since the first checkout:
--
--   1. stripe-webhook.js writes a column `at_risk` in four places
--      (:270, :325, :337, :484). No .sql file in the repo creates it. PostgREST
--      rejects the whole UPDATE with 42703, and the write at :270 does not even
--      capture its error. So invoice.payment_succeeded never touches the
--      subscriptions row, and downgradeUserToFree never marks it cancelled.
--
--   2. The status CHECK was written as ('active','cancelled',...) — two Ls,
--      British spelling. Stripe's API spells it `canceled`, and the webhook
--      writes Stripe's value straight through (sub.status at :270, :291, :365)
--      plus the literal "canceled" at :484. Every cancellation update fails the
--      constraint. The row stays `active` forever.
--
--      Stripe also emits `unpaid`, `incomplete`, `incomplete_expired` and
--      `paused`, none of which the CHECK allows either.
--
-- What that costs: send-new-drop.js emails everyone with status='active', so
-- cancelled customers keep getting product mail; renewal-reminder can email
-- them; restore-account.js restores access to anyone whose row is still
-- 'active' — which is every cancelled subscriber.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES
-- ─────────────────────────────────────────────────────────────────────────────
--   A. Adds subscriptions.at_risk (boolean, default false).
--   B. Replaces the status CHECK with the full set of values Stripe sends.
--      `cancelled` (two Ls) is kept in the list so any row that somehow got
--      that value by hand does not fail the constraint — then C normalises it.
--   C. Rewrites any 'cancelled' rows to Stripe's 'canceled' so every reader
--      in the codebase (restore-account.js:201 compares against "canceled")
--      sees one spelling.
--   D. Adds the index the webhook's most frequent lookup needs.
--
-- Everything is idempotent. Safe to run twice.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES NOT DO
-- ─────────────────────────────────────────────────────────────────────────────
-- It does not repair history. Any subscription that was cancelled before today
-- still shows 'active' here because the update never landed. Section E at the
-- bottom lists those candidates — rows marked active whose period ended more
-- than 3 days ago — so you can reconcile them against the Stripe dashboard.
-- The webhook cannot do this retroactively; Stripe will not resend old events.

-- ── A. at_risk ───────────────────────────────────────────────────────────────
alter table public.subscriptions
  add column if not exists at_risk boolean not null default false;

comment on column public.subscriptions.at_risk is
  'Set true on invoice.payment_failed, false on payment_succeeded / reactivation. Drives dunning email selection.';

-- ── B. status CHECK — Stripe's vocabulary ────────────────────────────────────
alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in (
    'active', 'trialing', 'past_due', 'canceled', 'unpaid',
    'incomplete', 'incomplete_expired', 'paused',
    -- legacy values from the original schema; kept so no existing row fails
    -- the constraint, then normalised by section C
    'cancelled', 'expired'
  ));

-- ── C. Normalise spelling ─────────────────────────────────────────────────────
update public.subscriptions
   set status = 'canceled'
 where status = 'cancelled';

-- ── D. Index for the webhook's hot path ─────────────────────────────────────
-- stripe_subscription_id already has a UNIQUE index. user_id + status is what
-- send-new-drop, renewal-reminder and downgradeUserToFree all filter on.
create index if not exists idx_subscriptions_user_status
  on public.subscriptions (user_id, status);


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY — last statements, so this is the result you will see.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Column and constraint present. Expect one row each.
select 'at_risk column'          as check_, count(*)::text as result
  from information_schema.columns
 where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'at_risk'
union all
select 'status CHECK allows canceled',
       case when pg_get_constraintdef(oid) like '%''canceled''%' then 'yes' else 'NO — still broken' end
  from pg_constraint
 where conname = 'subscriptions_status_check'
union all
select 'rows still spelled cancelled', count(*)::text
  from public.subscriptions where status = 'cancelled'
union all
select 'status distribution',
       coalesce(string_agg(status || '=' || n, ', ' order by status), '(no rows)')
  from (select status, count(*) n from public.subscriptions group by status) s;

-- E. Reconciliation candidates: marked active, period ended > 3 days ago.
--    These are the cancellations that never landed. Check each against Stripe.
select id, user_id, stripe_subscription_id, tier, status,
       current_period_end, cancel_at_period_end
  from public.subscriptions
 where status = 'active'
   and current_period_end is not null
   and current_period_end < now() - interval '3 days'
 order by current_period_end;
