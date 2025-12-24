-- Message Boards Helper Functions
-- RPC functions for message board operations

-- Function to get accessible boards for a user
CREATE OR REPLACE FUNCTION get_accessible_boards(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  is_public BOOLEAN,
  access_type board_access_type,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  display_order INTEGER,
  pinned_announcement TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mb.id,
    mb.name,
    mb.description,
    mb.is_public,
    mb.access_type,
    mb.created_by,
    mb.created_at,
    mb.updated_at,
    mb.archived_at,
    mb.display_order,
    mb.pinned_announcement
  FROM message_boards mb
  WHERE mb.archived_at IS NULL
  AND (
    mb.is_public = true OR
    check_board_access(mb.id, get_accessible_boards.user_id)
  )
  ORDER BY mb.display_order ASC, mb.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get thread with message count
CREATE OR REPLACE FUNCTION get_thread_with_message_count(thread_id UUID)
RETURNS TABLE (
  id UUID,
  board_id UUID,
  title TEXT,
  created_by UUID,
  is_locked BOOLEAN,
  is_pinned BOOLEAN,
  locked_by UUID,
  locked_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id,
    mt.board_id,
    mt.title,
    mt.created_by,
    mt.is_locked,
    mt.is_pinned,
    mt.locked_by,
    mt.locked_at,
    mt.archived_at,
    mt.last_message_at,
    mt.message_count,
    mt.created_at,
    mt.updated_at
  FROM message_threads mt
  WHERE mt.id = get_thread_with_message_count.thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create thread with initial message (atomic operation)
CREATE OR REPLACE FUNCTION create_thread_with_message(
  p_board_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_author_id UUID
)
RETURNS TABLE (
  thread_id UUID,
  message_id UUID
) AS $$
DECLARE
  v_thread_id UUID;
  v_message_id UUID;
BEGIN
  -- Create thread
  INSERT INTO message_threads (board_id, title, created_by, last_message_at, message_count)
  VALUES (p_board_id, p_title, p_author_id, NOW(), 1)
  RETURNING id INTO v_thread_id;
  
  -- Create initial message
  INSERT INTO messages (thread_id, author_id, content, content_html)
  VALUES (v_thread_id, p_author_id, p_content, p_content) -- content_html will be rendered on frontend
  RETURNING id INTO v_message_id;
  
  -- Return both IDs
  RETURN QUERY SELECT v_thread_id, v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to soft delete message
CREATE OR REPLACE FUNCTION soft_delete_message(
  p_message_id UUID,
  p_deleted_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_author_id UUID;
  v_is_moderator BOOLEAN;
  v_is_admin BOOLEAN;
  v_board_id UUID;
BEGIN
  -- Get message author and board
  SELECT m.author_id, mt.board_id
  INTO v_author_id, v_board_id
  FROM messages m
  INNER JOIN message_threads mt ON mt.id = m.thread_id
  WHERE m.id = p_message_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check permissions
  SELECT is_admin((SELECT user_id FROM members WHERE id = p_deleted_by)) INTO v_is_admin;
  SELECT is_board_moderator(v_board_id, (SELECT user_id FROM members WHERE id = p_deleted_by)) INTO v_is_moderator;
  
  IF v_author_id != p_deleted_by AND NOT v_is_moderator AND NOT v_is_admin THEN
    RETURN FALSE;
  END IF;
  
  -- Soft delete
  UPDATE messages
  SET 
    is_deleted = true,
    deleted_at = NOW(),
    deleted_by = p_deleted_by
  WHERE id = p_message_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get message edit history
CREATE OR REPLACE FUNCTION get_message_edit_history(p_message_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  edited_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    me.id,
    me.content,
    me.edited_at
  FROM message_edits me
  WHERE me.message_id = p_message_id
  ORDER BY me.edited_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lock/unlock thread
CREATE OR REPLACE FUNCTION toggle_thread_lock(
  p_thread_id UUID,
  p_locked BOOLEAN,
  p_moderator_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_board_id UUID;
  v_is_moderator BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  -- Get board_id
  SELECT board_id INTO v_board_id
  FROM message_threads
  WHERE id = p_thread_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check permissions
  SELECT is_admin((SELECT user_id FROM members WHERE id = p_moderator_id)) INTO v_is_admin;
  SELECT is_board_moderator(v_board_id, (SELECT user_id FROM members WHERE id = p_moderator_id)) INTO v_is_moderator;
  
  IF NOT v_is_moderator AND NOT v_is_admin THEN
    RETURN FALSE;
  END IF;
  
  -- Update thread
  UPDATE message_threads
  SET 
    is_locked = p_locked,
    locked_by = CASE WHEN p_locked THEN p_moderator_id ELSE NULL END,
    locked_at = CASE WHEN p_locked THEN NOW() ELSE NULL END
  WHERE id = p_thread_id;
  
  -- Log action
  INSERT INTO moderation_logs (action, target_type, target_id, moderator_id)
  VALUES (
    CASE WHEN p_locked THEN 'lock_thread' ELSE 'unlock_thread' END,
    'thread',
    p_thread_id,
    p_moderator_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to pin/unpin thread
CREATE OR REPLACE FUNCTION toggle_thread_pin(
  p_thread_id UUID,
  p_pinned BOOLEAN,
  p_moderator_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_board_id UUID;
  v_is_moderator BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  -- Get board_id
  SELECT board_id INTO v_board_id
  FROM message_threads
  WHERE id = p_thread_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check permissions
  SELECT is_admin((SELECT user_id FROM members WHERE id = p_moderator_id)) INTO v_is_admin;
  SELECT is_board_moderator(v_board_id, (SELECT user_id FROM members WHERE id = p_moderator_id)) INTO v_is_moderator;
  
  IF NOT v_is_moderator AND NOT v_is_admin THEN
    RETURN FALSE;
  END IF;
  
  -- Update thread
  UPDATE message_threads
  SET is_pinned = p_pinned
  WHERE id = p_thread_id;
  
  -- Log action
  INSERT INTO moderation_logs (action, target_type, target_id, moderator_id)
  VALUES (
    CASE WHEN p_pinned THEN 'pin_thread' ELSE 'unpin_thread' END,
    'thread',
    p_thread_id,
    p_moderator_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_member_id UUID,
  p_type TEXT,
  p_board_id UUID DEFAULT NULL,
  p_thread_id UUID DEFAULT NULL,
  p_message_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (member_id, type, board_id, thread_id, message_id)
  VALUES (p_member_id, p_type, p_board_id, p_thread_id, p_message_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_accessible_boards(UUID) IS 'Returns all boards accessible to a user';
COMMENT ON FUNCTION get_thread_with_message_count(UUID) IS 'Returns thread with aggregated message count';
COMMENT ON FUNCTION create_thread_with_message(UUID, TEXT, TEXT, UUID) IS 'Atomically creates thread and initial message';
COMMENT ON FUNCTION soft_delete_message(UUID, UUID) IS 'Soft deletes a message with permission checks';
COMMENT ON FUNCTION get_message_edit_history(UUID) IS 'Returns edit history for a message';
COMMENT ON FUNCTION toggle_thread_lock(UUID, BOOLEAN, UUID) IS 'Locks or unlocks a thread (moderator only)';
COMMENT ON FUNCTION toggle_thread_pin(UUID, BOOLEAN, UUID) IS 'Pins or unpins a thread (moderator only)';
COMMENT ON FUNCTION create_notification(UUID, TEXT, UUID, UUID, UUID) IS 'Creates an in-app notification';


