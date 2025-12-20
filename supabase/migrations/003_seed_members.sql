-- Seed members data
-- 5 leaders and 30 regular members

-- Insert Leaders
INSERT INTO members (name, type, bio, picture_url) VALUES
  (
    'Pastor Daniel Mwamba',
    'leader',
    'Pastor Daniel has been serving in ministry for over 15 years, with a passion for teaching and discipleship. He leads our youth ministry and Bible study groups.',
    NULL
  ),
  (
    'Elder Marie-Claire Nzamba',
    'leader',
    'Elder Marie-Claire is a dedicated servant leader who oversees our women''s ministry and prayer intercession. Her heart for worship and prayer has been a blessing to our congregation.',
    NULL
  ),
  (
    'Deacon Jean-Pierre Kabila',
    'leader',
    'Deacon Jean-Pierre serves as our worship leader and music director. He has a gift for leading the congregation into God''s presence through music and praise.',
    NULL
  ),
  (
    'Pastor Sarah Mukendi',
    'leader',
    'Pastor Sarah leads our children''s ministry and Sunday school programs. She has a heart for nurturing young believers and teaching them the Word of God.',
    NULL
  ),
  (
    'Elder Marc-André Tshisekedi',
    'leader',
    'Elder Marc-André oversees our outreach and evangelism efforts. He is passionate about sharing the gospel and building relationships within our community.',
    NULL
  );

-- Insert Regular Members
INSERT INTO members (name, type, passions) VALUES
  ('Sophie Bélanger', 'regular', ARRAY['Worship', 'Prayer', 'Community Service']),
  ('David Koffi', 'regular', ARRAY['Teaching', 'Discipleship', 'Youth Ministry']),
  ('Isabelle Dubois', 'regular', ARRAY['Children''s Ministry', 'Arts & Crafts', 'Hospitality']),
  ('Emmanuel Ntumba', 'regular', ARRAY['Music', 'Sound Engineering', 'Technical Support']),
  ('Marie-France Lavoie', 'regular', ARRAY['Intercession', 'Women''s Ministry', 'Counseling']),
  ('Jean-Baptiste Mbuyi', 'regular', ARRAY['Evangelism', 'Outreach', 'Street Ministry']),
  ('Catherine Tremblay', 'regular', ARRAY['Administration', 'Event Planning', 'Communication']),
  ('Samuel Kabila', 'regular', ARRAY['Bible Study', 'Teaching', 'Mentoring']),
  ('Amélie Gagnon', 'regular', ARRAY['Worship', 'Dance', 'Creative Arts']),
  ('Patrick Mukendi', 'regular', ARRAY['Men''s Ministry', 'Accountability', 'Fellowship']),
  ('Julie Nzamba', 'regular', ARRAY['Children''s Ministry', 'Sunday School', 'Storytelling']),
  ('François Tshisekedi', 'regular', ARRAY['Translation', 'Interpretation', 'Language Services']),
  ('Sarah Mwamba', 'regular', ARRAY['Hospitality', 'Food Service', 'Event Coordination']),
  ('Michel Koffi', 'regular', ARRAY['Security', 'Ushering', 'Facilities Management']),
  ('Élise Bélanger', 'regular', ARRAY['Media', 'Photography', 'Social Media']),
  ('André Ntumba', 'regular', ARRAY['Transportation', 'Logistics', 'Community Outreach']),
  ('Chantal Dubois', 'regular', ARRAY['Prayer', 'Intercession', 'Spiritual Warfare']),
  ('Robert Mbuyi', 'regular', ARRAY['Finance', 'Accounting', 'Stewardship']),
  ('Nathalie Lavoie', 'regular', ARRAY['Women''s Ministry', 'Fellowship', 'Support Groups']),
  ('Daniel Kabila', 'regular', ARRAY['Music', 'Instruments', 'Worship Team']),
  ('Caroline Tremblay', 'regular', ARRAY['Children''s Ministry', 'Nursery', 'Childcare']),
  ('Paul Mukendi', 'regular', ARRAY['Men''s Ministry', 'Discipleship', 'Bible Study']),
  ('Valérie Gagnon', 'regular', ARRAY['Worship', 'Vocals', 'Praise Team']),
  ('Thomas Nzamba', 'regular', ARRAY['Youth Ministry', 'Sports', 'Recreation']),
  ('Sylvie Tshisekedi', 'regular', ARRAY['Hospitality', 'Greeting', 'Visitor Care']),
  ('Marc Mwamba', 'regular', ARRAY['Technical Support', 'Audio/Video', 'Live Streaming']),
  ('Isabelle Koffi', 'regular', ARRAY['Women''s Ministry', 'Bible Study', 'Fellowship']),
  ('Pierre Ntumba', 'regular', ARRAY['Evangelism', 'Street Preaching', 'Outreach']),
  ('Martine Bélanger', 'regular', ARRAY['Prayer', 'Intercession', 'Spiritual Guidance']),
  ('Luc Dubois', 'regular', ARRAY['Men''s Ministry', 'Accountability', 'Discipleship']);





