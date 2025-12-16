-- Cleanup test members with @example.com email addresses
-- This migration removes members that have email addresses ending with @example.com
-- which are typically used for testing purposes

DELETE FROM members
WHERE email LIKE '%@example.com';

-- Log the cleanup (optional, for tracking)
-- You can check how many rows were affected by running:
-- SELECT COUNT(*) FROM members WHERE email LIKE '%@example.com';
-- before running this migration

