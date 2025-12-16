-- Create department_request_status enum type
CREATE TYPE department_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create department_members junction table
CREATE TABLE department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  is_lead BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, member_id)
);

-- Create department_join_requests table
CREATE TABLE department_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_email TEXT,
  member_phone TEXT,
  status department_request_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at on departments
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on department_join_requests
CREATE TRIGGER update_department_join_requests_updated_at BEFORE UPDATE ON department_join_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_join_requests ENABLE ROW LEVEL SECURITY;

-- Public can read active departments
CREATE POLICY "Public can read active departments" ON departments
  FOR SELECT USING (is_active = true);

-- Public can insert join requests
CREATE POLICY "Public can insert department join requests" ON department_join_requests
  FOR INSERT WITH CHECK (true);

-- Authenticated users can read all departments
CREATE POLICY "Authenticated users can read departments" ON departments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can manage departments
CREATE POLICY "Authenticated users can insert departments" ON departments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update departments" ON departments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete departments" ON departments
  FOR DELETE USING (auth.role() = 'authenticated');

-- Public can read department_members
CREATE POLICY "Public can read department_members" ON department_members
  FOR SELECT USING (true);

-- Authenticated users can manage department_members
CREATE POLICY "Authenticated users can insert department_members" ON department_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update department_members" ON department_members
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete department_members" ON department_members
  FOR DELETE USING (auth.role() = 'authenticated');

-- Authenticated users can read department join requests
CREATE POLICY "Authenticated users can read department join requests" ON department_join_requests
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can update department join requests
CREATE POLICY "Authenticated users can update department join requests" ON department_join_requests
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete department join requests" ON department_join_requests
  FOR DELETE USING (auth.role() = 'authenticated');


