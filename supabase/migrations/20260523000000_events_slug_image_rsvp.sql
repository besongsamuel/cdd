-- Events: slug, cover image, ministry/department links, RSVP, event-images storage
--
-- IMPORTANT: Before running this migration, create the public bucket in Supabase Storage:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create bucket: "event-images" (Public: Yes)
-- Then run this migration.

-- Extend events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Add slug column (nullable first for backfill)
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs from titles
DO $$
DECLARE
  r RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INT;
BEGIN
  FOR r IN SELECT id, title FROM events WHERE slug IS NULL OR slug = '' ORDER BY created_at
  LOOP
    base_slug := lower(trim(regexp_replace(
      regexp_replace(coalesce(r.title, 'event'), '[^a-zA-Z0-9]+', '-', 'g'),
      '(^-|-$)', '', 'g'
    )));
    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'event';
    END IF;
    final_slug := base_slug;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM events e WHERE e.slug = final_slug AND e.id != r.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    UPDATE events SET slug = final_slug WHERE id = r.id;
  END LOOP;
END $$;

-- Resolve any duplicate slugs
DO $$
DECLARE
  r RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INT;
BEGIN
  FOR r IN
    SELECT id, slug FROM events e1
    WHERE EXISTS (
      SELECT 1 FROM events e2
      WHERE e2.slug = e1.slug AND e2.id < e1.id
    )
  LOOP
    base_slug := r.slug;
    counter := 1;
    final_slug := base_slug || '-' || counter;
    WHILE EXISTS (SELECT 1 FROM events e WHERE e.slug = final_slug AND e.id != r.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    UPDATE events SET slug = final_slug WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE events ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_key ON events (slug);
CREATE INDEX IF NOT EXISTS events_ministry_id_idx ON events (ministry_id);
CREATE INDEX IF NOT EXISTS events_department_id_idx ON events (department_id);

-- RSVP enum and table
CREATE TYPE event_rsvp_status AS ENUM ('attending', 'maybe', 'not_attending');

CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status event_rsvp_status NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  guest_name TEXT,
  anonymous_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT event_rsvps_guest_name_when_anonymous CHECK (
    user_id IS NOT NULL OR (guest_name IS NOT NULL AND trim(guest_name) <> '')
  )
);

CREATE UNIQUE INDEX event_rsvps_event_user_unique
  ON event_rsvps (event_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX event_rsvps_event_id_idx ON event_rsvps (event_id);
CREATE INDEX event_rsvps_anonymous_token_idx ON event_rsvps (anonymous_token);

CREATE TRIGGER update_event_rsvps_updated_at
  BEFORE UPDATE ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RSVP counts function (public via RPC)
CREATE OR REPLACE FUNCTION get_event_rsvp_counts(p_event_id UUID)
RETURNS TABLE (
  attending BIGINT,
  maybe BIGINT,
  not_attending BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'attending')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'maybe')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'not_attending')::BIGINT
  FROM event_rsvps
  WHERE event_id = p_event_id;
$$;

GRANT EXECUTE ON FUNCTION get_event_rsvp_counts(UUID) TO anon, authenticated;

-- Upsert RSVP (handles logged-in and anonymous)
CREATE OR REPLACE FUNCTION upsert_event_rsvp(
  p_event_id UUID,
  p_status event_rsvp_status,
  p_guest_name TEXT DEFAULT NULL,
  p_anonymous_token UUID DEFAULT NULL,
  p_member_id UUID DEFAULT NULL
)
RETURNS event_rsvps
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_row event_rsvps;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    INSERT INTO event_rsvps (event_id, status, user_id, member_id, guest_name)
    VALUES (p_event_id, p_status, v_user_id, p_member_id, p_guest_name)
    ON CONFLICT (event_id, user_id) WHERE user_id IS NOT NULL
    DO UPDATE SET
      status = EXCLUDED.status,
      member_id = COALESCE(EXCLUDED.member_id, event_rsvps.member_id),
      guest_name = EXCLUDED.guest_name,
      updated_at = NOW()
    RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  IF p_guest_name IS NULL OR trim(p_guest_name) = '' THEN
    RAISE EXCEPTION 'guest_name is required for anonymous RSVPs';
  END IF;

  IF p_anonymous_token IS NOT NULL THEN
    UPDATE event_rsvps
    SET status = p_status,
        guest_name = trim(p_guest_name),
        updated_at = NOW()
    WHERE event_id = p_event_id
      AND user_id IS NULL
      AND anonymous_token = p_anonymous_token
    RETURNING * INTO v_row;

    IF FOUND THEN
      RETURN v_row;
    END IF;
  END IF;

  INSERT INTO event_rsvps (event_id, status, guest_name, anonymous_token)
  VALUES (p_event_id, p_status, trim(p_guest_name), COALESCE(p_anonymous_token, gen_random_uuid()))
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_event_rsvp(UUID, event_rsvp_status, TEXT, UUID, UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_event_rsvp_for_visitor(
  p_event_id UUID,
  p_anonymous_token UUID DEFAULT NULL
)
RETURNS event_rsvps
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_row event_rsvps;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    SELECT * INTO v_row
    FROM event_rsvps
    WHERE event_id = p_event_id AND user_id = v_user_id
    LIMIT 1;
    RETURN v_row;
  END IF;

  IF p_anonymous_token IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_row
  FROM event_rsvps
  WHERE event_id = p_event_id
    AND user_id IS NULL
    AND anonymous_token = p_anonymous_token
  LIMIT 1;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION get_event_rsvp_for_visitor(UUID, UUID) TO anon, authenticated;

-- RLS for event_rsvps
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert event rsvps"
  ON event_rsvps FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own event rsvps"
  ON event_rsvps FOR SELECT
  USING (
    user_id = auth.uid()
    OR auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own event rsvps"
  ON event_rsvps FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated can read all event rsvps for admin"
  ON event_rsvps FOR SELECT
  USING (auth.role() = 'authenticated');

-- Storage policies for event-images bucket
CREATE POLICY "Authenticated users can upload to event-images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Public can read event-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-images');

CREATE POLICY "Users can update event-images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated' AND
  (
    owner = auth.uid() OR
    EXISTS(
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid() AND members.is_admin = true
    )
  )
)
WITH CHECK (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete event-images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated' AND
  (
    owner = auth.uid() OR
    EXISTS(
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid() AND members.is_admin = true
    )
  )
);
