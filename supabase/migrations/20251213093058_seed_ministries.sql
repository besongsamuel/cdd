-- Seed the 4 main ministries
INSERT INTO ministries (name, description, display_order, is_active, details) VALUES
  (
    'Children',
    'The Children Ministry is dedicated to nurturing young hearts and minds in the faith. We provide age-appropriate Bible lessons, worship, and activities that help children grow in their relationship with God while building lasting friendships.',
    1,
    true,
    $json${
      "meeting_day": "Sundays",
      "meeting_time": "10:00 AM – 12:00 PM",
      "meeting_location": "Children's Classroom",
      "meeting_frequency": "weekly",
      "who_can_join": {
        "age_range_min": 5,
        "age_range_max": 12,
        "gender": "mixed",
        "open_to_visitors": true
      },
      "activities": ["Bible study", "Worship", "Arts and crafts", "Games", "Prayer time"],
      "cta_type": "form",
      "cta_value": ""
    }$json$::jsonb
  ),
  (
    'Youth',
    'The Youth Ministry is a vibrant community for teenagers to grow spiritually, build friendships, and discover their God-given purpose in a safe and supportive environment.',
    2,
    true,
    $json${
      "meeting_day": "Fridays",
      "meeting_time": "6:00 PM – 8:00 PM",
      "meeting_location": "Church Youth Hall",
      "meeting_frequency": "weekly",
      "who_can_join": {
        "age_range_min": 13,
        "age_range_max": 18,
        "gender": "mixed",
        "open_to_visitors": true
      },
      "activities": ["Bible study", "Worship", "Outreach programs", "Mentorship", "Community service"],
      "cta_type": "form",
      "cta_value": ""
    }$json$::jsonb
  ),
  (
    'Outreach',
    'The Outreach Ministry is committed to serving our community and sharing the love of Christ through practical acts of service, evangelism, and community engagement.',
    3,
    true,
    $json${
      "meeting_day": "Saturdays",
      "meeting_time": "2:00 PM – 4:00 PM",
      "meeting_location": "Church Main Hall",
      "meeting_frequency": "bi-weekly",
      "who_can_join": {
        "age_range_min": 18,
        "age_range_max": null,
        "gender": "mixed",
        "open_to_visitors": true
      },
      "activities": ["Community service", "Evangelism", "Food drives", "Visitation", "Prayer walks"],
      "cta_type": "form",
      "cta_value": ""
    }$json$::jsonb
  ),
  (
    'Unshakable Women of God',
    'Unshakable Women of God is a ministry designed to empower and encourage women in their faith journey. We provide a safe space for women to grow spiritually, build meaningful relationships, and support one another through life''s challenges.',
    4,
    true,
    $json${
      "meeting_day": "First Saturday of each month",
      "meeting_time": "10:00 AM – 12:00 PM",
      "meeting_location": "Church Fellowship Hall",
      "meeting_frequency": "monthly",
      "who_can_join": {
        "age_range_min": 18,
        "age_range_max": null,
        "gender": "female",
        "open_to_visitors": true
      },
      "activities": ["Bible study", "Prayer", "Testimonies", "Fellowship", "Mentorship"],
      "cta_type": "form",
      "cta_value": ""
    }$json$::jsonb
  );
