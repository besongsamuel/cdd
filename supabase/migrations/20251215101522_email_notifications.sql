-- Enable pg_net extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to get the Supabase project URL
-- Set this via: ALTER DATABASE current_database() SET app.settings.supabase_url = 'https://[project-ref].supabase.co';
-- You can also set app.settings.service_role_key for authentication
CREATE OR REPLACE FUNCTION get_edge_function_url()
RETURNS TEXT AS $$
DECLARE
  project_url TEXT;
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
  
  -- If not set, raise an error (user must configure)
  RAISE EXCEPTION 'app.settings.supabase_url must be set. Run: ALTER DATABASE % SET app.settings.supabase_url = ''https://[project-ref].supabase.co'';', current_database();
END;
$$ LANGUAGE plpgsql;

-- Generic function to call the edge function
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
  PERFORM net.http_post(
    url := edge_function_url,
    headers := headers_json,
    body := payload::text
  );
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to call email service: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for department join requests
CREATE OR REPLACE FUNCTION notify_department_join_request()
RETURNS TRIGGER AS $$
DECLARE
  dept_name TEXT;
  event_data JSONB;
BEGIN
  -- Get department name
  SELECT name INTO dept_name FROM departments WHERE id = NEW.department_id;
  
  -- Build event data
  event_data := jsonb_build_object(
    'department_id', NEW.department_id,
    'department_name', dept_name,
    'member_name', NEW.member_name,
    'member_email', NEW.member_email,
    'member_phone', NEW.member_phone,
    'created_at', NEW.created_at::text,
    'id', NEW.id::text
  );
  
  -- Notify email service
  PERFORM notify_email_service('department-join-request', event_data);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for ministry join requests
CREATE OR REPLACE FUNCTION notify_ministry_join_request()
RETURNS TRIGGER AS $$
DECLARE
  ministry_name TEXT;
  event_data JSONB;
BEGIN
  -- Get ministry name
  SELECT name INTO ministry_name FROM ministries WHERE id = NEW.ministry_id;
  
  -- Build event data
  event_data := jsonb_build_object(
    'ministry_id', NEW.ministry_id,
    'ministry_name', ministry_name,
    'member_name', NEW.member_name,
    'member_email', NEW.member_email,
    'member_phone', NEW.member_phone,
    'created_at', NEW.created_at::text,
    'id', NEW.id::text
  );
  
  -- Notify email service
  PERFORM notify_email_service('ministry-join-request', event_data);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for suggestions
CREATE OR REPLACE FUNCTION notify_suggestion()
RETURNS TRIGGER AS $$
DECLARE
  category_name TEXT;
  event_data JSONB;
BEGIN
  -- Get category name if category_id exists
  IF NEW.category_id IS NOT NULL THEN
    SELECT name INTO category_name FROM suggestion_categories WHERE id = NEW.category_id;
  ELSE
    category_name := NEW.custom_category;
  END IF;
  
  -- Build event data
  event_data := jsonb_build_object(
    'id', NEW.id::text,
    'category_id', NEW.category_id::text,
    'category_name', category_name,
    'custom_category', NEW.custom_category,
    'suggestion_text', NEW.suggestion_text,
    'submitter_name', NEW.submitter_name,
    'submitter_phone', NEW.submitter_phone,
    'member_id', NEW.member_id::text,
    'created_at', NEW.created_at::text
  );
  
  -- Notify email service
  PERFORM notify_email_service('suggestion', event_data);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for requests (prayer, support, testimony)
CREATE OR REPLACE FUNCTION notify_request()
RETURNS TRIGGER AS $$
DECLARE
  event_type TEXT;
  event_data JSONB;
BEGIN
  -- Map request type to event type
  CASE NEW.type
    WHEN 'prayer' THEN event_type := 'prayer-request';
    WHEN 'support' THEN event_type := 'support-request';
    WHEN 'testimony' THEN event_type := 'testimony-request';
    ELSE RETURN NEW; -- Unknown type, skip
  END CASE;
  
  -- Build event data
  event_data := jsonb_build_object(
    'id', NEW.id::text,
    'type', NEW.type::text,
    'content', NEW.content,
    'name', NEW.name,
    'email', NEW.email,
    'phone', NEW.phone,
    'status', NEW.status::text,
    'created_at', NEW.created_at::text
  );
  
  -- Notify email service
  PERFORM notify_email_service(event_type, event_data);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for donations
CREATE OR REPLACE FUNCTION notify_donation()
RETURNS TRIGGER AS $$
DECLARE
  category_name TEXT;
  event_data JSONB;
BEGIN
  -- Get category name if category_id exists
  IF NEW.category_id IS NOT NULL THEN
    SELECT name INTO category_name FROM donation_categories WHERE id = NEW.category_id;
  END IF;
  
  -- Build event data
  event_data := jsonb_build_object(
    'id', NEW.id::text,
    'amount', NEW.amount,
    'donor_name', NEW.donor_name,
    'donor_email', NEW.donor_email,
    'member_id', NEW.member_id::text,
    'category_id', NEW.category_id::text,
    'category_name', category_name,
    'etransfer_email', NEW.etransfer_email,
    'notes', NEW.notes,
    'status', NEW.status::text,
    'received_at', NEW.received_at::text,
    'created_at', NEW.created_at::text
  );
  
  -- Notify email service
  PERFORM notify_email_service('donation', event_data);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for contact submissions
CREATE OR REPLACE FUNCTION notify_contact_submission()
RETURNS TRIGGER AS $$
DECLARE
  event_data JSONB;
BEGIN
  -- Build event data
  event_data := jsonb_build_object(
    'id', NEW.id::text,
    'name', NEW.name,
    'email', NEW.email,
    'message', NEW.message,
    'created_at', NEW.created_at::text
  );
  
  -- Notify email service
  PERFORM notify_email_service('contact-submission', event_data);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_department_join_request ON department_join_requests;
CREATE TRIGGER trigger_notify_department_join_request
  AFTER INSERT ON department_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_department_join_request();

DROP TRIGGER IF EXISTS trigger_notify_ministry_join_request ON ministry_join_requests;
CREATE TRIGGER trigger_notify_ministry_join_request
  AFTER INSERT ON ministry_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_ministry_join_request();

DROP TRIGGER IF EXISTS trigger_notify_suggestion ON suggestions;
CREATE TRIGGER trigger_notify_suggestion
  AFTER INSERT ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION notify_suggestion();

DROP TRIGGER IF EXISTS trigger_notify_request ON requests;
CREATE TRIGGER trigger_notify_request
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_request();

DROP TRIGGER IF EXISTS trigger_notify_donation ON donations;
CREATE TRIGGER trigger_notify_donation
  AFTER INSERT ON donations
  FOR EACH ROW
  EXECUTE FUNCTION notify_donation();

DROP TRIGGER IF EXISTS trigger_notify_contact_submission ON contact_submissions;
CREATE TRIGGER trigger_notify_contact_submission
  AFTER INSERT ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_contact_submission();

-- Comments for documentation
COMMENT ON FUNCTION get_edge_function_url() IS 'Returns the URL for the send-email edge function. Set app.settings.supabase_url via ALTER DATABASE.';
COMMENT ON FUNCTION notify_email_service(TEXT, JSONB) IS 'Generic function to send email notifications via the edge function. Non-blocking.';
COMMENT ON TRIGGER trigger_notify_department_join_request ON department_join_requests IS 'Sends email notification when a new department join request is created.';
COMMENT ON TRIGGER trigger_notify_ministry_join_request ON ministry_join_requests IS 'Sends email notification when a new ministry join request is created.';
COMMENT ON TRIGGER trigger_notify_suggestion ON suggestions IS 'Sends email notification when a new suggestion is created.';
COMMENT ON TRIGGER trigger_notify_request ON requests IS 'Sends email notification when a new prayer, support, or testimony request is created.';
COMMENT ON TRIGGER trigger_notify_donation ON donations IS 'Sends email notification when a new donation is created.';
COMMENT ON TRIGGER trigger_notify_contact_submission ON contact_submissions IS 'Sends email notification when a new contact form submission is created.';

