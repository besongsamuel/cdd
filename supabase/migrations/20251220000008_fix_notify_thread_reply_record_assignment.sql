-- Fix notify_thread_reply function - cannot assign to field of uninitialized RECORD
-- The issue is trying to assign to v_thread_record.created_by when v_thread_record is not initialized

CREATE OR REPLACE FUNCTION notify_thread_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_board_id UUID;
  v_author_member_id UUID;
BEGIN
  -- Get thread and board info
  SELECT mt.board_id
  INTO v_board_id
  FROM message_threads mt
  WHERE mt.id = NEW.thread_id;
  
  -- Get author member_id
  v_author_member_id := NEW.author_id;
  
  -- Don't notify the author
  -- Create notifications for users who have in-app notifications enabled for this board
  -- and are not the author
  INSERT INTO notifications (member_id, type, board_id, thread_id, message_id)
  SELECT 
    bnp.member_id,
    'thread_reply',
    v_board_id,
    NEW.thread_id,
    NEW.id
  FROM board_notification_preferences bnp
  WHERE bnp.board_id = v_board_id
  AND bnp.in_app_notifications = true
  AND bnp.member_id != v_author_member_id
  ON CONFLICT DO NOTHING;
  
  -- Trigger email notifications (will be handled by existing email notification system)
  -- This will be called via the notify_email_service function
  PERFORM notify_email_service(
    'thread-reply',
    jsonb_build_object(
      'board_id', v_board_id::text,
      'thread_id', NEW.thread_id::text,
      'message_id', NEW.id::text,
      'author_id', v_author_member_id::text
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


