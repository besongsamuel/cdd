-- Set all existing members to verified
-- This ensures all current members are verified by default

UPDATE members
SET is_verified = true
WHERE is_verified = false;

COMMENT ON TABLE members IS 'All existing members have been set to verified status. New members created by admins will be verified, while user signups will be unverified.';

