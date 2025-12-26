-- Storage policies for event-photos bucket
-- 
-- IMPORTANT: Before running this migration, ensure the "event-photos" bucket exists in Supabase Storage:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create bucket: "event-photos" (Public: Yes)
-- 
-- Then run this migration to add the storage policies.

-- Storage policies for event-photos bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload to event-photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-photos' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to event-photos
CREATE POLICY "Public can read event-photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-photos');

-- Allow authenticated users to update files in event-photos bucket
-- Users can update files they uploaded (owner = auth.uid())
-- Admins can update any files
CREATE POLICY "Users can update event-photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'event-photos' AND
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
  bucket_id = 'event-photos' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files in event-photos bucket
-- Users can delete files they uploaded (owner = auth.uid())
-- Admins can delete any files
CREATE POLICY "Users can delete event-photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-photos' AND
  auth.role() = 'authenticated' AND
  (
    owner = auth.uid() OR
    EXISTS(
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid() AND members.is_admin = true
    )
  )
);

