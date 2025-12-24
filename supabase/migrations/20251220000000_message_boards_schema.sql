-- Message Boards Schema
-- Creates all tables and enums for the message board feature

-- Create enum types
CREATE TYPE board_access_type AS ENUM ('public', 'authenticated', 'role_based', 'department', 'ministry');
CREATE TYPE board_access_rule_type AS ENUM ('title', 'department', 'ministry', 'member');
CREATE TYPE board_access_level AS ENUM ('read', 'write', 'moderate');
CREATE TYPE message_reaction_type AS ENUM ('like', 'love', 'prayer', 'check');
CREATE TYPE message_report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- Create message_boards table
CREATE TABLE message_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  access_type board_access_type NOT NULL DEFAULT 'authenticated',
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE,
  display_order INTEGER DEFAULT 0,
  pinned_announcement TEXT
);

-- Create board_access_rules table
CREATE TABLE board_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES message_boards(id) ON DELETE CASCADE,
  rule_type board_access_rule_type NOT NULL,
  rule_value UUID NOT NULL, -- references titles.id, departments.id, ministries.id, or members.id
  access_level board_access_level NOT NULL DEFAULT 'read',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create board_moderators table
CREATE TABLE board_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES message_boards(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES members(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id, member_id)
);

-- Create message_threads table
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES message_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  is_locked BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  locked_by UUID REFERENCES members(id) ON DELETE SET NULL,
  locked_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES members(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  content_html TEXT, -- rendered markdown
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES members(id) ON DELETE SET NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_edits table (for edit history)
CREATE TABLE message_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_reactions table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  reaction_type message_reaction_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, member_id, reaction_type)
);

-- Create message_reports table
CREATE TABLE message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES members(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status message_report_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES members(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create board_notification_preferences table
CREATE TABLE board_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  board_id UUID REFERENCES message_boards(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT false,
  in_app_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, board_id)
);

-- Create moderation_logs table
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- 'lock_thread', 'unlock_thread', 'pin_thread', 'unpin_thread', 'delete_message', 'warn_user', 'mute_user'
  target_type TEXT NOT NULL, -- 'thread', 'message', 'user'
  target_id UUID NOT NULL,
  moderator_id UUID REFERENCES members(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'thread_reply', 'thread_mention', 'message_report', 'moderation_action'
  board_id UUID REFERENCES message_boards(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for updated_at
CREATE TRIGGER update_message_boards_updated_at BEFORE UPDATE ON message_boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_notification_preferences_updated_at BEFORE UPDATE ON board_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update thread's last_message_at and message_count when a message is created
CREATE OR REPLACE FUNCTION update_thread_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET 
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_on_message();

-- Trigger to save edit history
CREATE OR REPLACE FUNCTION save_message_edit_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content AND OLD.edited_at IS NOT NULL THEN
    -- Save previous version
    INSERT INTO message_edits (message_id, content, edited_at)
    VALUES (OLD.id, OLD.content, OLD.edited_at);
  END IF;
  
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.edited_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER save_message_edit_history_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION save_message_edit_history();

-- Comments for documentation
COMMENT ON TABLE message_boards IS 'Message boards for community discussions';
COMMENT ON TABLE board_access_rules IS 'Access control rules for private boards';
COMMENT ON TABLE board_moderators IS 'Moderators assigned to boards';
COMMENT ON TABLE message_threads IS 'Discussion threads within boards';
COMMENT ON TABLE messages IS 'Individual messages in threads';
COMMENT ON TABLE message_edits IS 'Edit history for messages';
COMMENT ON TABLE message_reactions IS 'Reactions to messages';
COMMENT ON TABLE message_reports IS 'Reports of inappropriate messages';
COMMENT ON TABLE board_notification_preferences IS 'User notification preferences per board';
COMMENT ON TABLE moderation_logs IS 'Log of all moderation actions';
COMMENT ON TABLE notifications IS 'In-app notifications for users';


