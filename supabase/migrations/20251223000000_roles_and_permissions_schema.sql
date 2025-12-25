-- Roles and Permissions System
-- Creates tables, functions, seed data, and RLS policies for role-based access control

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_superuser BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Create member_roles junction table
CREATE TABLE IF NOT EXISTS member_roles (
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (member_id, role_id)
);

-- Create member_permissions junction table
CREATE TABLE IF NOT EXISTS member_permissions (
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (member_id, permission_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_member_id ON member_roles(member_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_role_id ON member_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_member_permissions_member_id ON member_permissions(member_id);
CREATE INDEX IF NOT EXISTS idx_member_permissions_permission_id ON member_permissions(permission_id);

-- Enable RLS on all tables
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_permissions ENABLE ROW LEVEL SECURITY;

-- Public read access for permissions and roles (for UI dropdowns)
CREATE POLICY "Public can read permissions" ON permissions
  FOR SELECT USING (true);

CREATE POLICY "Public can read roles" ON roles
  FOR SELECT USING (true);

CREATE POLICY "Public can read role_permissions" ON role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Public can read member_roles" ON member_roles
  FOR SELECT USING (true);

CREATE POLICY "Public can read member_permissions" ON member_permissions
  FOR SELECT USING (true);

-- Admin-only write access (using is_admin helper function)
CREATE POLICY "Admins can manage permissions" ON permissions
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles" ON roles
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage role_permissions" ON role_permissions
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage member_roles" ON member_roles
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can manage member_permissions" ON member_permissions
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Function to check if member is superuser (via role or is_admin)
CREATE OR REPLACE FUNCTION is_superuser(member_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if member has is_admin flag
  IF EXISTS (
    SELECT 1 FROM members
    WHERE members.id = is_superuser.member_id
    AND members.is_admin = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if member has superuser role
  IF EXISTS (
    SELECT 1 FROM member_roles mr
    JOIN roles r ON r.id = mr.role_id
    WHERE mr.member_id = is_superuser.member_id
    AND r.is_superuser = true
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all resolved permissions for a member
-- Returns union of permissions from roles + direct permissions
CREATE OR REPLACE FUNCTION get_member_permissions(member_id UUID)
RETURNS TABLE(permission_name TEXT) AS $$
BEGIN
  -- If member is superuser, return all permissions
  IF is_superuser(member_id) THEN
    RETURN QUERY
    SELECT p.name::TEXT
    FROM permissions p;
    RETURN;
  END IF;
  
  -- Get permissions from roles
  RETURN QUERY
  SELECT DISTINCT p.name::TEXT
  FROM member_roles mr
  JOIN role_permissions rp ON rp.role_id = mr.role_id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE mr.member_id = get_member_permissions.member_id
  
  UNION
  
  -- Get direct permissions
  SELECT DISTINCT p.name::TEXT
  FROM member_permissions mp
  JOIN permissions p ON p.id = mp.permission_id
  WHERE mp.member_id = get_member_permissions.member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if member has a specific permission
CREATE OR REPLACE FUNCTION member_has_permission(member_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  -- If member is superuser, they have all permissions
  IF is_superuser(member_id) THEN
    RETURN true;
  END IF;
  
  -- Check if permission exists in resolved permissions
  SELECT EXISTS (
    SELECT 1 FROM get_member_permissions(member_id) AS perms
    WHERE perms.permission_name = member_has_permission.permission_name
  ) INTO has_perm;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed permissions
INSERT INTO permissions (name, description) VALUES
  -- Management permissions
  ('manage:members', 'Add, edit, delete members'),
  ('manage:events', 'Create, edit, delete events and regular programs'),
  ('manage:gallery', 'Upload, edit, delete gallery photos'),
  ('manage:finance', 'Manage donations, budgets, financial transparency'),
  ('manage:departments', 'Create, edit, delete departments and manage department members'),
  ('manage:ministries', 'Create, edit, delete ministries and manage ministry members'),
  ('manage:requests', 'Manage prayer requests, support requests, and testimony requests'),
  ('manage:suggestions', 'Review and manage suggestions from members'),
  ('manage:testimonies', 'Approve, feature, and manage testimonies'),
  ('manage:message-boards', 'Create, edit, delete message boards and threads'),
  ('manage:titles', 'Manage member titles (Pastor, Deacon, etc.)'),
  ('manage:roles', 'Manage roles and permissions system (meta-permission)'),
  ('manage:settings', 'Manage application settings'),
  -- Viewing permissions
  ('view:finance', 'View financial transparency reports and budgets'),
  ('view:donations', 'View detailed donation information'),
  ('view:contact-submissions', 'View contact form submissions'),
  -- Moderation permissions
  ('moderate:message-boards', 'Moderate messages, lock threads, handle reports'),
  ('moderate:testimonies', 'Approve/reject testimonies'),
  ('moderate:suggestions', 'Review and respond to suggestions')
ON CONFLICT (name) DO NOTHING;

-- Seed roles
INSERT INTO roles (name, description, is_superuser) VALUES
  ('superuser', 'Full system access with all permissions', true),
  ('pastor', 'High-level leadership role with broad management capabilities', false),
  ('elder', 'Leadership role with management capabilities', false),
  ('finance-manager', 'Financial management role', false),
  ('content-manager', 'Content and events management role', false),
  ('department-lead', 'Department-specific management role', false),
  ('ministry-lead', 'Ministry-specific management role', false),
  ('moderator', 'Content moderation role', false),
  ('member', 'Basic member role with no special permissions', false)
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to superuser role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'superuser'),
  id
FROM permissions
ON CONFLICT DO NOTHING;

-- Assign permissions to pastor role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'pastor'),
  id
FROM permissions
WHERE name IN (
  'manage:members',
  'manage:events',
  'manage:departments',
  'manage:ministries',
  'manage:requests',
  'manage:testimonies',
  'manage:message-boards',
  'view:finance',
  'view:donations',
  'moderate:message-boards',
  'moderate:testimonies',
  'moderate:suggestions'
)
ON CONFLICT DO NOTHING;

-- Assign permissions to elder role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'elder'),
  id
FROM permissions
WHERE name IN (
  'manage:events',
  'manage:departments',
  'manage:ministries',
  'manage:requests',
  'view:finance',
  'moderate:message-boards',
  'moderate:testimonies',
  'moderate:suggestions'
)
ON CONFLICT DO NOTHING;

-- Assign permissions to finance-manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'finance-manager'),
  id
FROM permissions
WHERE name IN (
  'manage:finance',
  'view:finance',
  'view:donations'
)
ON CONFLICT DO NOTHING;

-- Assign permissions to content-manager role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'content-manager'),
  id
FROM permissions
WHERE name IN (
  'manage:events',
  'manage:gallery',
  'manage:testimonies',
  'moderate:testimonies'
)
ON CONFLICT DO NOTHING;

-- Assign permissions to department-lead role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'department-lead'),
  id
FROM permissions
WHERE name IN (
  'manage:departments',
  'view:finance'
)
ON CONFLICT DO NOTHING;

-- Assign permissions to ministry-lead role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'ministry-lead'),
  id
FROM permissions
WHERE name IN (
  'manage:ministries',
  'manage:events'
)
ON CONFLICT DO NOTHING;

-- Assign permissions to moderator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'moderator'),
  id
FROM permissions
WHERE name IN (
  'moderate:message-boards',
  'moderate:testimonies',
  'moderate:suggestions',
  'manage:requests'
)
ON CONFLICT DO NOTHING;

-- Function to automatically assign superuser role to members with is_admin=true
CREATE OR REPLACE FUNCTION auto_assign_superuser_role()
RETURNS TRIGGER AS $$
DECLARE
  superuser_role_id UUID;
BEGIN
  -- Get superuser role ID
  SELECT id INTO superuser_role_id FROM roles WHERE name = 'superuser' LIMIT 1;
  
  -- If member is admin and doesn't have superuser role, assign it
  IF NEW.is_admin = true AND superuser_role_id IS NOT NULL THEN
    INSERT INTO member_roles (member_id, role_id)
    VALUES (NEW.id, superuser_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- If member is no longer admin, remove superuser role
  IF NEW.is_admin = false AND superuser_role_id IS NOT NULL THEN
    DELETE FROM member_roles
    WHERE member_id = NEW.id AND role_id = superuser_role_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign superuser role when is_admin changes
CREATE TRIGGER trigger_auto_assign_superuser_role
  AFTER INSERT OR UPDATE OF is_admin ON members
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_superuser_role();

-- Assign superuser role to existing admin members
INSERT INTO member_roles (member_id, role_id)
SELECT 
  m.id,
  (SELECT id FROM roles WHERE name = 'superuser')
FROM members m
WHERE m.is_admin = true
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE permissions IS 'System permissions that can be assigned to roles or members';
COMMENT ON TABLE roles IS 'Roles that contain sets of permissions';
COMMENT ON TABLE role_permissions IS 'Junction table linking roles to their permissions';
COMMENT ON TABLE member_roles IS 'Junction table linking members to their roles';
COMMENT ON TABLE member_permissions IS 'Junction table linking members to direct permissions';
COMMENT ON FUNCTION is_superuser(UUID) IS 'Checks if a member is a superuser (via role or is_admin flag)';
COMMENT ON FUNCTION get_member_permissions(UUID) IS 'Returns all resolved permissions for a member (from roles + direct permissions)';
COMMENT ON FUNCTION member_has_permission(UUID, TEXT) IS 'Checks if a member has a specific permission';

