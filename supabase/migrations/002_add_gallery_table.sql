-- Create gallery_photos table
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  caption TEXT,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on gallery_photos
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- Public read access for gallery_photos
CREATE POLICY "Public can read gallery_photos" ON gallery_photos
  FOR SELECT USING (true);

-- Admin write access (authenticated users can write)
CREATE POLICY "Authenticated users can insert gallery_photos" ON gallery_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update gallery_photos" ON gallery_photos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete gallery_photos" ON gallery_photos
  FOR DELETE USING (auth.role() = 'authenticated');





