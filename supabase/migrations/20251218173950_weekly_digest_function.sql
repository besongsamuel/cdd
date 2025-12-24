-- Weekly Digest Email System
-- Functions to collect weekly data and send digest emails

-- Function to escape HTML special characters
CREATE OR REPLACE FUNCTION escape_html(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  IF text_input IS NULL THEN
    RETURN '';
  END IF;
  RETURN replace(replace(replace(replace(replace(
    text_input,
    '&', '&amp;'),
    '<', '&lt;'),
    '>', '&gt;'),
    '"', '&quot;'),
    '''', '&#39;');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to format currency as CAD
CREATE OR REPLACE FUNCTION format_cad(amount NUMERIC)
RETURNS TEXT AS $$
BEGIN
  RETURN '$' || TO_CHAR(amount, 'FM999,999,999.00') || ' CAD';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to format date for display
CREATE OR REPLACE FUNCTION format_date_display(date_input TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(date_input, 'Month DD, YYYY');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get weekly digest data
CREATE OR REPLACE FUNCTION get_weekly_digest_data(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  prayer_data JSONB;
  support_data JSONB;
  testimony_data JSONB;
  donation_data JSONB;
  dept_join_data JSONB;
  ministry_join_data JSONB;
  suggestions_data JSONB;
  contact_data JSONB;
BEGIN
  -- Get prayer requests
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', COALESCE(name, 'Anonymous'),
      'content', content
    ) ORDER BY created_at
  ), '[]'::jsonb) INTO prayer_data
  FROM requests
  WHERE type = 'prayer'
    AND created_at >= start_date
    AND created_at < end_date;

  -- Get support requests
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', COALESCE(name, 'Anonymous'),
      'content', content
    ) ORDER BY created_at
  ), '[]'::jsonb) INTO support_data
  FROM requests
  WHERE type = 'support'
    AND created_at >= start_date
    AND created_at < end_date;

  -- Get testimony requests
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', COALESCE(name, 'Anonymous'),
      'content', content
    ) ORDER BY created_at
  ), '[]'::jsonb) INTO testimony_data
  FROM requests
  WHERE type = 'testimony'
    AND created_at >= start_date
    AND created_at < end_date;

  -- Get donations (count and total)
  SELECT jsonb_build_object(
    'count', COUNT(*),
    'total', COALESCE(SUM(amount), 0)
  ) INTO donation_data
  FROM donations
  WHERE created_at >= start_date
    AND created_at < end_date;

  -- Get department join requests (grouped by department)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'department_name', d.name,
      'members', member_list.members
    ) ORDER BY d.name
  ), '[]'::jsonb) INTO dept_join_data
  FROM (
    SELECT 
      djr.department_id,
      jsonb_agg(djr.member_name ORDER BY djr.created_at) as members
    FROM department_join_requests djr
    WHERE djr.created_at >= start_date
      AND djr.created_at < end_date
    GROUP BY djr.department_id
  ) member_list
  JOIN departments d ON d.id = member_list.department_id;

  -- Get ministry join requests (grouped by ministry)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'ministry_name', m.name,
      'members', member_list.members
    ) ORDER BY m.name
  ), '[]'::jsonb) INTO ministry_join_data
  FROM (
    SELECT 
      mjr.ministry_id,
      jsonb_agg(mjr.member_name ORDER BY mjr.created_at) as members
    FROM ministry_join_requests mjr
    WHERE mjr.created_at >= start_date
      AND mjr.created_at < end_date
    GROUP BY mjr.ministry_id
  ) member_list
  JOIN ministries m ON m.id = member_list.ministry_id;

  -- Get suggestions
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'submitter_name', COALESCE(s.submitter_name, 'Anonymous'),
      'category_name', COALESCE(sc.name, s.custom_category, 'General'),
      'suggestion_text', s.suggestion_text
    ) ORDER BY s.created_at
  ), '[]'::jsonb) INTO suggestions_data
  FROM suggestions s
  LEFT JOIN suggestion_categories sc ON s.category_id = sc.id
  WHERE s.created_at >= start_date
    AND s.created_at < end_date;

  -- Get contact submissions
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'name', name,
      'email', email,
      'message', message
    ) ORDER BY created_at
  ), '[]'::jsonb) INTO contact_data
  FROM contact_submissions
  WHERE created_at >= start_date
    AND created_at < end_date;

  -- Build result
  result := jsonb_build_object(
    'prayer_requests', prayer_data,
    'support_requests', support_data,
    'testimony_requests', testimony_data,
    'donations', donation_data,
    'department_join_requests', dept_join_data,
    'ministry_join_requests', ministry_join_data,
    'suggestions', suggestions_data,
    'contact_submissions', contact_data
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to build HTML sections for digest
CREATE OR REPLACE FUNCTION build_digest_html_sections(data JSONB)
RETURNS JSONB AS $$
DECLARE
  html_result JSONB;
  prayer_html TEXT := '';
  support_html TEXT := '';
  testimony_html TEXT := '';
  donations_html TEXT := '';
  dept_join_html TEXT := '';
  ministry_join_html TEXT := '';
  suggestions_html TEXT := '';
  contact_html TEXT := '';
  prayer_requests JSONB;
  support_requests JSONB;
  testimony_requests JSONB;
  donations JSONB;
  dept_joins JSONB;
  ministry_joins JSONB;
  suggestions JSONB;
  contact_subs JSONB;
  item JSONB;
  dept_item JSONB;
  ministry_item JSONB;
  member_name TEXT;
  donation_count INTEGER;
  donation_total NUMERIC;
BEGIN
  prayer_requests := data->'prayer_requests';
  support_requests := data->'support_requests';
  testimony_requests := data->'testimony_requests';
  donations := data->'donations';
  dept_joins := data->'department_join_requests';
  ministry_joins := data->'ministry_join_requests';
  suggestions := data->'suggestions';
  contact_subs := data->'contact_submissions';

  -- Build Prayer Requests HTML
  IF COALESCE(jsonb_array_length(COALESCE(prayer_requests, '[]'::jsonb)), 0) > 0 THEN
    prayer_html := '<div style="background-color: #fff5f5; border-left: 4px solid #e74c3c; padding: 25px; border-radius: 8px; margin-bottom: 25px;">';
    prayer_html := prayer_html || '<h3 style="color: #e74c3c; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;"><span>🙏</span> Prayer Requests (' || COALESCE(jsonb_array_length(prayer_requests), 0) || ')</h3>';
    FOR item IN SELECT * FROM jsonb_array_elements(prayer_requests)
    LOOP
      prayer_html := prayer_html || '<div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #ffe0e0;">';
      prayer_html := prayer_html || '<p style="margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 15px;">' || escape_html(item->>'name') || '</p>';
      prayer_html := prayer_html || '<p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">' || escape_html(item->>'content') || '</p>';
      prayer_html := prayer_html || '</div>';
    END LOOP;
    prayer_html := prayer_html || '</div>';
  END IF;

  -- Build Support Requests HTML
  IF COALESCE(jsonb_array_length(COALESCE(support_requests, '[]'::jsonb)), 0) > 0 THEN
    support_html := '<div style="background-color: #fff9e6; border-left: 4px solid #f39c12; padding: 25px; border-radius: 8px; margin-bottom: 25px;">';
    support_html := support_html || '<h3 style="color: #f39c12; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;"><span>💬</span> Support Requests (' || COALESCE(jsonb_array_length(support_requests), 0) || ')</h3>';
    FOR item IN SELECT * FROM jsonb_array_elements(support_requests)
    LOOP
      support_html := support_html || '<div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #ffe8cc;">';
      support_html := support_html || '<p style="margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 15px;">' || escape_html(item->>'name') || '</p>';
      support_html := support_html || '<p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">' || escape_html(item->>'content') || '</p>';
      support_html := support_html || '</div>';
    END LOOP;
    support_html := support_html || '</div>';
  END IF;

  -- Build Testimony Requests HTML
  IF COALESCE(jsonb_array_length(COALESCE(testimony_requests, '[]'::jsonb)), 0) > 0 THEN
    testimony_html := '<div style="background-color: #f0fdf4; border-left: 4px solid #16a085; padding: 25px; border-radius: 8px; margin-bottom: 25px;">';
    testimony_html := testimony_html || '<h3 style="color: #16a085; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;"><span>✨</span> Testimony Requests (' || COALESCE(jsonb_array_length(testimony_requests), 0) || ')</h3>';
    FOR item IN SELECT * FROM jsonb_array_elements(testimony_requests)
    LOOP
      testimony_html := testimony_html || '<div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #c6f6d5;">';
      testimony_html := testimony_html || '<p style="margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 15px;">' || escape_html(item->>'name') || '</p>';
      testimony_html := testimony_html || '<p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">' || escape_html(item->>'content') || '</p>';
      testimony_html := testimony_html || '</div>';
    END LOOP;
    testimony_html := testimony_html || '</div>';
  END IF;

  -- Build Donations HTML
  donation_count := (donations->>'count')::INTEGER;
  donation_total := (donations->>'total')::NUMERIC;
  IF donation_count > 0 THEN
    donations_html := '<div style="background-color: #f0fdf4; border-left: 4px solid #27ae60; padding: 25px; border-radius: 8px; margin-bottom: 25px;">';
    donations_html := donations_html || '<h3 style="color: #27ae60; font-size: 20px; font-weight: 600; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;"><span>💰</span> Donations</h3>';
    donations_html := donations_html || '<div style="background-color: #ffffff; padding: 20px; border-radius: 6px; border: 1px solid #c6f6d5;">';
    donations_html := donations_html || '<p style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;"><strong>Count:</strong> ' || donation_count || '</p>';
    donations_html := donations_html || '<p style="margin: 0; color: #27ae60; font-size: 20px; font-weight: 600;">Total: ' || format_cad(donation_total) || '</p>';
    donations_html := donations_html || '</div></div>';
  END IF;

  -- Build Department Join Requests HTML
  IF COALESCE(jsonb_array_length(COALESCE(dept_joins, '[]'::jsonb)), 0) > 0 THEN
    dept_join_html := '<div style="background-color: #eff6ff; border-left: 4px solid #3498db; padding: 25px; border-radius: 8px; margin-bottom: 25px;">';
    dept_join_html := dept_join_html || '<h3 style="color: #3498db; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;"><span>🏢</span> Department Join Requests</h3>';
    FOR dept_item IN SELECT * FROM jsonb_array_elements(dept_joins)
    LOOP
      dept_join_html := dept_join_html || '<div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #bfdbfe;">';
      dept_join_html := dept_join_html || '<p style="margin: 0 0 12px 0; font-weight: 600; color: #3498db; font-size: 16px;">' || escape_html(dept_item->>'department_name') || '</p>';
      dept_join_html := dept_join_html || '<ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px;">';
      FOR member_name IN SELECT * FROM jsonb_array_elements_text(dept_item->'members')
      LOOP
        dept_join_html := dept_join_html || '<li style="margin-bottom: 5px;">' || escape_html(member_name) || '</li>';
      END LOOP;
      dept_join_html := dept_join_html || '</ul></div>';
    END LOOP;
    dept_join_html := dept_join_html || '</div>';
  END IF;

  -- Build Ministry Join Requests HTML
  IF COALESCE(jsonb_array_length(COALESCE(ministry_joins, '[]'::jsonb)), 0) > 0 THEN
    ministry_join_html := '<div style="background-color: #faf5ff; border-left: 4px solid #9b59b6; padding: 25px; border-radius: 8px; margin-bottom: 25px;">';
    ministry_join_html := ministry_join_html || '<h3 style="color: #9b59b6; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;"><span>🙌</span> Ministry Join Requests</h3>';
    FOR ministry_item IN SELECT * FROM jsonb_array_elements(ministry_joins)
    LOOP
      ministry_join_html := ministry_join_html || '<div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #e9d5ff;">';
      ministry_join_html := ministry_join_html || '<p style="margin: 0 0 12px 0; font-weight: 600; color: #9b59b6; font-size: 16px;">' || escape_html(ministry_item->>'ministry_name') || '</p>';
      ministry_join_html := ministry_join_html || '<ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px;">';
      FOR member_name IN SELECT * FROM jsonb_array_elements_text(ministry_item->'members')
      LOOP
        ministry_join_html := ministry_join_html || '<li style="margin-bottom: 5px;">' || escape_html(member_name) || '</li>';
      END LOOP;
      ministry_join_html := ministry_join_html || '</ul></div>';
    END LOOP;
    ministry_join_html := ministry_join_html || '</div>';
  END IF;

  -- Build Suggestions HTML
  IF COALESCE(jsonb_array_length(COALESCE(suggestions, '[]'::jsonb)), 0) > 0 THEN
    suggestions_html := '<div style="background-color: #fff7ed; border-left: 4px solid #e67e22; padding: 25px; border-radius: 8px; margin-bottom: 25px;">';
    suggestions_html := suggestions_html || '<h3 style="color: #e67e22; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;"><span>💡</span> Suggestions (' || COALESCE(jsonb_array_length(suggestions), 0) || ')</h3>';
    FOR item IN SELECT * FROM jsonb_array_elements(suggestions)
    LOOP
      suggestions_html := suggestions_html || '<div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #fed7aa;">';
      suggestions_html := suggestions_html || '<p style="margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 15px;">' || escape_html(item->>'submitter_name') || ' <span style="color: #e67e22; font-weight: 400; font-size: 13px;">(' || escape_html(item->>'category_name') || ')</span></p>';
      suggestions_html := suggestions_html || '<p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">' || escape_html(item->>'suggestion_text') || '</p>';
      suggestions_html := suggestions_html || '</div>';
    END LOOP;
    suggestions_html := suggestions_html || '</div>';
  END IF;

  -- Build Contact Submissions HTML
  IF COALESCE(jsonb_array_length(COALESCE(contact_subs, '[]'::jsonb)), 0) > 0 THEN
    contact_html := '<div style="background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 25px; border-radius: 8px; margin-bottom: 25px;">';
    contact_html := contact_html || '<h3 style="color: #667eea; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;"><span>📧</span> Contact Submissions (' || COALESCE(jsonb_array_length(contact_subs), 0) || ')</h3>';
    FOR item IN SELECT * FROM jsonb_array_elements(contact_subs)
    LOOP
      contact_html := contact_html || '<div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #c7d2fe;">';
      contact_html := contact_html || '<p style="margin: 0 0 8px 0; font-weight: 600; color: #2c3e50; font-size: 15px;">' || escape_html(item->>'name') || '</p>';
      contact_html := contact_html || '<p style="margin: 0 0 8px 0; color: #667eea; font-size: 14px;"><a href="mailto:' || escape_html(item->>'email') || '" style="color: #667eea; text-decoration: none;">' || escape_html(item->>'email') || '</a></p>';
      contact_html := contact_html || '<p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">' || escape_html(item->>'message') || '</p>';
      contact_html := contact_html || '</div>';
    END LOOP;
    contact_html := contact_html || '</div>';
  END IF;

  -- Build result
  html_result := jsonb_build_object(
    'prayer_requests_html', prayer_html,
    'support_requests_html', support_html,
    'testimony_requests_html', testimony_html,
    'donations_html', donations_html,
    'department_join_requests_html', dept_join_html,
    'ministry_join_requests_html', ministry_join_html,
    'suggestions_html', suggestions_html,
    'contact_submissions_html', contact_html
  );

  RETURN html_result;
END;
$$ LANGUAGE plpgsql;

-- Function to send weekly digest
CREATE OR REPLACE FUNCTION send_weekly_digest()
RETURNS void AS $$
DECLARE
  week_start TIMESTAMP WITH TIME ZONE;
  week_end TIMESTAMP WITH TIME ZONE;
  digest_data JSONB;
  html_sections JSONB;
  event_data JSONB;
  has_data BOOLEAN := false;
BEGIN
  -- Calculate week range (last 7 days ending on Saturday)
  -- Week runs from previous Sunday 00:00:00 to Saturday 23:59:59
  -- Since we're sending on Saturday at 8am, we want the week that just completed
  -- Find the most recent Saturday (today if it's Saturday, or last Saturday)
  week_end := DATE_TRUNC('day', NOW());
  IF EXTRACT(DOW FROM week_end) != 6 THEN
    -- Not Saturday, go back to last Saturday
    -- DOW: 0=Sunday, 1=Monday, ..., 6=Saturday
    week_end := week_end - INTERVAL '1 day' * ((EXTRACT(DOW FROM week_end) + 1)::INTEGER);
  END IF;
  -- Set to end of Saturday (23:59:59.999)
  week_end := week_end + INTERVAL '1 day' - INTERVAL '1 millisecond';
  -- Week starts 7 days before (previous Sunday 00:00:00)
  week_start := week_end - INTERVAL '7 days';

  -- Get digest data
  digest_data := get_weekly_digest_data(week_start, week_end);

  -- Check if any data exists
  has_data := (
    COALESCE(jsonb_array_length(COALESCE(digest_data->'prayer_requests', '[]'::jsonb)), 0) > 0 OR
    COALESCE(jsonb_array_length(COALESCE(digest_data->'support_requests', '[]'::jsonb)), 0) > 0 OR
    COALESCE(jsonb_array_length(COALESCE(digest_data->'testimony_requests', '[]'::jsonb)), 0) > 0 OR
    COALESCE((digest_data->'donations'->>'count')::INTEGER, 0) > 0 OR
    COALESCE(jsonb_array_length(COALESCE(digest_data->'department_join_requests', '[]'::jsonb)), 0) > 0 OR
    COALESCE(jsonb_array_length(COALESCE(digest_data->'ministry_join_requests', '[]'::jsonb)), 0) > 0 OR
    COALESCE(jsonb_array_length(COALESCE(digest_data->'suggestions', '[]'::jsonb)), 0) > 0 OR
    COALESCE(jsonb_array_length(COALESCE(digest_data->'contact_submissions', '[]'::jsonb)), 0) > 0
  );

  -- If no data, don't send email
  IF NOT has_data THEN
    RAISE NOTICE 'No data for weekly digest. Week: % to %', week_start, week_end;
    RETURN;
  END IF;

  -- Build HTML sections
  html_sections := build_digest_html_sections(digest_data);

  -- Build event data for email service
  event_data := jsonb_build_object(
    'week_start_date', format_date_display(week_start),
    'week_end_date', format_date_display(week_end),
    'prayer_requests_html', COALESCE(html_sections->>'prayer_requests_html', ''),
    'support_requests_html', COALESCE(html_sections->>'support_requests_html', ''),
    'testimony_requests_html', COALESCE(html_sections->>'testimony_requests_html', ''),
    'donations_html', COALESCE(html_sections->>'donations_html', ''),
    'department_join_requests_html', COALESCE(html_sections->>'department_join_requests_html', ''),
    'ministry_join_requests_html', COALESCE(html_sections->>'ministry_join_requests_html', ''),
    'suggestions_html', COALESCE(html_sections->>'suggestions_html', ''),
    'contact_submissions_html', COALESCE(html_sections->>'contact_submissions_html', '')
  );

  -- Send email via notify_email_service
  PERFORM notify_email_service('weekly-digest', event_data);

  RAISE NOTICE 'Weekly digest sent successfully. Week: % to %', week_start, week_end;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION get_weekly_digest_data(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Collects weekly digest data from all relevant tables';
COMMENT ON FUNCTION build_digest_html_sections(JSONB) IS 'Builds HTML sections for weekly digest email template';
COMMENT ON FUNCTION send_weekly_digest() IS 'Sends weekly digest email to Elders and Apostles every Saturday at 8am';


