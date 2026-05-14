-- Run this in Supabase SQL Editor to set up analytics
CREATE TABLE IF NOT EXISTS events (
  id bigserial PRIMARY KEY,
  session_id text,
  email text,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS events_email_idx ON events(email);
CREATE INDEX IF NOT EXISTS events_name_idx ON events(event_name);
CREATE INDEX IF NOT EXISTS events_created_idx ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS events_session_idx ON events(session_id);

-- Also add calc_used column to users table (needed by check-user.js)
ALTER TABLE users ADD COLUMN IF NOT EXISTS calc_used boolean DEFAULT false;

-- Useful analytics queries:
-- Top events last 7 days:
--   SELECT event_name, count(*) FROM events WHERE created_at > now()-'7 days'::interval GROUP BY 1 ORDER BY 2 DESC;
-- Upgrade modal → checkout conversion:
--   SELECT count(DISTINCT session_id) FILTER (WHERE event_name='upgrade_modal_opened') as modal_opens,
--          count(DISTINCT session_id) FILTER (WHERE event_name='checkout_started') as checkouts
--   FROM events WHERE created_at > now()-'30 days'::interval;
