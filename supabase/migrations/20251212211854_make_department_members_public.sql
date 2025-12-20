-- Make department_members viewable to public users
-- Drop the existing authenticated-only read policy
DROP POLICY IF EXISTS "Authenticated users can read department_members" ON department_members;

-- Create a new public read policy
CREATE POLICY "Public can read department_members" ON department_members
  FOR SELECT USING (true);



