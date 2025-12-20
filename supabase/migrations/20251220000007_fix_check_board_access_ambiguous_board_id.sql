-- Fix ambiguous board_id references in check_board_access function
-- The function parameter board_id conflicts with the board_id column in queries

CREATE OR REPLACE FUNCTION check_board_access(board_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  board_record RECORD;
  member_record RECORD;
  has_access BOOLEAN := false;
  p_board_id UUID; -- Use a different variable name to avoid ambiguity
BEGIN
  p_board_id := check_board_access.board_id; -- Assign parameter to local variable
  
  -- Get board
  SELECT * INTO board_record FROM message_boards WHERE id = p_board_id;
  
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
        WHERE board_access_rules.board_id = p_board_id
        AND board_access_rules.rule_type = 'title'
        AND board_access_rules.rule_value = member_record.title_id
      ) INTO has_access;
    WHEN 'department' THEN
      -- Check if member is in any department that matches rules
      SELECT EXISTS (
        SELECT 1 FROM board_access_rules
        INNER JOIN department_members ON department_members.department_id = board_access_rules.rule_value
        WHERE board_access_rules.board_id = p_board_id
        AND board_access_rules.rule_type = 'department'
        AND department_members.member_id = member_record.id
      ) INTO has_access;
    WHEN 'ministry' THEN
      -- Check if member is in any ministry that matches rules
      SELECT EXISTS (
        SELECT 1 FROM board_access_rules
        INNER JOIN ministry_members ON ministry_members.ministry_id = board_access_rules.rule_value
        WHERE board_access_rules.board_id = p_board_id
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
      WHERE board_access_rules.board_id = p_board_id
      AND board_access_rules.rule_type = 'member'
      AND board_access_rules.rule_value = member_record.id
    ) INTO has_access;
  END IF;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

