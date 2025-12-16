-- Create donation_status enum type
CREATE TYPE donation_status AS ENUM ('pending', 'received', 'verified');

-- Create donation_categories table
CREATE TABLE donation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create yearly_budgets table
CREATE TABLE yearly_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  category_id UUID REFERENCES donation_categories(id) ON DELETE CASCADE,
  target_amount DECIMAL(10,2) NOT NULL,
  allocated_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, category_id)
);

-- Create donations table
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10,2) NOT NULL,
  donor_name TEXT,
  donor_email TEXT,
  category_id UUID REFERENCES donation_categories(id) ON DELETE SET NULL,
  status donation_status DEFAULT 'pending',
  etransfer_email TEXT,
  notes TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at on donation_categories
CREATE TRIGGER update_donation_categories_updated_at BEFORE UPDATE ON donation_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on yearly_budgets
CREATE TRIGGER update_yearly_budgets_updated_at BEFORE UPDATE ON yearly_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE donation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Public read access for active donation categories
CREATE POLICY "Public can read active donation categories" ON donation_categories
  FOR SELECT USING (is_active = true);

-- Public insert access for donations
CREATE POLICY "Public can insert donations" ON donations
  FOR INSERT WITH CHECK (true);

-- Authenticated users can read all donation categories
CREATE POLICY "Authenticated users can read donation categories" ON donation_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can manage donation categories
CREATE POLICY "Authenticated users can insert donation categories" ON donation_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update donation categories" ON donation_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete donation categories" ON donation_categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Authenticated users can manage yearly budgets
CREATE POLICY "Authenticated users can read yearly budgets" ON yearly_budgets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert yearly budgets" ON yearly_budgets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update yearly budgets" ON yearly_budgets
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete yearly budgets" ON yearly_budgets
  FOR DELETE USING (auth.role() = 'authenticated');

-- Authenticated users can manage donations
CREATE POLICY "Authenticated users can read donations" ON donations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update donations" ON donations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete donations" ON donations
  FOR DELETE USING (auth.role() = 'authenticated');


