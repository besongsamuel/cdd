-- Create board_summary_notifications table
-- Tracks when each user was last notified about board activity

CREATE TABLE board_summary_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  board_id UUID REFERENCES message_boards(id) ON DELETE CASCADE,
  last_notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, board_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_board_summary_notifications_member_id ON board_summary_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_board_summary_notifications_board_id ON board_summary_notifications(board_id);
CREATE INDEX IF NOT EXISTS idx_board_summary_notifications_last_notified ON board_summary_notifications(last_notified_at);

-- Create trigger for updated_at
CREATE TRIGGER update_board_summary_notifications_updated_at 
  BEFORE UPDATE ON board_summary_notifications
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE board_summary_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own notification records
CREATE POLICY "Users can read own board summary notifications" ON board_summary_notifications
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all records (for edge functions)
CREATE POLICY "Service role can manage board summary notifications" ON board_summary_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE board_summary_notifications IS 'Tracks when each user was last notified about activity in each board';
COMMENT ON COLUMN board_summary_notifications.last_notified_at IS 'Timestamp of the last summary email sent to this user for this board';

