-- Disable Immediate Thread Reply Notifications
-- Modifies notify_thread_reply() to skip email notifications
-- In-app notifications will be handled by the batched system

CREATE OR REPLACE FUNCTION notify_thread_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_record RECORD;
  v_board_id UUID;
  v_author_member_id UUID;
BEGIN
  -- Get thread and board info
  SELECT mt.board_id, mt.created_by
  INTO v_board_id, v_thread_record.created_by
  FROM message_threads mt
  WHERE mt.id = NEW.thread_id;
  
  -- Get author member_id
  v_author_member_id := NEW.author_id;
  
  -- NOTE: We're disabling immediate in-app notifications for thread replies
  -- The batched system (check_unseen_replies) will handle these instead
  -- 
  -- We still create in-app notifications for thread creation and message reports
  -- as those are not part of the batched system
  
  -- DISABLED: Immediate in-app notifications for thread replies
  -- INSERT INTO notifications (member_id, type, board_id, thread_id, message_id)
  -- SELECT 
  --   bnp.member_id,
  --   'thread_reply',
  --   v_board_id,
  --   NEW.thread_id,
  --   NEW.id
  -- FROM board_notification_preferences bnp
  -- WHERE bnp.board_id = v_board_id
  -- AND bnp.in_app_notifications = true
  -- AND bnp.member_id != v_author_member_id
  -- ON CONFLICT DO NOTHING;
  
  -- DISABLED: Immediate email notifications for thread replies
  -- The batched system will handle email notifications via check_unseen_replies()
  -- PERFORM notify_email_service(
  --   'thread-reply',
  --   jsonb_build_object(
  --     'board_id', v_board_id::text,
  --     'thread_id', NEW.thread_id::text,
  --     'message_id', NEW.id::text,
  --     'author_id', v_author_member_id::text
  --   )
  -- );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION notify_thread_reply() IS 'Modified to disable immediate notifications - batched system handles these now';
