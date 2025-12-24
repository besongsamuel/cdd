-- Seed events and gallery_photos data

-- Insert Events
INSERT INTO events (title, description, event_date, event_time, location) VALUES
  (
    'Sunday Morning Service',
    'Join us for our weekly Sunday service with worship, teaching, and fellowship. All are welcome!',
    CURRENT_DATE + INTERVAL '7 days',
    '09:30:00',
    'Church Main Hall'
  ),
  (
    'Prayer Night',
    'An evening dedicated to prayer and intercession for our community, nation, and the world.',
    CURRENT_DATE + INTERVAL '3 days',
    '18:30:00',
    'Church Main Hall'
  ),
  (
    'Youth Conference 2024',
    'A special conference for youth featuring dynamic speakers, worship, and workshops. Ages 13-25.',
    CURRENT_DATE + INTERVAL '30 days',
    '09:00:00',
    'Church Main Hall'
  ),
  (
    'Christmas Celebration',
    'Come celebrate the birth of Christ with us! Special service featuring music, drama, and fellowship.',
    DATE '2024-12-25',
    '10:00:00',
    'Church Main Hall'
  ),
  (
    'New Year Prayer Service',
    'Start the new year in prayer and dedication to God. Join us for a time of worship and seeking God''s direction.',
    DATE '2025-01-01',
    '19:00:00',
    'Church Main Hall'
  ),
  (
    'Women''s Ministry Gathering',
    'Monthly gathering for women of all ages. Fellowship, teaching, and encouragement.',
    CURRENT_DATE + INTERVAL '14 days',
    '14:00:00',
    'Church Fellowship Hall'
  ),
  (
    'Men''s Breakfast',
    'Men''s monthly breakfast meeting. Food, fellowship, and Bible study.',
    CURRENT_DATE + INTERVAL '21 days',
    '08:00:00',
    'Church Fellowship Hall'
  ),
  (
    'Easter Sunday Service',
    'Celebrate the resurrection of Jesus Christ! Special Easter service with worship and communion.',
    DATE '2025-04-20',
    '09:30:00',
    'Church Main Hall'
  ),
  (
    'Summer Picnic',
    'Church family picnic and outdoor fellowship. Food, games, and fun for all ages!',
    DATE '2025-07-15',
    '12:00:00',
    'Local Park - TBD'
  ),
  (
    'Worship Night',
    'An evening of extended worship and praise. Come and experience God''s presence.',
    CURRENT_DATE + INTERVAL '10 days',
    '19:00:00',
    'Church Main Hall'
  );

-- Insert Gallery Photos linked to events
-- Using subqueries to get event IDs by title
INSERT INTO gallery_photos (image_url, event_id, caption, taken_at) VALUES
  -- Photos for Sunday Morning Service
  (
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop',
    (SELECT id FROM events WHERE title = 'Sunday Morning Service' LIMIT 1),
    'Sunday Service - Worship Time',
    (SELECT event_date::timestamp + INTERVAL '10 hours' FROM events WHERE title = 'Sunday Morning Service' LIMIT 1)
  ),
  (
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
    (SELECT id FROM events WHERE title = 'Sunday Morning Service' LIMIT 1),
    'Sunday Service - Fellowship',
    (SELECT event_date::timestamp + INTERVAL '11 hours' FROM events WHERE title = 'Sunday Morning Service' LIMIT 1)
  ),
  -- Photos for Prayer Night
  (
    'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800&h=600&fit=crop',
    (SELECT id FROM events WHERE title = 'Prayer Night' LIMIT 1),
    'Prayer Night - Intercession',
    (SELECT event_date::timestamp + INTERVAL '18 hours 30 minutes' FROM events WHERE title = 'Prayer Night' LIMIT 1)
  ),
  (
    'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&h=600&fit=crop',
    (SELECT id FROM events WHERE title = 'Prayer Night' LIMIT 1),
    'Prayer Night - Worship',
    (SELECT event_date::timestamp + INTERVAL '19 hours' FROM events WHERE title = 'Prayer Night' LIMIT 1)
  ),
  -- Photos for Youth Conference
  (
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop',
    (SELECT id FROM events WHERE title = 'Youth Conference 2024' LIMIT 1),
    'Youth Conference - Main Session',
    (SELECT event_date::timestamp + INTERVAL '9 hours' FROM events WHERE title = 'Youth Conference 2024' LIMIT 1)
  ),
  (
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
    (SELECT id FROM events WHERE title = 'Youth Conference 2024' LIMIT 1),
    'Youth Conference - Breakout Session',
    (SELECT event_date::timestamp + INTERVAL '11 hours' FROM events WHERE title = 'Youth Conference 2024' LIMIT 1)
  ),
  (
    'https://images.unsplash.com/photo-1541558869438-4cbc16b72e8c?w=800&h=600&fit=crop',
    (SELECT id FROM events WHERE title = 'Youth Conference 2024' LIMIT 1),
    'Youth Conference - Fellowship',
    (SELECT event_date::timestamp + INTERVAL '14 hours' FROM events WHERE title = 'Youth Conference 2024' LIMIT 1)
  ),
  -- Photos for Worship Night
  (
    'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&h=600&fit=crop',
    (SELECT id FROM events WHERE title = 'Worship Night' LIMIT 1),
    'Worship Night - Praise and Worship',
    (SELECT event_date::timestamp + INTERVAL '19 hours' FROM events WHERE title = 'Worship Night' LIMIT 1)
  );

-- Insert standalone gallery photos (not linked to events)
INSERT INTO gallery_photos (image_url, event_id, caption, taken_at) VALUES
  (
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop',
    NULL,
    'Church Building Exterior',
    CURRENT_DATE - INTERVAL '30 days'
  ),
  (
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
    NULL,
    'Fellowship After Service',
    CURRENT_DATE - INTERVAL '20 days'
  ),
  (
    'https://images.unsplash.com/photo-1541558869438-4cbc16b72e8c?w=800&h=600&fit=crop',
    NULL,
    'Community Outreach Event',
    CURRENT_DATE - INTERVAL '45 days'
  ),
  (
    'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&h=600&fit=crop',
    NULL,
    'Worship Team Rehearsal',
    CURRENT_DATE - INTERVAL '15 days'
  ),
  (
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&h=600&fit=crop',
    NULL,
    'Children''s Ministry Activity',
    CURRENT_DATE - INTERVAL '25 days'
  ),
  (
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&h=600&fit=crop',
    NULL,
    'Bible Study Group',
    CURRENT_DATE - INTERVAL '35 days'
  ),
  (
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop',
    NULL,
    'Sunday Morning Worship',
    CURRENT_DATE - INTERVAL '7 days'
  ),
  (
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop',
    NULL,
    'Women''s Ministry Gathering',
    CURRENT_DATE - INTERVAL '40 days'
  ),
  (
    'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=800&h=600&fit=crop',
    NULL,
    'Men''s Fellowship',
    CURRENT_DATE - INTERVAL '12 days'
  ),
  (
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
    NULL,
    'Prayer Meeting',
    CURRENT_DATE - INTERVAL '5 days'
  );




