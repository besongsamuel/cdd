-- Add member_id column to donations table for tracking member donations
-- If member_id is NULL, the donation was submitted anonymously or by a non-member
ALTER TABLE donations
ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;

-- Add comment to explain the member_id field
COMMENT ON COLUMN donations.member_id IS 'ID of the member who made the donation. NULL if submitted anonymously or by a non-member.';





