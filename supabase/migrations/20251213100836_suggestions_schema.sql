-- Create suggestion_categories table
CREATE TABLE suggestion_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suggestions table
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES suggestion_categories(id) ON DELETE SET NULL,
  custom_category TEXT,
  suggestion_text TEXT NOT NULL,
  submitter_name TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at on suggestion_categories
CREATE TRIGGER update_suggestion_categories_updated_at BEFORE UPDATE ON suggestion_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on suggestions
CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE suggestion_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Public can read active suggestion categories
CREATE POLICY "Public can read active suggestion categories" ON suggestion_categories
  FOR SELECT USING (is_active = true);

-- Public can insert suggestions
CREATE POLICY "Public can insert suggestions" ON suggestions
  FOR INSERT WITH CHECK (true);

-- Authenticated users can read all suggestion categories
CREATE POLICY "Authenticated users can read suggestion categories" ON suggestion_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can manage suggestion categories
CREATE POLICY "Authenticated users can insert suggestion categories" ON suggestion_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update suggestion categories" ON suggestion_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete suggestion categories" ON suggestion_categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Authenticated users can read suggestions
CREATE POLICY "Authenticated users can read suggestions" ON suggestions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can update suggestions
CREATE POLICY "Authenticated users can update suggestions" ON suggestions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete suggestions" ON suggestions
  FOR DELETE USING (auth.role() = 'authenticated');





