-- Add member_id column to suggestions table for tracking member submissions
-- If member_id is NULL, the suggestion was submitted anonymously
ALTER TABLE suggestions
ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;

-- Add comment to explain the member_id field
COMMENT ON COLUMN suggestions.member_id IS 'ID of the member who submitted the suggestion. NULL if submitted anonymously.';

