-- Update departments with real images from Unsplash
-- Intercession: Prayer/intercession related image (hands praying)
UPDATE departments SET image_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&q=80' WHERE name = 'Intercession';

-- Moderation: Church service/ushering image (welcoming people)
UPDATE departments SET image_url = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop&q=80' WHERE name = 'Moderation';

-- Choir: Choir singing/music worship image (group singing)
UPDATE departments SET image_url = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&h=600&fit=crop&q=80' WHERE name = 'Choir';

-- Protocol: Event planning/organization image (planning/calendar)
UPDATE departments SET image_url = 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop&q=80' WHERE name = 'Protocol';

-- Media: Camera/photography/video image (camera equipment)
UPDATE departments SET image_url = 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=600&fit=crop&q=80' WHERE name = 'Media';

-- Assign members to departments based on their passions/interests
-- Intercession Department
INSERT INTO department_members (department_id, member_id, is_lead)
SELECT 
  d.id as department_id,
  m.id as member_id,
  CASE WHEN m.name = 'Elder Marie-Claire Nzamba' THEN true ELSE false END as is_lead
FROM departments d
CROSS JOIN members m
WHERE d.name = 'Intercession'
  AND m.name IN (
    'Elder Marie-Claire Nzamba', -- Leader
    'Sophie Bélanger',
    'Marie-France Lavoie',
    'Chantal Dubois',
    'Martine Bélanger'
  )
ON CONFLICT (department_id, member_id) DO NOTHING;

-- Moderation Department
INSERT INTO department_members (department_id, member_id, is_lead)
SELECT 
  d.id as department_id,
  m.id as member_id,
  CASE WHEN m.name = 'Elder Marc-André Tshisekedi' THEN true ELSE false END as is_lead
FROM departments d
CROSS JOIN members m
WHERE d.name = 'Moderation'
  AND m.name IN (
    'Elder Marc-André Tshisekedi', -- Leader
    'Michel Koffi',
    'François Tshisekedi',
    'André Ntumba'
  )
ON CONFLICT (department_id, member_id) DO NOTHING;

-- Choir Department
INSERT INTO department_members (department_id, member_id, is_lead)
SELECT 
  d.id as department_id,
  m.id as member_id,
  CASE WHEN m.name = 'Deacon Jean-Pierre Kabila' THEN true ELSE false END as is_lead
FROM departments d
CROSS JOIN members m
WHERE d.name = 'Choir'
  AND m.name IN (
    'Deacon Jean-Pierre Kabila', -- Leader
    'Emmanuel Ntumba',
    'Amélie Gagnon',
    'Daniel Kabila',
    'Valérie Gagnon'
  )
ON CONFLICT (department_id, member_id) DO NOTHING;

-- Protocol Department
INSERT INTO department_members (department_id, member_id, is_lead)
SELECT 
  d.id as department_id,
  m.id as member_id,
  CASE WHEN m.name = 'Pastor Sarah Mukendi' THEN true ELSE false END as is_lead
FROM departments d
CROSS JOIN members m
WHERE d.name = 'Protocol'
  AND m.name IN (
    'Pastor Sarah Mukendi', -- Leader
    'Catherine Tremblay',
    'Sarah Mwamba',
    'Sylvie Tshisekedi',
    'Isabelle Dubois'
  )
ON CONFLICT (department_id, member_id) DO NOTHING;

-- Media Department
INSERT INTO department_members (department_id, member_id, is_lead)
SELECT 
  d.id as department_id,
  m.id as member_id,
  CASE WHEN m.name = 'Pastor Daniel Mwamba' THEN true ELSE false END as is_lead
FROM departments d
CROSS JOIN members m
WHERE d.name = 'Media'
  AND m.name IN (
    'Pastor Daniel Mwamba', -- Leader
    'Élise Bélanger',
    'Marc Mwamba',
    'Emmanuel Ntumba'
  )
ON CONFLICT (department_id, member_id) DO NOTHING;



