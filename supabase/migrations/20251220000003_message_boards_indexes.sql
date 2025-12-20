-- Message Boards Indexes
-- Performance indexes for message board tables

-- message_boards indexes
CREATE INDEX IF NOT EXISTS idx_message_boards_is_public ON message_boards(is_public) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_boards_display_order ON message_boards(display_order) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_boards_created_by ON message_boards(created_by);

-- board_access_rules indexes
CREATE INDEX IF NOT EXISTS idx_board_access_rules_board_id ON board_access_rules(board_id);
CREATE INDEX IF NOT EXISTS idx_board_access_rules_rule_type_value ON board_access_rules(rule_type, rule_value);

-- board_moderators indexes
CREATE INDEX IF NOT EXISTS idx_board_moderators_board_id ON board_moderators(board_id);
CREATE INDEX IF NOT EXISTS idx_board_moderators_member_id ON board_moderators(member_id);

-- message_threads indexes
CREATE INDEX IF NOT EXISTS idx_threads_board_id ON message_threads(board_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_message_at ON message_threads(last_message_at DESC) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_threads_is_pinned ON message_threads(is_pinned) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_threads_created_by ON message_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_threads_board_pinned_updated ON message_threads(board_id, is_pinned DESC, last_message_at DESC) WHERE archived_at IS NULL;

-- messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(thread_id, created_at DESC) WHERE is_deleted = false;

-- message_edits indexes
CREATE INDEX IF NOT EXISTS idx_message_edits_message_id ON message_edits(message_id);
CREATE INDEX IF NOT EXISTS idx_message_edits_edited_at ON message_edits(edited_at DESC);

-- message_reactions indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_member_id ON message_reactions(member_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_type ON message_reactions(reaction_type);

-- message_reports indexes
CREATE INDEX IF NOT EXISTS idx_message_reports_message_id ON message_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_reported_by ON message_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status) WHERE status = 'pending';

-- board_notification_preferences indexes
CREATE INDEX IF NOT EXISTS idx_board_notification_preferences_member_id ON board_notification_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_board_notification_preferences_board_id ON board_notification_preferences(board_id);

-- moderation_logs indexes
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target ON moderation_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at DESC);

-- notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(member_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

