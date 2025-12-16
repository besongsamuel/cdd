-- Create titles table
CREATE TABLE IF NOT EXISTS titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed titles table with predefined values
INSERT INTO titles (name, display_order) VALUES
  ('Regular Member', 1),
  ('Pastor', 2),
  ('Deacon', 3),
  ('Elder', 4),
  ('Minister', 5),
  ('Apostle', 6)
ON CONFLICT (name) DO NOTHING;

-- Add columns to members table
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS title_id UUID REFERENCES titles(id),
  ADD COLUMN IF NOT EXISTS landscape_picture_url TEXT;

-- Add unique constraint on user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'members_user_id_key'
  ) THEN
    ALTER TABLE members ADD CONSTRAINT members_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Enable RLS on titles table
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;

-- Public can read titles (for dropdown options)
CREATE POLICY "Public can read titles" ON titles
  FOR SELECT USING (true);

-- Users can read their own member record
CREATE POLICY "Users can read own member" ON members
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own member record
CREATE POLICY "Users can update own member" ON members
  FOR UPDATE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON COLUMN members.user_id IS 'Links member to Supabase auth user';
COMMENT ON COLUMN members.is_admin IS 'Flags admin members';
COMMENT ON COLUMN members.title_id IS 'Foreign key to titles table';
COMMENT ON COLUMN members.landscape_picture_url IS 'Landscape image for leaders';


