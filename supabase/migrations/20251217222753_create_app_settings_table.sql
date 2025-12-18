-- Create app_settings table to store configuration values
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- Insert initial settings from .env file
INSERT INTO app_settings (key, value) VALUES
  ('supabase_url', 'https://orfqogsarfztvfsthmtz.supabase.co'),
  ('anon_key', 'sb_publishable_hxh6WLoH_ZzwfgAZrlwIag_baYBW0Xt'),
  ('service_role_key', '')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Enable RLS on app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage settings (for migrations and admin operations)
CREATE POLICY "Service role can manage app_settings" ON app_settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow reads through SECURITY DEFINER function (get_app_setting bypasses RLS)
-- Also allow service role and authenticated users direct reads if needed
CREATE POLICY "Allow reads for functions and authenticated users" ON app_settings
  FOR SELECT
  USING (true);

-- Helper function to get app setting value
CREATE OR REPLACE FUNCTION get_app_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value
  FROM app_settings
  WHERE key = setting_key;
  
  RETURN setting_value;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_edge_function_url to use app_settings table
CREATE OR REPLACE FUNCTION get_edge_function_url()
RETURNS TEXT AS $$
DECLARE
  project_url TEXT;
  default_url TEXT := 'https://orfqogsarfztvfsthmtz.supabase.co';
BEGIN
  -- Try to get from app_settings table
  project_url := get_app_setting('supabase_url');
  
  IF project_url IS NOT NULL AND project_url != '' THEN
    RETURN project_url || '/functions/v1/send-email';
  END IF;
  
  -- If not set, use default URL
  RETURN default_url || '/functions/v1/send-email';
END;
$$ LANGUAGE plpgsql;

-- Update notify_email_service to use app_settings table
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

-- Comments for documentation
COMMENT ON TABLE app_settings IS 'Stores application configuration settings that were previously stored as database settings';
COMMENT ON FUNCTION get_app_setting(TEXT) IS 'Helper function to retrieve a setting value from app_settings table';
COMMENT ON FUNCTION get_edge_function_url() IS 'Returns the URL for the send-email edge function. Uses app_settings table, defaults to https://orfqogsarfztvfsthmtz.supabase.co';
