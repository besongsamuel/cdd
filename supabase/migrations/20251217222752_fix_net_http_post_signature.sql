-- Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fix notify_email_service to use correct net.http_post signature
-- The body parameter should be jsonb, not text
CREATE OR REPLACE FUNCTION notify_email_service(event_type TEXT, event_data JSONB)
RETURNS void AS $$
DECLARE
  edge_function_url TEXT;
  payload JSONB;
  auth_key TEXT;
  headers_json JSONB;
BEGIN
  -- Get the edge function URL
  edge_function_url := get_edge_function_url();
  
  -- Build the payload
  payload := jsonb_build_object(
    'eventType', event_type,
    'eventData', event_data
  );
  
  -- Get service role key or anon key for authentication
  BEGIN
    SELECT current_setting('app.settings.service_role_key', true) INTO auth_key;
    IF auth_key IS NULL OR auth_key = '' THEN
      -- Fallback to anon key
      BEGIN
        SELECT current_setting('app.settings.anon_key', true) INTO auth_key;
      EXCEPTION WHEN OTHERS THEN
        auth_key := NULL;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    auth_key := NULL;
  END;
  
  -- Build headers
  headers_json := jsonb_build_object('Content-Type', 'application/json');
  IF auth_key IS NOT NULL AND auth_key != '' THEN
    headers_json := headers_json || jsonb_build_object('Authorization', 'Bearer ' || auth_key);
  END IF;
  
  -- Call the edge function asynchronously (non-blocking)
  -- Note: body parameter must be jsonb, not text
  -- Using positional parameters for better compatibility
  PERFORM net.http_post(
    edge_function_url,  -- url
    payload,            -- body (jsonb)
    '{}'::jsonb,        -- params (empty)
    headers_json        -- headers
  );
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  -- Include more details for debugging
  RAISE WARNING 'Failed to call email service. Error: %. SQL State: %. URL: %', 
    SQLERRM, SQLSTATE, edge_function_url;
END;
$$ LANGUAGE plpgsql;


