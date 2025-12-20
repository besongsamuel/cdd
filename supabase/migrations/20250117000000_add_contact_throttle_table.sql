-- Create contact_submission_throttle table for rate limiting
CREATE TABLE IF NOT EXISTS contact_submission_throttle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient throttle lookups
CREATE INDEX IF NOT EXISTS idx_throttle_ip_time ON contact_submission_throttle(ip_address, created_at);

-- Enable RLS on throttle table
ALTER TABLE contact_submission_throttle ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage throttle records (for edge function)
-- This policy allows the service role to insert and select throttle records
CREATE POLICY "Service role can manage throttle" ON contact_submission_throttle
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to clean up old throttle records (older than 1 hour)
-- Can be called periodically or manually
CREATE OR REPLACE FUNCTION cleanup_old_throttle_records()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM contact_submission_throttle
  WHERE created_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE contact_submission_throttle IS 'Tracks contact form submissions by IP address for rate limiting';
COMMENT ON FUNCTION cleanup_old_throttle_records() IS 'Removes throttle records older than 1 hour';

