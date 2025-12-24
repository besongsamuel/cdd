-- Drop existing policies that conflict with our new user-specific and admin policies
-- Note: We keep the public read policy from the initial schema
DROP POLICY IF EXISTS "Users can read own member" ON members;
DROP POLICY IF EXISTS "Users can update own member" ON members;
DROP POLICY IF EXISTS "Authenticated users can insert members" ON members;
DROP POLICY IF EXISTS "Authenticated users can update members" ON members;
DROP POLICY IF EXISTS "Authenticated users can delete members" ON members;

-- Allow users to insert their own member record (during signup)
CREATE POLICY "Users can insert own member" ON members
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own member record
-- Note: Public read is already handled by "Public can read members" from initial schema
CREATE POLICY "Users can read own member" ON members
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update their own member record
CREATE POLICY "Users can update own member" ON members
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own member record
CREATE POLICY "Users can delete own member" ON members
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Admin policies for updating any member
-- Checks if the current user's member record has is_admin = true
CREATE POLICY "Admins can update any member" ON members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Admin policies for deleting any member
CREATE POLICY "Admins can delete any member" ON members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );




