-- Update get_edge_function_url to default to the project URL if not set
CREATE OR REPLACE FUNCTION get_edge_function_url()
RETURNS TEXT AS $$
DECLARE
  project_url TEXT;
  default_url TEXT := 'https://orfqogsarfztvfsthmtz.supabase.co';
BEGIN
  -- Try to get from database setting
  BEGIN
    SELECT current_setting('app.settings.supabase_url', true) INTO project_url;
    IF project_url IS NOT NULL AND project_url != '' THEN
      RETURN project_url || '/functions/v1/send-email';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- If not set, use default URL
  RETURN default_url || '/functions/v1/send-email';
END;
$$ LANGUAGE plpgsql;

-- Update comment to reflect the default behavior
COMMENT ON FUNCTION get_edge_function_url() IS 'Returns the URL for the send-email edge function. Uses app.settings.supabase_url if set, otherwise defaults to https://orfqogsarfztvfsthmtz.supabase.co';

