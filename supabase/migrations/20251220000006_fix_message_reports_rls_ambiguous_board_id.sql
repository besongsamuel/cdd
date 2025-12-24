-- Fix ambiguous board_id references in message_reports RLS policies
-- This migration fixes the "column reference board_id is ambiguous" error

-- Drop and recreate the "Users can read own reports" policy with explicit table qualifier
DROP POLICY IF EXISTS "Users can read own reports" ON message_reports;

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

-- Drop and recreate the "Moderators can update reports" policy with explicit table qualifier
DROP POLICY IF EXISTS "Moderators can update reports" ON message_reports;

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


