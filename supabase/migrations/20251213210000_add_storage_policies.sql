-- Storage policies for member-photos bucket
-- Allow authenticated users to upload images
-- This allows any authenticated user (including admins) to upload
CREATE POLICY "Authenticated users can upload to member-photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'member-photos' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to member-photos
CREATE POLICY "Public can read member-photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'member-photos');

-- Allow authenticated users to update files in member-photos bucket
-- Users can update files they uploaded (owner = auth.uid())
-- Admins can update any files
CREATE POLICY "Users can update member-photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'member-photos' AND
  auth.role() = 'authenticated' AND
  (
    owner = auth.uid() OR
    EXISTS(
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid() AND members.is_admin = true
    )
  )
)
WITH CHECK (
  bucket_id = 'member-photos' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files in member-photos bucket
-- Users can delete files they uploaded (owner = auth.uid())
-- Admins can delete any files
CREATE POLICY "Users can delete member-photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'member-photos' AND
  auth.role() = 'authenticated' AND
  (
    owner = auth.uid() OR
    EXISTS(
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid() AND members.is_admin = true
    )
  )
);



