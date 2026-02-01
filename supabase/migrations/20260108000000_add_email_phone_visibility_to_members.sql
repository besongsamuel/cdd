-- Add visibility columns to members table
ALTER TABLE members 
  ADD COLUMN IF NOT EXISTS is_email_visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_phone_visible BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN members.is_email_visible IS 'Controls whether the member''s email is visible to other members. Defaults to true.';
COMMENT ON COLUMN members.is_phone_visible IS 'Controls whether the member''s phone is visible to other members. Defaults to true.';

-- Set existing members to have visible email and phone by default
UPDATE members 
SET is_email_visible = true, is_phone_visible = true
WHERE is_email_visible IS NULL OR is_phone_visible IS NULL;
