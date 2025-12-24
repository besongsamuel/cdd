-- Add is_verified column to members table
-- This column tracks whether a member has been verified by an admin
-- Unverified members will have restricted access to other members' contact information

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN members.is_verified IS 'Indicates whether the member has been verified by an admin. Unverified members have restricted access to other members contact information.';

