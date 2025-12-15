-- Create a function to insert member records during signup
-- This function runs with elevated privileges (SECURITY DEFINER) to bypass RLS
-- It verifies that the user_id exists in auth.users and matches the authenticated user (if session exists)
CREATE OR REPLACE FUNCTION create_member_for_user(
  p_name TEXT,
  p_type member_type,
  p_user_id UUID,
  p_is_admin BOOLEAN DEFAULT FALSE
)
RETURNS members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member members;
  v_user_exists BOOLEAN;
BEGIN
  -- Verify that the user_id exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'User ID does not exist in auth.users';
  END IF;
  
  -- If there's an active session, verify the user_id matches
  -- If no session (e.g., during signup before email confirmation), allow if user exists
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'User can only create member record for themselves';
  END IF;
  
  -- Check if member record already exists
  IF EXISTS(SELECT 1 FROM members WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Member record already exists for this user';
  END IF;
  
  -- Insert the member record
  INSERT INTO members (name, type, user_id, is_admin)
  VALUES (p_name, p_type, p_user_id, p_is_admin)
  RETURNING * INTO v_member;
  
  RETURN v_member;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_member_for_user TO authenticated;

-- Add a comment for documentation
COMMENT ON FUNCTION create_member_for_user IS 'Allows authenticated users to create their own member record during signup, bypassing RLS restrictions';

