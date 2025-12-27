-- Remove the check-unseen-replies cron job
-- This cron job is being replaced by the daily board summaries

-- Unschedule the existing cron job
SELECT cron.unschedule('check-unseen-replies');

-- Comments
COMMENT ON EXTENSION pg_cron IS 'Board summaries have replaced the hourly unseen replies check.';

