-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly digest to run every Saturday at 8:00 AM
-- Cron syntax: minute hour day-of-month month day-of-week
-- 0 8 * * 6 = Every Saturday at 8:00 AM
SELECT cron.schedule(
  'weekly-digest',
  '0 8 * * 6',
  $$SELECT send_weekly_digest();$$
);

-- Comment
COMMENT ON EXTENSION pg_cron IS 'Enables scheduled jobs. Weekly digest runs every Saturday at 8am.';

