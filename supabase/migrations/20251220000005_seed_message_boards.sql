-- Seed Message Boards
-- Creates boards for departments, ministries, leader types, and general boards

-- Helper function to get an admin member ID (or first member if no admin exists)
CREATE OR REPLACE FUNCTION get_admin_member_id()
RETURNS UUID AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Try to get an admin member
  SELECT id INTO admin_id FROM members WHERE is_admin = true LIMIT 1;
  
  -- If no admin, get first member
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM members LIMIT 1;
  END IF;
  
  -- If still no member, return NULL (will be handled by ON DELETE SET NULL)
  RETURN admin_id;
END;
$$ LANGUAGE plpgsql;

-- Get admin member ID for created_by
DO $$
DECLARE
  admin_member_id UUID;
BEGIN
  admin_member_id := get_admin_member_id();
  
  -- Create public board (General Discussion) - only if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM message_boards WHERE name = 'General Discussion') THEN
    INSERT INTO message_boards (name, description, is_public, access_type, created_by, display_order)
    VALUES (
      'General Discussion',
      'A public board for general discussions and fellowship. Everyone is welcome to participate.',
      true,
      'public',
      admin_member_id,
      1
    );
  END IF;
  
  -- Create board for all authenticated members (Member Community) - only if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM message_boards WHERE name = 'Member Community') THEN
    INSERT INTO message_boards (name, description, is_public, access_type, created_by, display_order)
    VALUES (
      'Member Community',
      'A private board for all church members to connect, share, and support one another.',
      false,
      'authenticated',
      admin_member_id,
      2
    );
  END IF;
  
  -- Create boards for each department - only if they don't exist
  INSERT INTO message_boards (name, description, is_public, access_type, created_by, display_order)
  SELECT 
    d.name || ' Board',
    'Discussion board for the ' || d.name || ' department. ' || COALESCE(d.description, ''),
    false,
    'department',
    admin_member_id,
    10 + d.display_order
  FROM departments d
  WHERE d.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM message_boards mb 
      WHERE mb.name = d.name || ' Board'
    );
  
  -- Create boards for each ministry - only if they don't exist
  INSERT INTO message_boards (name, description, is_public, access_type, created_by, display_order)
  SELECT 
    m.name || ' Ministry Board',
    'Discussion board for the ' || m.name || ' ministry. ' || COALESCE(m.description, ''),
    false,
    'ministry',
    admin_member_id,
    20 + m.display_order
  FROM ministries m
  WHERE m.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM message_boards mb 
      WHERE mb.name = m.name || ' Ministry Board'
    );
  
  -- Create boards for leader types (Elders, Deacons, Pastors, Ministers, Apostles)
  INSERT INTO message_boards (name, description, is_public, access_type, created_by, display_order)
  SELECT 
    t.name || 's Board',
    'Private discussion board for ' || t.name || 's.',
    false,
    'role_based',
    admin_member_id,
    30 + t.display_order
  FROM titles t
  WHERE t.name IN ('Pastor', 'Deacon', 'Elder', 'Minister', 'Apostle')
    AND NOT EXISTS (
      SELECT 1 FROM message_boards mb 
      WHERE mb.name = t.name || 's Board'
    );
END $$;

-- Create access rules for department boards - only if they don't exist
INSERT INTO board_access_rules (board_id, rule_type, rule_value, access_level)
SELECT 
  mb.id,
  'department',
  d.id,
  'write'
FROM message_boards mb
INNER JOIN departments d ON mb.name = d.name || ' Board'
WHERE mb.access_type = 'department'
  AND NOT EXISTS (
    SELECT 1 FROM board_access_rules bar
    WHERE bar.board_id = mb.id
      AND bar.rule_type = 'department'
      AND bar.rule_value = d.id
  );

-- Create access rules for ministry boards - only if they don't exist
INSERT INTO board_access_rules (board_id, rule_type, rule_value, access_level)
SELECT 
  mb.id,
  'ministry',
  m.id,
  'write'
FROM message_boards mb
INNER JOIN ministries m ON mb.name = m.name || ' Ministry Board'
WHERE mb.access_type = 'ministry'
  AND NOT EXISTS (
    SELECT 1 FROM board_access_rules bar
    WHERE bar.board_id = mb.id
      AND bar.rule_type = 'ministry'
      AND bar.rule_value = m.id
  );

-- Create access rules for role-based boards (leader types) - only if they don't exist
INSERT INTO board_access_rules (board_id, rule_type, rule_value, access_level)
SELECT 
  mb.id,
  'title',
  t.id,
  'write'
FROM message_boards mb
INNER JOIN titles t ON mb.name = t.name || 's Board'
WHERE mb.access_type = 'role_based'
  AND t.name IN ('Pastor', 'Deacon', 'Elder', 'Minister', 'Apostle')
  AND NOT EXISTS (
    SELECT 1 FROM board_access_rules bar
    WHERE bar.board_id = mb.id
      AND bar.rule_type = 'title'
      AND bar.rule_value = t.id
  );

-- Function to create a board when a new department is created
CREATE OR REPLACE FUNCTION create_department_board()
RETURNS TRIGGER AS $$
DECLARE
  admin_member_id UUID;
  new_board_id UUID;
BEGIN
  -- Only create board for active departments
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;
  
  -- Get admin member ID
  admin_member_id := get_admin_member_id();
  
  -- Create board for the new department
  INSERT INTO message_boards (name, description, is_public, access_type, created_by, display_order)
  VALUES (
    NEW.name || ' Board',
    'Discussion board for the ' || NEW.name || ' department. ' || COALESCE(NEW.description, ''),
    false,
    'department',
    admin_member_id,
    10 + COALESCE(NEW.display_order, 0)
  )
  RETURNING id INTO new_board_id;
  
  -- Create access rule for the department (only if it doesn't exist)
  INSERT INTO board_access_rules (board_id, rule_type, rule_value, access_level)
  SELECT new_board_id, 'department', NEW.id, 'write'
  WHERE NOT EXISTS (
    SELECT 1 FROM board_access_rules
    WHERE board_id = new_board_id
      AND rule_type = 'department'
      AND rule_value = NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create a board when a new ministry is created
CREATE OR REPLACE FUNCTION create_ministry_board()
RETURNS TRIGGER AS $$
DECLARE
  admin_member_id UUID;
  new_board_id UUID;
BEGIN
  -- Only create board for active ministries
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;
  
  -- Get admin member ID
  admin_member_id := get_admin_member_id();
  
  -- Create board for the new ministry
  INSERT INTO message_boards (name, description, is_public, access_type, created_by, display_order)
  VALUES (
    NEW.name || ' Ministry Board',
    'Discussion board for the ' || NEW.name || ' ministry. ' || COALESCE(NEW.description, ''),
    false,
    'ministry',
    admin_member_id,
    20 + COALESCE(NEW.display_order, 0)
  )
  RETURNING id INTO new_board_id;
  
  -- Create access rule for the ministry (only if it doesn't exist)
  INSERT INTO board_access_rules (board_id, rule_type, rule_value, access_level)
  SELECT new_board_id, 'ministry', NEW.id, 'write'
  WHERE NOT EXISTS (
    SELECT 1 FROM board_access_rules
    WHERE board_id = new_board_id
      AND rule_type = 'ministry'
      AND rule_value = NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_create_department_board ON departments;
CREATE TRIGGER trigger_create_department_board
  AFTER INSERT ON departments
  FOR EACH ROW
  EXECUTE FUNCTION create_department_board();

DROP TRIGGER IF EXISTS trigger_create_ministry_board ON ministries;
CREATE TRIGGER trigger_create_ministry_board
  AFTER INSERT ON ministries
  FOR EACH ROW
  EXECUTE FUNCTION create_ministry_board();

-- Comments
COMMENT ON FUNCTION get_admin_member_id() IS 'Returns an admin member ID or first member ID for board creation';
COMMENT ON FUNCTION create_department_board() IS 'Automatically creates a board when a new department is created';
COMMENT ON FUNCTION create_ministry_board() IS 'Automatically creates a board when a new ministry is created';
COMMENT ON TRIGGER trigger_create_department_board ON departments IS 'Creates a message board automatically when a department is created';
COMMENT ON TRIGGER trigger_create_ministry_board ON ministries IS 'Creates a message board automatically when a ministry is created';
