-- Mark Thread as Seen Function
-- Marks all messages in a thread as seen for a specific member

CREATE OR REPLACE FUNCTION mark_thread_as_seen(
  p_thread_id UUID,
  p_member_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_messages_marked INTEGER;
BEGIN
  -- Insert message views for all messages in the thread
  -- Use ON CONFLICT DO NOTHING to handle duplicates gracefully
  INSERT INTO message_views (message_id, member_id, seen_at)
  SELECT 
    m.id,
    p_member_id,
    NOW()
  FROM messages m
  WHERE m.thread_id = p_thread_id
  AND m.is_deleted = false
  ON CONFLICT (message_id, member_id) DO NOTHING;
  
  -- Return count of messages marked as seen (including those already seen)
  SELECT COUNT(*)
  INTO v_messages_marked
  FROM message_views mv
  INNER JOIN messages m ON m.id = mv.message_id
  WHERE m.thread_id = p_thread_id
  AND mv.member_id = p_member_id
  AND m.is_deleted = false;
  
  RETURN v_messages_marked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Unseen Message Count Function
-- Returns count of unseen messages for a member (optionally filtered by thread)

CREATE OR REPLACE FUNCTION get_unseen_message_count(
  p_member_id UUID,
  p_thread_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM messages m
  WHERE m.is_deleted = false
  AND (p_thread_id IS NULL OR m.thread_id = p_thread_id)
  AND NOT EXISTS (
    SELECT 1
    FROM message_views mv
    WHERE mv.message_id = m.id
    AND mv.member_id = p_member_id
  );
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION mark_thread_as_seen(UUID, UUID) IS 'Marks all messages in a thread as seen for a member, returns count of messages marked';
COMMENT ON FUNCTION get_unseen_message_count(UUID, UUID) IS 'Returns count of unseen messages for a member, optionally filtered by thread';
