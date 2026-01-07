-- Create outreach_events table
CREATE TABLE outreach_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create outreach_gallery_photos table
CREATE TABLE outreach_gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_event_id UUID NOT NULL REFERENCES outreach_events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_outreach_events_ministry_id ON outreach_events(ministry_id);
CREATE INDEX idx_outreach_gallery_photos_event_id ON outreach_gallery_photos(outreach_event_id);
CREATE INDEX idx_outreach_events_event_date ON outreach_events(event_date DESC);

-- Create trigger for updated_at on outreach_events
CREATE TRIGGER update_outreach_events_updated_at BEFORE UPDATE ON outreach_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on both tables
ALTER TABLE outreach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_gallery_photos ENABLE ROW LEVEL SECURITY;

-- Public read access for outreach_events
CREATE POLICY "Public can read outreach_events" ON outreach_events
  FOR SELECT USING (true);

-- Public read access for outreach_gallery_photos
CREATE POLICY "Public can read outreach_gallery_photos" ON outreach_gallery_photos
  FOR SELECT USING (true);

-- Admin-only write access for outreach_events
CREATE POLICY "Admins can insert outreach_events" ON outreach_events
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can update outreach_events" ON outreach_events
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete outreach_events" ON outreach_events
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

-- Admin-only write access for outreach_gallery_photos
CREATE POLICY "Admins can insert outreach_gallery_photos" ON outreach_gallery_photos
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can update outreach_gallery_photos" ON outreach_gallery_photos
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete outreach_gallery_photos" ON outreach_gallery_photos
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

-- Storage policies for outreach gallery photos
-- Use the existing ministry-images bucket or create outreach-gallery-photos bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload outreach gallery photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ministry-images' AND
  auth.role() = 'authenticated' AND
  is_admin(auth.uid())
);

-- Allow public read access to outreach gallery photos in ministry-images bucket
CREATE POLICY "Public can read outreach gallery photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ministry-images');

-- Allow admins to update outreach gallery photos
CREATE POLICY "Admins can update outreach gallery photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'ministry-images' AND
  auth.role() = 'authenticated' AND
  is_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'ministry-images' AND
  auth.role() = 'authenticated'
);

-- Allow admins to delete outreach gallery photos
CREATE POLICY "Admins can delete outreach gallery photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ministry-images' AND
  auth.role() = 'authenticated' AND
  is_admin(auth.uid())
);

