-- Add Coeur de Compassion (Heart of Compassion) Orphanage Ministry
INSERT INTO ministries (name, description, display_order, is_active, details) VALUES
  (
    'Coeur de Compassion',
    'Coeur de Compassion (Heart of Compassion) is a dedicated orphanage ministry committed to extending God''s love and care to orphaned and vulnerable children in our community. Through compassionate outreach, we provide spiritual guidance, educational support, emotional care, and practical assistance to children who have lost their parents or are in need of a loving family environment. Our mission is to demonstrate Christ''s unconditional love by ensuring these precious children know they are valued, protected, and have a place in God''s family. We organize regular visits, mentorship programs, educational assistance, and special events to bring joy, hope, and the message of salvation to these young hearts.',
    5,
    true,
    $json${
      "meeting_day": "Saturdays",
      "meeting_time": "9:00 AM – 12:00 PM",
      "meeting_location": "Orphanage Center / Various Locations",
      "meeting_frequency": "bi-weekly",
      "who_can_join": {
        "age_range_min": 18,
        "age_range_max": null,
        "gender": "mixed",
        "open_to_visitors": true
      },
      "activities": [
        "Orphanage visits",
        "Mentorship programs",
        "Educational support",
        "Bible study and spiritual guidance",
        "Recreational activities",
        "Emotional and psychological support",
        "Life skills training",
        "Prayer and counseling",
        "Special events and celebrations",
        "Material assistance (clothing, food, school supplies)"
      ],
      "cta_type": "form",
      "cta_value": ""
    }$json$::jsonb
  );

