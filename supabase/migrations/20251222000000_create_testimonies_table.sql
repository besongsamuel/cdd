-- Testimonies Table
-- Stores user-submitted testimonies that can be featured on the landing page

CREATE TABLE testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_testimonies_featured_approved ON testimonies(is_featured, is_approved) WHERE is_featured = true AND is_approved = true;
CREATE INDEX idx_testimonies_display_order ON testimonies(display_order);
CREATE INDEX idx_testimonies_approved ON testimonies(is_approved);

-- Create trigger for updated_at
CREATE TRIGGER update_testimonies_updated_at BEFORE UPDATE ON testimonies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE testimonies ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert (submit testimonies)
CREATE POLICY "Public can insert testimonies" ON testimonies
  FOR INSERT WITH CHECK (true);

-- Policy: Public can read approved testimonies
CREATE POLICY "Public can read approved testimonies" ON testimonies
  FOR SELECT USING (is_approved = true);

-- Policy: Authenticated admins can read all testimonies
CREATE POLICY "Admins can read all testimonies" ON testimonies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid()
      AND members.is_admin = true
    )
  );

-- Policy: Authenticated admins can update all testimonies
CREATE POLICY "Admins can update testimonies" ON testimonies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid()
      AND members.is_admin = true
    )
  );

-- Policy: Authenticated admins can delete testimonies
CREATE POLICY "Admins can delete testimonies" ON testimonies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid()
      AND members.is_admin = true
    )
  );

-- Comments
COMMENT ON TABLE testimonies IS 'User-submitted testimonies that can be featured on the landing page';
COMMENT ON COLUMN testimonies.content IS 'The testimony text (2-3 lines recommended)';
COMMENT ON COLUMN testimonies.is_featured IS 'Whether this testimony appears in the landing page slider';
COMMENT ON COLUMN testimonies.is_approved IS 'Whether this testimony has been approved by an admin';
COMMENT ON COLUMN testimonies.display_order IS 'Order in which testimonies appear in the slider';
