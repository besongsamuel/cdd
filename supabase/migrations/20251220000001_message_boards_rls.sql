-- Message Boards RLS Policies
-- Row Level Security policies for message board tables

-- Enable RLS on all tables
ALTER TABLE message_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM members
    WHERE members.user_id = is_admin.user_id
    AND members.is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check board access
CREATE OR REPLACE FUNCTION check_board_access(board_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  board_record RECORD;
  member_record RECORD;
  has_access BOOLEAN := false;
BEGIN
  -- Get board
  SELECT * INTO board_record FROM message_boards WHERE id = board_id;
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  
  -- Public boards are accessible to everyone
  IF board_record.is_public THEN RETURN TRUE; END IF;
  
  -- If not authenticated, no access to private boards
  IF user_id IS NULL THEN RETURN FALSE; END IF;
  
  -- Get member
  SELECT * INTO member_record FROM members WHERE members.user_id = check_board_access.user_id;
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  
  -- Check access based on access_type
  CASE board_record.access_type
    WHEN 'public' THEN
      has_access := true;
    WHEN 'authenticated' THEN
      has_access := true; -- Already checked user_id is not null
    WHEN 'role_based' THEN
      -- Check if member's title matches any rule
      SELECT EXISTS (
        SELECT 1 FROM board_access_rules
        WHERE board_access_rules.board_id = board_id
        AND board_access_rules.rule_type = 'title'
        AND board_access_rules.rule_value = member_record.title_id
      ) INTO has_access;
    WHEN 'department' THEN
      -- Check if member is in any department that matches rules
      SELECT EXISTS (
        SELECT 1 FROM board_access_rules
        INNER JOIN department_members ON department_members.department_id = board_access_rules.rule_value
        WHERE board_access_rules.board_id = board_id
        AND board_access_rules.rule_type = 'department'
        AND department_members.member_id = member_record.id
      ) INTO has_access;
    WHEN 'ministry' THEN
      -- Check if member is in any ministry that matches rules
      SELECT EXISTS (
        SELECT 1 FROM board_access_rules
        INNER JOIN ministry_members ON ministry_members.ministry_id = board_access_rules.rule_value
        WHERE board_access_rules.board_id = board_id
        AND board_access_rules.rule_type = 'ministry'
        AND ministry_members.member_id = member_record.id
      ) INTO has_access;
    ELSE
      has_access := false;
  END CASE;
  
  -- Also check for explicit member access
  IF NOT has_access THEN
    SELECT EXISTS (
      SELECT 1 FROM board_access_rules
      WHERE board_access_rules.board_id = board_id
      AND board_access_rules.rule_type = 'member'
      AND board_access_rules.rule_value = member_record.id
    ) INTO has_access;
  END IF;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is board moderator
CREATE OR REPLACE FUNCTION is_board_moderator(board_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN RETURN FALSE; END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM board_moderators
    INNER JOIN members ON members.id = board_moderators.member_id
    WHERE board_moderators.board_id = is_board_moderator.board_id
    AND members.user_id = is_board_moderator.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get member_id from user_id
CREATE OR REPLACE FUNCTION get_member_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
  member_id_val UUID;
BEGIN
  SELECT id INTO member_id_val FROM members WHERE members.user_id = get_member_id.user_id;
  RETURN member_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MESSAGE_BOARDS POLICIES
-- ============================================

-- Public can read public boards
CREATE POLICY "Public can read public boards" ON message_boards
  FOR SELECT USING (is_public = true AND archived_at IS NULL);

-- Authenticated users can read accessible boards
CREATE POLICY "Authenticated can read accessible boards" ON message_boards
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    archived_at IS NULL AND
    (
      is_public = true OR
      check_board_access(id, auth.uid())
    )
  );

-- Admins can insert boards
CREATE POLICY "Admins can insert boards" ON message_boards
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

-- Admins can update boards
CREATE POLICY "Admins can update boards" ON message_boards
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

-- Admins can delete boards (soft delete via archive)
CREATE POLICY "Admins can archive boards" ON message_boards
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

-- ============================================
-- BOARD_ACCESS_RULES POLICIES
-- ============================================

-- Users can read access rules for boards they can access
CREATE POLICY "Users can read board access rules" ON board_access_rules
  FOR SELECT USING (
    check_board_access(board_id, auth.uid()) OR
    is_admin(auth.uid())
  );

-- Admins can manage access rules
CREATE POLICY "Admins can manage access rules" ON board_access_rules
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

-- ============================================
-- BOARD_MODERATORS POLICIES
-- ============================================

-- Users can read moderators for boards they can access
CREATE POLICY "Users can read board moderators" ON board_moderators
  FOR SELECT USING (
    check_board_access(board_id, auth.uid()) OR
    is_admin(auth.uid())
  );

-- Admins can manage moderators
CREATE POLICY "Admins can manage moderators" ON board_moderators
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    is_admin(auth.uid())
  );

-- ============================================
-- MESSAGE_THREADS POLICIES
-- ============================================

-- Users can read threads in boards they can access
CREATE POLICY "Users can read accessible threads" ON message_threads
  FOR SELECT USING (
    check_board_access(board_id, auth.uid()) OR
    is_admin(auth.uid())
  );

-- Authenticated users can create threads in accessible boards
CREATE POLICY "Users can create threads" ON message_threads
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    check_board_access(board_id, auth.uid())
  );

-- Users can update threads they created, or moderators/admins can update any
CREATE POLICY "Users can update threads" ON message_threads
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    (
      created_by = get_member_id(auth.uid()) OR
      is_board_moderator(board_id, auth.uid()) OR
      is_admin(auth.uid())
    )
  );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can read messages in accessible threads
-- Deleted messages only visible to author and moderators
CREATE POLICY "Users can read accessible messages" ON messages
  FOR SELECT USING (
    (
      check_board_access(
        (SELECT board_id FROM message_threads WHERE id = thread_id),
        auth.uid()
      ) OR
      is_admin(auth.uid())
    ) AND
    (
      is_deleted = false OR
      author_id = get_member_id(auth.uid()) OR
      is_board_moderator(
        (SELECT board_id FROM message_threads WHERE id = thread_id),
        auth.uid()
      ) OR
      is_admin(auth.uid())
    )
  );

-- Authenticated users can create messages in accessible threads
CREATE POLICY "Users can create messages" ON messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    check_board_access(
      (SELECT board_id FROM message_threads WHERE id = thread_id),
      auth.uid()
    ) AND
    -- Check thread is not locked
    NOT (SELECT is_locked FROM message_threads WHERE id = thread_id)
  );

-- Users can update their own messages, moderators/admins can update any
CREATE POLICY "Users can update messages" ON messages
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    (
      author_id = get_member_id(auth.uid()) OR
      is_board_moderator(
        (SELECT board_id FROM message_threads WHERE id = thread_id),
        auth.uid()
      ) OR
      is_admin(auth.uid())
    )
  );

-- Users can soft-delete their own messages, moderators/admins can delete any
CREATE POLICY "Users can delete messages" ON messages
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    (
      author_id = get_member_id(auth.uid()) OR
      is_board_moderator(
        (SELECT board_id FROM message_threads WHERE id = thread_id),
        auth.uid()
      ) OR
      is_admin(auth.uid())
    )
  );

-- ============================================
-- MESSAGE_EDITS POLICIES
-- ============================================

-- Users can read edit history for messages they can access
CREATE POLICY "Users can read message edits" ON message_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_edits.message_id
      AND (
        check_board_access(
          (SELECT board_id FROM message_threads WHERE id = messages.thread_id),
          auth.uid()
        ) OR
        is_admin(auth.uid())
      )
    )
  );

-- ============================================
-- MESSAGE_REACTIONS POLICIES
-- ============================================

-- Users can read reactions for messages they can access
CREATE POLICY "Users can read reactions" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_reactions.message_id
      AND (
        check_board_access(
          (SELECT board_id FROM message_threads WHERE id = messages.thread_id),
          auth.uid()
        ) OR
        is_admin(auth.uid())
      )
    )
  );

-- Authenticated users can create reactions
CREATE POLICY "Users can create reactions" ON message_reactions
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    member_id = get_member_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_reactions.message_id
      AND check_board_access(
        (SELECT board_id FROM message_threads WHERE id = messages.thread_id),
        auth.uid()
      )
    )
  );

-- Users can delete their own reactions
CREATE POLICY "Users can delete reactions" ON message_reactions
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    member_id = get_member_id(auth.uid())
  );

-- ============================================
-- MESSAGE_REPORTS POLICIES
-- ============================================

-- Users can create reports
CREATE POLICY "Users can create reports" ON message_reports
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    reported_by = get_member_id(auth.uid())
  );

-- Users can read their own reports
CREATE POLICY "Users can read own reports" ON message_reports
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (
      reported_by = get_member_id(auth.uid()) OR
      is_board_moderator(
        (SELECT message_threads.board_id FROM message_threads 
         INNER JOIN messages ON messages.thread_id = message_threads.id
         WHERE messages.id = message_reports.message_id),
        auth.uid()
      ) OR
      is_admin(auth.uid())
    )
  );

-- Moderators and admins can update reports
CREATE POLICY "Moderators can update reports" ON message_reports
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    (
      is_board_moderator(
        (SELECT message_threads.board_id FROM message_threads 
         INNER JOIN messages ON messages.thread_id = message_threads.id
         WHERE messages.id = message_reports.message_id),
        auth.uid()
      ) OR
      is_admin(auth.uid())
    )
  );

-- ============================================
-- BOARD_NOTIFICATION_PREFERENCES POLICIES
-- ============================================

-- Users can read their own preferences
CREATE POLICY "Users can read own preferences" ON board_notification_preferences
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    member_id = get_member_id(auth.uid())
  );

-- Users can manage their own preferences
CREATE POLICY "Users can manage own preferences" ON board_notification_preferences
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    member_id = get_member_id(auth.uid())
  );

-- ============================================
-- MODERATION_LOGS POLICIES
-- ============================================

-- Moderators and admins can read logs
CREATE POLICY "Moderators can read logs" ON moderation_logs
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (
      is_board_moderator(
        (SELECT board_id FROM message_threads WHERE id = moderation_logs.target_id),
        auth.uid()
      ) OR
      is_admin(auth.uid())
    )
  );

-- System can insert logs (via triggers/functions)
CREATE POLICY "System can insert logs" ON moderation_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    member_id = get_member_id(auth.uid())
  );

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    member_id = get_member_id(auth.uid())
  );

-- System can insert notifications (via triggers/functions)
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

