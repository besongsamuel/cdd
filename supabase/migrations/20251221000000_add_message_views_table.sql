-- Message Views Tracking
-- Tracks which messages have been seen by which members

CREATE TABLE message_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, member_id)
);

-- Create indexes for performance
CREATE INDEX idx_message_views_member_seen_at ON message_views(member_id, seen_at);
CREATE INDEX idx_message_views_message_id ON message_views(message_id);

-- Enable RLS
ALTER TABLE message_views ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view their own message views
CREATE POLICY "Members can view their own message views" ON message_views
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Policy: Members can insert their own message views
CREATE POLICY "Members can insert their own message views" ON message_views
  FOR INSERT WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE message_views IS 'Tracks which messages have been seen by which members for batched notifications';
