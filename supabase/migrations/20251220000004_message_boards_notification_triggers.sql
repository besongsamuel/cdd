-- Message Boards Notification Triggers
-- Triggers for creating notifications when messages are posted

-- Trigger function to notify thread subscribers when a new message is posted
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

-- Trigger function to notify when a new thread is created
CREATE OR REPLACE FUNCTION notify_thread_created()
RETURNS TRIGGER AS $$
DECLARE
  v_author_member_id UUID;
BEGIN
  v_author_member_id := NEW.created_by;
  
  -- Create notifications for users who have in-app notifications enabled for this board
  -- and are not the author
  INSERT INTO notifications (member_id, type, board_id, thread_id)
  SELECT 
    bnp.member_id,
    'thread_created',
    NEW.board_id,
    NEW.id
  FROM board_notification_preferences bnp
  WHERE bnp.board_id = NEW.board_id
  AND bnp.in_app_notifications = true
  AND bnp.member_id != v_author_member_id
  ON CONFLICT DO NOTHING;
  
  -- Trigger email notifications
  PERFORM notify_email_service(
    'thread-created',
    jsonb_build_object(
      'board_id', NEW.board_id::text,
      'thread_id', NEW.id::text,
      'author_id', v_author_member_id::text
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to notify moderators when a message is reported
CREATE OR REPLACE FUNCTION notify_message_reported()
RETURNS TRIGGER AS $$
DECLARE
  v_board_id UUID;
  v_thread_id UUID;
BEGIN
  -- Get board_id from message
  SELECT mt.board_id, mt.id
  INTO v_board_id, v_thread_id
  FROM message_threads mt
  INNER JOIN messages m ON m.thread_id = mt.id
  WHERE m.id = NEW.message_id;
  
  -- Notify all moderators of the board
  INSERT INTO notifications (member_id, type, board_id, thread_id, message_id)
  SELECT 
    bm.member_id,
    'message_report',
    v_board_id,
    v_thread_id,
    NEW.message_id
  FROM board_moderators bm
  WHERE bm.board_id = v_board_id
  ON CONFLICT DO NOTHING;
  
  -- Also notify admins
  INSERT INTO notifications (member_id, type, board_id, thread_id, message_id)
  SELECT 
    m.id,
    'message_report',
    v_board_id,
    v_thread_id,
    NEW.message_id
  FROM members m
  WHERE m.is_admin = true
  ON CONFLICT DO NOTHING;
  
  -- Trigger email notifications to moderators
  PERFORM notify_email_service(
    'message-reported',
    jsonb_build_object(
      'board_id', v_board_id::text,
      'thread_id', v_thread_id::text,
      'message_id', NEW.message_id::text,
      'report_id', NEW.id::text,
      'reported_by', NEW.reported_by::text
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_thread_reply ON messages;
CREATE TRIGGER trigger_notify_thread_reply
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.is_deleted = false)
  EXECUTE FUNCTION notify_thread_reply();

DROP TRIGGER IF EXISTS trigger_notify_thread_created ON message_threads;
CREATE TRIGGER trigger_notify_thread_created
  AFTER INSERT ON message_threads
  FOR EACH ROW
  EXECUTE FUNCTION notify_thread_created();

DROP TRIGGER IF EXISTS trigger_notify_message_reported ON message_reports;
CREATE TRIGGER trigger_notify_message_reported
  AFTER INSERT ON message_reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_reported();

-- Comments
COMMENT ON FUNCTION notify_thread_reply() IS 'Creates notifications when a new message is posted in a thread';
COMMENT ON FUNCTION notify_thread_created() IS 'Creates notifications when a new thread is created';
COMMENT ON FUNCTION notify_message_reported() IS 'Notifies moderators when a message is reported';

