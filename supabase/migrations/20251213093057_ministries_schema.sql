-- Create ministries table
CREATE TABLE ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ministry_members junction table
CREATE TABLE ministry_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID REFERENCES ministries(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  is_lead BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ministry_id, member_id)
);

-- Create ministry_join_requests table
CREATE TABLE ministry_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID REFERENCES ministries(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_email TEXT,
  member_phone TEXT,
  status department_request_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at on ministries
CREATE TRIGGER update_ministries_updated_at BEFORE UPDATE ON ministries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on ministry_join_requests
CREATE TRIGGER update_ministry_join_requests_updated_at BEFORE UPDATE ON ministry_join_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_join_requests ENABLE ROW LEVEL SECURITY;

-- Public can read active ministries
CREATE POLICY "Public can read active ministries" ON ministries
  FOR SELECT USING (is_active = true);

-- Public can insert join requests
CREATE POLICY "Public can insert ministry join requests" ON ministry_join_requests
  FOR INSERT WITH CHECK (true);

-- Authenticated users can read all ministries
CREATE POLICY "Authenticated users can read ministries" ON ministries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can manage ministries
CREATE POLICY "Authenticated users can insert ministries" ON ministries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update ministries" ON ministries
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete ministries" ON ministries
  FOR DELETE USING (auth.role() = 'authenticated');

-- Public can read ministry_members
CREATE POLICY "Public can read ministry_members" ON ministry_members
  FOR SELECT USING (true);

-- Authenticated users can manage ministry_members
CREATE POLICY "Authenticated users can insert ministry_members" ON ministry_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update ministry_members" ON ministry_members
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete ministry_members" ON ministry_members
  FOR DELETE USING (auth.role() = 'authenticated');

-- Authenticated users can read ministry join requests
CREATE POLICY "Authenticated users can read ministry join requests" ON ministry_join_requests
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can update ministry join requests
CREATE POLICY "Authenticated users can update ministry join requests" ON ministry_join_requests
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete ministry join requests" ON ministry_join_requests
  FOR DELETE USING (auth.role() = 'authenticated');

