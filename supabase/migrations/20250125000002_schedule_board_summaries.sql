-- Schedule Board Summaries Daily Email
-- Runs daily at 6pm EST (23:00 UTC during EST, 22:00 UTC during EDT)
-- Note: EST = UTC-5, EDT = UTC-4
-- Using 23:00 UTC which covers both (6pm EST = 23:00 UTC, 6pm EDT = 22:00 UTC)
-- For simplicity, using 23:00 UTC which will be 6pm EST or 7pm EDT

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function to run daily at 6pm EST (23:00 UTC)
-- The edge function will handle batch processing recursively
SELECT cron.schedule(
  'board-summaries-daily',
  '0 23 * * *',  -- Daily at 23:00 UTC (6pm EST / 7pm EDT)
  $$
  SELECT net.http_post(
    url := get_edge_function_url() || '/send-board-summaries',
    body := jsonb_build_object(
      'offset', 0,
      'iteration', 0,
      'startTime', extract(epoch from now())::bigint * 1000
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || get_app_setting('service_role_key')
    )
  );
  $$
);

-- Comments
COMMENT ON EXTENSION pg_cron IS 'Enables scheduled jobs. Board summaries run daily at 6pm EST.';

