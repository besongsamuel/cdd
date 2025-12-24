-- Restrict member writes to admins only
-- Member create and update operations should go through the manage-member edge function
-- This migration removes user write policies and ensures only admins can write directly to the members table

-- Drop user write policies that are being replaced by edge function
DROP POLICY IF EXISTS "Users can insert own member" ON members;
DROP POLICY IF EXISTS "Users can update own member" ON members;
DROP POLICY IF EXISTS "Users can delete own member" ON members;

-- Drop the create_member_for_user RPC function (replaced by edge function)
DROP FUNCTION IF EXISTS create_member_for_user(TEXT, member_type, UUID, BOOLEAN);

-- Drop the user_exists_in_auth helper function (no longer needed)
DROP FUNCTION IF EXISTS user_exists_in_auth(UUID);

-- Add admin-only INSERT policy
-- This allows admins to insert members directly (though edge function is preferred)
CREATE POLICY "Admins can insert members" ON members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Note: The following policies are kept (from previous migrations):
-- - "Public can read members" (SELECT) - from initial schema
-- - "Users can read own member" (SELECT) - allows users to read their own record
-- - "Admins can update any member" (UPDATE) - allows admins to update any member
-- - "Admins can delete any member" (DELETE) - allows admins to delete any member




