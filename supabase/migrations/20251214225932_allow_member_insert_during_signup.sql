-- Alternative approach: Update RLS policy to allow member insert during signup
-- This policy allows inserting a member record if:
-- 1. The user_id matches the authenticated user (if session exists), OR
-- 2. The user_id exists in auth.users (for signup before email confirmation)

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert own member" ON members;

-- Create a more permissive policy that allows inserts during signup
-- This uses a function to check if the user_id exists in auth.users
CREATE OR REPLACE FUNCTION user_exists_in_auth(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION user_exists_in_auth TO authenticated;

-- Create policy that allows insert if user_id matches auth.uid() OR if user exists in auth.users
CREATE POLICY "Users can insert own member" ON members
  FOR INSERT 
  WITH CHECK (
    -- If there's an active session, user_id must match
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- If no active session (during signup), allow if user exists in auth.users
    (auth.uid() IS NULL AND user_exists_in_auth(user_id))
  );

