-- Storage policies for ministry-images and department-images buckets
-- 
-- IMPORTANT: Before running this migration, create the following public buckets in Supabase Storage:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create bucket: "ministry-images" (Public: Yes)
-- 3. Create bucket: "department-images" (Public: Yes)
-- 
-- Then run this migration to add the storage policies.

-- Storage policies for ministry-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload to ministry-images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ministry-images' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to ministry-images
CREATE POLICY "Public can read ministry-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ministry-images');

-- Allow authenticated users to update files in ministry-images bucket
CREATE POLICY "Users can update ministry-images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'ministry-images' AND
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
  bucket_id = 'ministry-images' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files in ministry-images bucket
CREATE POLICY "Users can delete ministry-images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ministry-images' AND
  auth.role() = 'authenticated' AND
  (
    owner = auth.uid() OR
    EXISTS(
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid() AND members.is_admin = true
    )
  )
);

-- Storage policies for department-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload to department-images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'department-images' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to department-images
CREATE POLICY "Public can read department-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'department-images');

-- Allow authenticated users to update files in department-images bucket
CREATE POLICY "Users can update department-images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'department-images' AND
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
  bucket_id = 'department-images' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files in department-images bucket
CREATE POLICY "Users can delete department-images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'department-images' AND
  auth.role() = 'authenticated' AND
  (
    owner = auth.uid() OR
    EXISTS(
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid() AND members.is_admin = true
    )
  )
);

