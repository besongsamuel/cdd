-- Create financial_years table
CREATE TABLE financial_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  total_donations DECIMAL(12, 2),
  total_expenses DECIMAL(12, 2),
  budget_breakdown JSONB,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at on financial_years
CREATE TRIGGER update_financial_years_updated_at BEFORE UPDATE ON financial_years
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on financial_years
ALTER TABLE financial_years ENABLE ROW LEVEL SECURITY;

-- Public can read active financial years
CREATE POLICY "Public can read active financial years" ON financial_years
  FOR SELECT USING (is_active = true);

-- Authenticated users can read all financial years
CREATE POLICY "Authenticated users can read financial years" ON financial_years
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can manage financial years
CREATE POLICY "Authenticated users can insert financial years" ON financial_years
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update financial years" ON financial_years
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete financial years" ON financial_years
  FOR DELETE USING (auth.role() = 'authenticated');





