-- Add profile_picture_position column to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS profile_picture_position JSONB 
DEFAULT '{"x": 50, "y": 50}'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN members.profile_picture_position IS 
'Profile picture positioning for display on members page. JSON with x and y percentage values (0-100)';

