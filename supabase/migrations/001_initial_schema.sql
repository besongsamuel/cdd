-- Create enum types
CREATE TYPE member_type AS ENUM ('leader', 'regular');
CREATE TYPE request_type AS ENUM ('prayer', 'support', 'testimony');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'completed');

-- Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type member_type NOT NULL,
  bio TEXT,
  picture_url TEXT,
  passions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regular_programs table
CREATE TABLE regular_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type request_type NOT NULL,
  content TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  status request_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_submissions table
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create church_info table
CREATE TABLE church_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_1_name TEXT NOT NULL DEFAULT 'Apostle Mireille Bisoka',
  founder_1_image_url TEXT,
  founder_2_name TEXT NOT NULL DEFAULT 'Pastor John Bisoka',
  founder_2_image_url TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial regular programs
INSERT INTO regular_programs (day, time, location, description, "order") VALUES
  ('Sunday', '9:30 AM - 1:00 PM', 'Church', 'Service', 1),
  ('Friday', '6:30 PM', 'Church', 'Prayers and Teachings', 2),
  ('Monday', '5:00 AM - 6:00 AM', 'Zoom', 'Morning Prayer', 3),
  ('Tuesday', '7:00 PM', 'Zoom', 'Evening Prayer and Teaching', 4),
  ('Wednesday', '5:00 AM - 6:00 AM', 'Zoom', 'Prayer', 5);

-- Insert initial church info
INSERT INTO church_info (description) VALUES
  ('Welcome to City of David, a vibrant community of believers dedicated to serving God and our community. We are committed to spreading the gospel and building strong relationships through worship, prayer, and fellowship.');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regular_programs_updated_at BEFORE UPDATE ON regular_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_church_info_updated_at BEFORE UPDATE ON church_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE regular_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_info ENABLE ROW LEVEL SECURITY;

-- Public read access for members, events, regular_programs, church_info
CREATE POLICY "Public can read members" ON members
  FOR SELECT USING (true);

CREATE POLICY "Public can read events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Public can read regular_programs" ON regular_programs
  FOR SELECT USING (true);

CREATE POLICY "Public can read church_info" ON church_info
  FOR SELECT USING (true);

-- Public insert access for requests and contact_submissions
CREATE POLICY "Public can insert requests" ON requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert contact_submissions" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Admin-only access for requests and contact_submissions (read)
-- Note: In production, you should check for admin role in auth.users metadata
-- For now, authenticated users can read (you can restrict this further)
CREATE POLICY "Authenticated users can read requests" ON requests
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read contact_submissions" ON contact_submissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin write access (authenticated users can write)
-- Note: In production, add proper admin role checking
CREATE POLICY "Authenticated users can insert members" ON members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update members" ON members
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete members" ON members
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update events" ON events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete events" ON events
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert regular_programs" ON regular_programs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update regular_programs" ON regular_programs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete regular_programs" ON regular_programs
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update requests" ON requests
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete requests" ON requests
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete contact_submissions" ON contact_submissions
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update church_info" ON church_info
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert church_info" ON church_info
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');


