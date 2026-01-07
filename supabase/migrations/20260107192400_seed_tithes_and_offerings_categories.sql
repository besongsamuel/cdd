-- Seed Tithes and Offerings donation categories
-- These are fundamental giving categories for church donations

-- First, shift existing categories down by 2 to make room for Tithes and Offerings at the top
-- Only shift categories that aren't already Tithes or Offerings
UPDATE donation_categories
SET display_order = display_order + 2
WHERE name NOT IN ('Tithes', 'Offerings')
AND display_order >= 0;

-- Insert Tithes category if it doesn't exist
INSERT INTO donation_categories (name, description, is_active, display_order)
SELECT 
  'Tithes',
  'Regular giving of 10% of income as a biblical principle. Tithes support the general operations and ministries of the church.',
  true,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM donation_categories WHERE name = 'Tithes'
);

-- Insert Offerings category if it doesn't exist
INSERT INTO donation_categories (name, description, is_active, display_order)
SELECT 
  'Offerings',
  'Voluntary giving beyond tithes. Offerings can be designated to specific ministries, projects, or general church needs.',
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM donation_categories WHERE name = 'Offerings'
);

