-- Check Unseen Replies Function
-- Finds all unseen replies and creates batched notifications

CREATE OR REPLACE FUNCTION check_unseen_replies()
RETURNS void AS $$
DECLARE
  v_member_unseen RECORD;
BEGIN
  -- For each member with unseen replies, create a single batched notification
  FOR v_member_unseen IN
    WITH unseen_replies AS (
      -- Find all reply messages (not the first message in thread) that are unseen
      SELECT DISTINCT
        m.id AS message_id,
        m.thread_id,
        m.author_id AS reply_author_id,
        mt.board_id,
        m.created_at AS reply_created_at,
        -- Get first message time in thread to identify replies
        (SELECT MIN(created_at) FROM messages WHERE thread_id = m.thread_id AND is_deleted = false) AS first_message_time
      FROM messages m
      INNER JOIN message_threads mt ON mt.id = m.thread_id
      WHERE m.is_deleted = false
      -- This is a reply (created after the first message)
      AND m.created_at > (SELECT MIN(created_at) FROM messages WHERE thread_id = m.thread_id AND is_deleted = false)
    ),
    thread_participants AS (
      -- For each unseen reply, find members who posted in thread before this reply
      SELECT DISTINCT
        ur.message_id,
        ur.thread_id,
        ur.board_id,
        m2.author_id AS member_id
      FROM unseen_replies ur
      INNER JOIN messages m2 ON m2.thread_id = ur.thread_id
      WHERE m2.is_deleted = false
      AND m2.author_id IS NOT NULL
      AND m2.author_id != ur.reply_author_id  -- Don't notify the reply author
      AND m2.created_at < ur.reply_created_at  -- Posted before this reply
      -- Check if this reply has NOT been seen by this member
      AND NOT EXISTS (
        SELECT 1
        FROM message_views mv
        WHERE mv.message_id = ur.message_id
        AND mv.member_id = m2.author_id
      )
    )
    -- Aggregate by member and board to create batched notifications
    SELECT 
      tp.member_id,
      tp.board_id,
      COUNT(DISTINCT tp.message_id) AS unseen_count,
      MIN(tp.thread_id) AS first_thread_id
    FROM thread_participants tp
    -- Only for members with in-app notifications enabled
    INNER JOIN board_notification_preferences bnp 
      ON bnp.member_id = tp.member_id 
      AND bnp.board_id = tp.board_id
      AND bnp.in_app_notifications = true
    GROUP BY tp.member_id, tp.board_id
    HAVING COUNT(DISTINCT tp.message_id) > 0
  LOOP
    -- Only create notification if we don't already have one for this member/board in the last hour
    -- (to avoid duplicate notifications)
    IF NOT EXISTS (
      SELECT 1
      FROM notifications n
      WHERE n.member_id = v_member_unseen.member_id
      AND n.type = 'unseen_replies'
      AND n.board_id = v_member_unseen.board_id
      AND n.created_at > NOW() - INTERVAL '1 hour'
    ) THEN
      -- Create a single batched notification
      INSERT INTO notifications (
        member_id,
        type,
        board_id,
        thread_id,
        message_id
      )
      VALUES (
        v_member_unseen.member_id,
        'unseen_replies',
        v_member_unseen.board_id,
        v_member_unseen.first_thread_id,
        NULL  -- No specific message_id for batched notifications
      );
      
      -- Trigger email notification if enabled
      IF EXISTS (
        SELECT 1
        FROM board_notification_preferences bnp
        WHERE bnp.member_id = v_member_unseen.member_id
        AND bnp.board_id = v_member_unseen.board_id
        AND bnp.email_notifications = true
      ) THEN
        PERFORM notify_email_service(
          'unseen-replies',
          jsonb_build_object(
            'member_id', v_member_unseen.member_id::TEXT,
            'board_id', v_member_unseen.board_id::TEXT,
            'unseen_count', v_member_unseen.unseen_count
          )
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION check_unseen_replies() IS 'Checks for unseen replies and creates batched notifications per user';
