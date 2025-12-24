-- Schedule Unseen Replies Check
-- Uses pg_cron to run check_unseen_replies() hourly

-- Note: pg_cron extension must be enabled in Supabase
-- This can be enabled via Supabase dashboard or by running:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run hourly at minute 0
SELECT cron.schedule(
  'check-unseen-replies',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT check_unseen_replies();$$
);

-- Comments
COMMENT ON FUNCTION check_unseen_replies() IS 'Scheduled to run hourly via pg_cron to check for unseen replies';

