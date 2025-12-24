-- Link User to Member by Email Function
-- Automatically links auth users to existing members with matching email
-- 
-- Note: Direct triggers on auth.users are not allowed in Supabase.
-- This function should be called via:
-- 1. Supabase Database Webhook (configured in dashboard: Database > Webhooks)
-- 2. Or called from application code after user signup
-- 3. Or via Supabase Edge Function

-- Function to link auth user to member by email
-- Can be called with: SELECT link_user_to_member_by_email(user_id, user_email);
CREATE OR REPLACE FUNCTION link_user_to_member_by_email(
  p_user_id UUID,
  p_user_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Only proceed if email is provided
  IF p_user_email IS NULL OR p_user_email = '' THEN
    RETURN FALSE;
  END IF;

  -- Find a member with matching email and no existing user_id
  SELECT id INTO v_member_id
  FROM members
  WHERE LOWER(email) = LOWER(p_user_email)
  AND user_id IS NULL
  LIMIT 1;

  -- If a matching member is found, update their user_id
  IF v_member_id IS NOT NULL THEN
    UPDATE members
    SET user_id = p_user_id
    WHERE id = v_member_id;
    
    RAISE NOTICE 'Linked auth user % to member % by email %', p_user_id, v_member_id, p_user_email;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Function that can be called from a trigger on a different table
-- or from application code. This version takes the user_id from auth.uid()
CREATE OR REPLACE FUNCTION link_current_user_to_member_by_email()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_member_id UUID;
BEGIN
  -- Get current authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get user email from auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_user_email IS NULL OR v_user_email = '' THEN
    RETURN FALSE;
  END IF;

  -- Find a member with matching email and no existing user_id
  SELECT id INTO v_member_id
  FROM members
  WHERE LOWER(email) = LOWER(v_user_email)
  AND user_id IS NULL
  LIMIT 1;

  -- If a matching member is found, update their user_id
  IF v_member_id IS NOT NULL THEN
    UPDATE members
    SET user_id = v_user_id
    WHERE id = v_member_id;
    
    RAISE NOTICE 'Linked auth user % to member % by email %', v_user_id, v_member_id, v_user_email;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION link_user_to_member_by_email(UUID, TEXT) IS 'Links an auth user to an existing member by matching email. Returns true if linked, false otherwise. Call with user_id and email.';
COMMENT ON FUNCTION link_current_user_to_member_by_email() IS 'Links the currently authenticated user to an existing member by matching email. Can be called from application code after login.';

