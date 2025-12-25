-- Update check_unseen_replies to use reply_to_id instead of timestamp comparison
-- This refactoring improves accuracy and performance by leveraging the reply_to_id field

CREATE OR REPLACE FUNCTION check_unseen_replies()
RETURNS void AS $$
DECLARE
  v_member_unseen RECORD;
BEGIN
  -- For each member with unseen replies, create a single batched notification
  FOR v_member_unseen IN
    WITH unseen_replies AS (
      -- Find all reply messages (messages with reply_to_id) that are unseen
      -- Join with parent message to get the author who should be notified
      SELECT DISTINCT
        m.id AS message_id,
        m.thread_id,
        m.author_id AS reply_author_id,
        m.reply_to_id,
        parent_msg.author_id AS parent_author_id,
        mt.board_id,
        m.created_at AS reply_created_at
      FROM messages m
      INNER JOIN message_threads mt ON mt.id = m.thread_id
      INNER JOIN messages parent_msg ON parent_msg.id = m.reply_to_id
      WHERE m.is_deleted = false
      AND parent_msg.is_deleted = false
      -- This is a reply (has a reply_to_id)
      AND m.reply_to_id IS NOT NULL
      -- Parent message must have an author
      AND parent_msg.author_id IS NOT NULL
      -- Don't notify if replying to yourself
      AND m.author_id != parent_msg.author_id
      -- Check if this reply has NOT been seen by the parent message author
      AND NOT EXISTS (
        SELECT 1
        FROM message_views mv
        WHERE mv.message_id = m.id
        AND mv.member_id = parent_msg.author_id
      )
    )
    -- Aggregate by member and board to create batched notifications
    SELECT 
      ur.parent_author_id AS member_id,
      ur.board_id,
      COUNT(DISTINCT ur.message_id) AS unseen_count,
      (array_agg(ur.thread_id ORDER BY ur.thread_id))[1] AS first_thread_id
    FROM unseen_replies ur
    -- Only for members with in-app notifications enabled
    INNER JOIN board_notification_preferences bnp 
      ON bnp.member_id = ur.parent_author_id 
      AND bnp.board_id = ur.board_id
      AND bnp.in_app_notifications = true
    GROUP BY ur.parent_author_id, ur.board_id
    HAVING COUNT(DISTINCT ur.message_id) > 0
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
COMMENT ON FUNCTION check_unseen_replies() IS 'Checks for unseen replies and creates batched notifications per user. Uses reply_to_id to identify replies.';

