-- Add image_position column to ministries table
ALTER TABLE ministries 
ADD COLUMN IF NOT EXISTS image_position JSONB 
DEFAULT '{"x": 50, "y": 50}'::jsonb;

-- Add image_position column to departments table
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS image_position JSONB 
DEFAULT '{"x": 50, "y": 50}'::jsonb;

-- Add comments explaining the columns
COMMENT ON COLUMN ministries.image_position IS 
'Image positioning for display on ministry detail page. JSON with x and y percentage values (0-100)';

COMMENT ON COLUMN departments.image_position IS 
'Image positioning for display on department detail page. JSON with x and y percentage values (0-100)';

