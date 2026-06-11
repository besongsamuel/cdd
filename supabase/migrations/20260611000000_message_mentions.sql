-- Message mentions: storage, daily email dedup, and notification trigger

CREATE TABLE message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, member_id)
);

CREATE INDEX idx_message_mentions_member_id ON message_mentions(member_id);
CREATE INDEX idx_message_mentions_message_id ON message_mentions(message_id);

-- Tracks last mention email sent per member (daily dedup uses America/Toronto calendar day)
CREATE TABLE mention_email_notifications (
  member_id UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  last_email_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mention_email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read message mentions" ON message_mentions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert mentions for own messages" ON message_mentions
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_id
      AND m.author_id = get_member_id(auth.uid())
    )
  );

CREATE POLICY "Users can delete mentions for own messages" ON message_mentions
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_id
      AND m.author_id = get_member_id(auth.uid())
    )
  );

CREATE POLICY "Service role manages mention email notifications" ON mention_email_notifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION notify_message_mentions()
RETURNS TRIGGER AS $$
DECLARE
  v_board_id UUID;
  v_thread_id UUID;
  v_author_id UUID;
  v_mentioner_id UUID;
  v_should_email BOOLEAN;
  v_toronto_today DATE;
BEGIN
  SELECT m.thread_id, m.author_id, mt.board_id
  INTO v_thread_id, v_author_id, v_board_id
  FROM messages m
  INNER JOIN message_threads mt ON mt.id = m.thread_id
  WHERE m.id = NEW.message_id;

  v_mentioner_id := v_author_id;

  -- Skip self-mentions and members without accounts
  IF NEW.member_id = v_author_id THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM members WHERE id = NEW.member_id AND user_id IS NOT NULL
  ) THEN
    RETURN NEW;
  END IF;

  -- Always create in-app notification
  INSERT INTO notifications (member_id, type, board_id, thread_id, message_id)
  VALUES (NEW.member_id, 'thread_mention', v_board_id, v_thread_id, NEW.message_id);

  v_toronto_today := (now() AT TIME ZONE 'America/Toronto')::date;

  SELECT NOT EXISTS (
    SELECT 1 FROM mention_email_notifications men
    WHERE men.member_id = NEW.member_id
    AND (men.last_email_sent_at AT TIME ZONE 'America/Toronto')::date = v_toronto_today
  ) INTO v_should_email;

  IF v_should_email THEN
    PERFORM notify_email_service(
      'thread-mention',
      jsonb_build_object(
        'member_id', NEW.member_id::text,
        'board_id', v_board_id::text,
        'thread_id', v_thread_id::text,
        'message_id', NEW.message_id::text,
        'mentioner_id', v_mentioner_id::text
      )
    );

    INSERT INTO mention_email_notifications (member_id, last_email_sent_at)
    VALUES (NEW.member_id, now())
    ON CONFLICT (member_id) DO UPDATE
    SET last_email_sent_at = EXCLUDED.last_email_sent_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_message_mentions
  AFTER INSERT ON message_mentions
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_mentions();

COMMENT ON TABLE message_mentions IS 'Members mentioned in message board posts';
COMMENT ON TABLE mention_email_notifications IS 'Daily dedup for mention emails (America/Toronto calendar day)';
COMMENT ON FUNCTION notify_message_mentions() IS 'Creates in-app notifications for every mention; emails at most once per member per day';
