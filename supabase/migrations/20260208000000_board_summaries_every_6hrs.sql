-- Update Board Summaries schedule: run every 6 hours from 6AM EST
-- 6AM EST = 11:00 UTC, then 12PM EST = 17:00 UTC, 6PM EST = 23:00 UTC, 12AM EST = 05:00 UTC
-- Cron: 0 5,11,17,23 * * * (at 05:00, 11:00, 17:00, 23:00 UTC)

SELECT cron.unschedule('board-summaries-daily');

SELECT cron.schedule(
  'board-summaries-daily',
  '0 5,11,17,23 * * *',
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

COMMENT ON EXTENSION pg_cron IS 'Enables scheduled jobs. Board summaries run every 6 hours (6AM, 12PM, 6PM, 12AM EST).';
