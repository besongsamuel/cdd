-- Fix notify_email_service URL: get_edge_function_url() returns the base
-- (e.g. .../functions/v1). We must append the function path '/send-email'
-- so the request hits the send-email edge function.

CREATE OR REPLACE FUNCTION notify_email_service(event_type TEXT, event_data JSONB)
RETURNS void AS $$
DECLARE
  edge_function_url TEXT;
  payload JSONB;
  auth_key TEXT;
  headers_json JSONB;
BEGIN
  -- get_edge_function_url() returns base .../functions/v1; append function path
  edge_function_url := get_edge_function_url() || '/send-email';

  -- Build the payload
  payload := jsonb_build_object(
    'eventType', event_type,
    'eventData', event_data
  );

  -- Get service role key or anon key for authentication from app_settings
  auth_key := get_app_setting('service_role_key');
  IF auth_key IS NULL OR auth_key = '' THEN
    -- Fallback to anon key
    auth_key := get_app_setting('anon_key');
  END IF;

  -- Build headers
  headers_json := jsonb_build_object('Content-Type', 'application/json');
  IF auth_key IS NOT NULL AND auth_key != '' THEN
    headers_json := headers_json || jsonb_build_object('Authorization', 'Bearer ' || auth_key);
  END IF;

  -- Call the edge function asynchronously (non-blocking)
  PERFORM net.http_post(
    edge_function_url,
    payload,
    '{}'::jsonb,
    headers_json
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to call email service. Error: %. SQL State: %. URL: %',
    SQLERRM, SQLSTATE, edge_function_url;
END;
$$ LANGUAGE plpgsql;
