-- Update get_edge_function_url to return base URL without specific edge function
-- This allows the function to be reused for different edge functions
CREATE OR REPLACE FUNCTION get_edge_function_url()
RETURNS TEXT AS $$
DECLARE
  project_url TEXT;
  default_url TEXT := 'https://orfqogsarfztvfsthmtz.supabase.co';
BEGIN
  -- Try to get from app_settings table
  project_url := get_app_setting('supabase_url');
  
  IF project_url IS NOT NULL AND project_url != '' THEN
    RETURN project_url || '/functions/v1';
  END IF;
  
  -- If not set, use default URL
  RETURN default_url || '/functions/v1';
END;
$$ LANGUAGE plpgsql;

-- Update comment to reflect base URL behavior
COMMENT ON FUNCTION get_edge_function_url() IS 'Returns the base URL for edge functions (without specific function path). Uses app_settings table, defaults to https://orfqogsarfztvfsthmtz.supabase.co. Append the edge function name to use (e.g., get_edge_function_url() || ''/send-email'')';


