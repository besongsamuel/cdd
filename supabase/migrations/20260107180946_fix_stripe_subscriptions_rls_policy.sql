-- Fix stripe_subscriptions RLS policies
-- Replace direct access to auth.users table with auth.email() function
-- which is available in RLS policies without requiring table permissions

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own subscriptions" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON stripe_subscriptions;

-- Recreate policies using auth.email() instead of direct auth.users access
-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions" ON stripe_subscriptions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM members WHERE id = stripe_subscriptions.member_id
    )
    OR (auth.email() IS NOT NULL AND donor_email = auth.email())
  );

-- Users can update their own subscriptions (for status updates from webhook)
-- Note: Actual subscription management happens via Stripe Customer Portal
CREATE POLICY "Users can update own subscriptions" ON stripe_subscriptions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM members WHERE id = stripe_subscriptions.member_id
    )
    OR (auth.email() IS NOT NULL AND donor_email = auth.email())
  );

