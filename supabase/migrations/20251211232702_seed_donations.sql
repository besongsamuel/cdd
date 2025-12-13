-- Seed donation categories (partners/projects)
INSERT INTO donation_categories (name, description, is_active, display_order) VALUES
  (
    'General Fund',
    'Support the general operations and ministries of the church. This fund helps with utilities, staff support, and day-to-day church activities.',
    true,
    1
  ),
  (
    'Building Fund',
    'Help us maintain and improve our church facilities. Your donations support building maintenance, renovations, and facility improvements.',
    true,
    2
  ),
  (
    'Youth Ministry',
    'Support our youth programs and activities. This includes youth conferences, outreach events, and discipleship programs for ages 13-25.',
    true,
    3
  ),
  (
    'Children''s Ministry',
    'Help us nurture the next generation. Your support enables Sunday school programs, children''s events, and educational materials.',
    true,
    4
  ),
  (
    'Mission Trips',
    'Support our mission trips and outreach efforts. Help us spread the gospel and serve communities locally and internationally.',
    true,
    5
  ),
  (
    'Pastoral Support',
    'Support our pastoral team and church leadership. This fund helps with pastoral care, training, and ministry development.',
    true,
    6
  ),
  (
    'Community Outreach',
    'Help us serve our local community through food programs, clothing drives, and other outreach initiatives.',
    true,
    7
  ),
  (
    'Worship Ministry',
    'Support our worship team and music ministry. Help us acquire instruments, sound equipment, and support our worship leaders.',
    true,
    8
  );

-- Seed yearly budgets for 2025
-- Using subqueries to get category IDs
INSERT INTO yearly_budgets (year, category_id, target_amount, allocated_amount, notes) VALUES
  (
    2025,
    (SELECT id FROM donation_categories WHERE name = 'General Fund' LIMIT 1),
    50000.00,
    12500.00,
    'Q1 allocation includes utilities and staff support'
  ),
  (
    2025,
    (SELECT id FROM donation_categories WHERE name = 'Building Fund' LIMIT 1),
    75000.00,
    15000.00,
    'Priority: Roof repairs and HVAC system upgrade'
  ),
  (
    2025,
    (SELECT id FROM donation_categories WHERE name = 'Youth Ministry' LIMIT 1),
    25000.00,
    5000.00,
    'Youth Conference 2025 and summer programs'
  ),
  (
    2025,
    (SELECT id FROM donation_categories WHERE name = 'Children''s Ministry' LIMIT 1),
    15000.00,
    3000.00,
    'Sunday school materials and VBS program'
  ),
  (
    2025,
    (SELECT id FROM donation_categories WHERE name = 'Mission Trips' LIMIT 1),
    35000.00,
    8000.00,
    'Summer mission trip to Haiti and local outreach'
  ),
  (
    2025,
    (SELECT id FROM donation_categories WHERE name = 'Pastoral Support' LIMIT 1),
    40000.00,
    10000.00,
    'Pastoral care, training, and development programs'
  ),
  (
    2025,
    (SELECT id FROM donation_categories WHERE name = 'Community Outreach' LIMIT 1),
    20000.00,
    4500.00,
    'Food bank, clothing drives, and community events'
  ),
  (
    2025,
    (SELECT id FROM donation_categories WHERE name = 'Worship Ministry' LIMIT 1),
    18000.00,
    4000.00,
    'New sound system and worship team resources'
  );

-- Seed sample donations (mix of statuses)
INSERT INTO donations (amount, donor_name, donor_email, category_id, status, etransfer_email, notes, received_at, created_at) VALUES
  -- Verified donations
  (
    500.00,
    'Marie-Claire Nzamba',
    'marie.claire@example.com',
    (SELECT id FROM donation_categories WHERE name = 'General Fund' LIMIT 1),
    'verified',
    'info@eglisecitededavid.com',
    'Monthly tithe - January 2025',
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE - INTERVAL '25 days'
  ),
  (
    1000.00,
    'Jean-Pierre Kabila',
    'jp.kabila@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Building Fund' LIMIT 1),
    'verified',
    'info@eglisecitededavid.com',
    'Building fund contribution',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE - INTERVAL '18 days'
  ),
  (
    250.00,
    'Sophie Bélanger',
    'sophie.b@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Youth Ministry' LIMIT 1),
    'verified',
    'info@eglisecitededavid.com',
    'Supporting youth conference',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE - INTERVAL '12 days'
  ),
  (
    150.00,
    'David Koffi',
    'david.koffi@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Children''s Ministry' LIMIT 1),
    'verified',
    'info@eglisecitededavid.com',
    NULL,
    CURRENT_DATE - INTERVAL '8 days',
    CURRENT_DATE - INTERVAL '10 days'
  ),
  -- Received donations (awaiting verification)
  (
    750.00,
    'Isabelle Dubois',
    'isabelle.d@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Mission Trips' LIMIT 1),
    'received',
    'info@eglisecitededavid.com',
    'Mission trip support - God bless',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '7 days'
  ),
  (
    300.00,
    'Emmanuel Ntumba',
    'emmanuel.n@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Worship Ministry' LIMIT 1),
    'received',
    'info@eglisecitededavid.com',
    'For worship equipment',
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE - INTERVAL '5 days'
  ),
  (
    200.00,
    NULL,
    NULL,
    (SELECT id FROM donation_categories WHERE name = 'Community Outreach' LIMIT 1),
    'received',
    'info@eglisecitededavid.com',
    'Anonymous donation for community programs',
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE - INTERVAL '4 days'
  ),
  -- Pending donations (just submitted)
  (
    100.00,
    'Marie-France Lavoie',
    'mf.lavoie@example.com',
    (SELECT id FROM donation_categories WHERE name = 'General Fund' LIMIT 1),
    'pending',
    'info@eglisecitededavid.com',
    'Monthly offering',
    NULL,
    CURRENT_DATE - INTERVAL '1 day'
  ),
  (
    500.00,
    'Jean-Baptiste Mbuyi',
    'jb.mbuyi@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Building Fund' LIMIT 1),
    'pending',
    'info@eglisecitededavid.com',
    'Building fund - will send eTransfer today',
    NULL,
    CURRENT_DATE
  ),
  (
    75.00,
    NULL,
    'donor@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Pastoral Support' LIMIT 1),
    'pending',
    'info@eglisecitededavid.com',
    'Thank you for your ministry',
    NULL,
    CURRENT_DATE - INTERVAL '6 hours'
  ),
  -- More verified donations for better stats
  (
    1200.00,
    'Catherine Tremblay',
    'catherine.t@example.com',
    (SELECT id FROM donation_categories WHERE name = 'General Fund' LIMIT 1),
    'verified',
    'info@eglisecitededavid.com',
    'Year-end giving',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '35 days'
  ),
  (
    350.00,
    'Samuel Kabila',
    'samuel.k@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Youth Ministry' LIMIT 1),
    'verified',
    'info@eglisecitededavid.com',
    NULL,
    CURRENT_DATE - INTERVAL '22 days',
    CURRENT_DATE - INTERVAL '25 days'
  ),
  (
    600.00,
    'Amélie Gagnon',
    'amelie.g@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Worship Ministry' LIMIT 1),
    'verified',
    'info@eglisecitededavid.com',
    'Worship team support',
    CURRENT_DATE - INTERVAL '18 days',
    CURRENT_DATE - INTERVAL '20 days'
  ),
  (
    1800.00,
    'Patrick Mukendi',
    'patrick.m@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Mission Trips' LIMIT 1),
    'verified',
    'info@eglisecitededavid.com',
    'Mission trip fund - Haiti 2025',
    CURRENT_DATE - INTERVAL '28 days',
    CURRENT_DATE - INTERVAL '30 days'
  ),
  (
    400.00,
    'Julie Nzamba',
    'julie.n@example.com',
    (SELECT id FROM donation_categories WHERE name = 'Children''s Ministry' LIMIT 1),
    'verified',
    'info@eglisecitededavid.com',
    'VBS program support',
    CURRENT_DATE - INTERVAL '12 days',
    CURRENT_DATE - INTERVAL '15 days'
  );
