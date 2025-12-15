-- Add email and phone columns to members table
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comments for documentation
COMMENT ON COLUMN members.email IS 'Optional email address for member contact';
COMMENT ON COLUMN members.phone IS 'Optional phone number for member contact';

