-- Add is_cover column to outreach_gallery_photos table
ALTER TABLE outreach_gallery_photos
ADD COLUMN is_cover BOOLEAN DEFAULT false;

-- Create index for faster cover photo queries
CREATE INDEX idx_outreach_gallery_photos_cover ON outreach_gallery_photos(outreach_event_id, is_cover) WHERE is_cover = true;

-- Ensure only one cover photo per event (constraint via trigger)
CREATE OR REPLACE FUNCTION ensure_single_cover_photo()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a photo as cover, unset all other cover photos for the same event
  IF NEW.is_cover = true THEN
    UPDATE outreach_gallery_photos
    SET is_cover = false
    WHERE outreach_event_id = NEW.outreach_event_id
      AND id != NEW.id
      AND is_cover = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single cover photo per event
CREATE TRIGGER enforce_single_cover_photo
BEFORE INSERT OR UPDATE ON outreach_gallery_photos
FOR EACH ROW
WHEN (NEW.is_cover = true)
EXECUTE FUNCTION ensure_single_cover_photo();

