-- Add Stripe support to donations table
-- Update donation_status enum to include 'paid' status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'paid' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'donation_status')
  ) THEN
    ALTER TYPE donation_status ADD VALUE 'paid';
  END IF;
END $$;

-- Add Stripe-related columns to donations table
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'etransfer',
  ADD COLUMN IF NOT EXISTS payment_type TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CAD',
  ADD COLUMN IF NOT EXISTS stripe_metadata JSONB;

-- Create stripe_subscriptions table
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  donor_email TEXT,
  donation_category_id UUID REFERENCES donation_categories(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CAD',
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at on stripe_subscriptions
CREATE TRIGGER update_stripe_subscriptions_updated_at 
  BEFORE UPDATE ON stripe_subscriptions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on stripe_subscriptions table
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions" ON stripe_subscriptions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM members WHERE id = stripe_subscriptions.member_id
    )
    OR donor_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Users can update their own subscriptions (for status updates from webhook)
-- Note: Actual subscription management happens via Stripe Customer Portal
CREATE POLICY "Users can update own subscriptions" ON stripe_subscriptions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM members WHERE id = stripe_subscriptions.member_id
    )
    OR donor_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions" ON stripe_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_member_id ON stripe_subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_donations_stripe_customer_id ON donations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_donations_stripe_subscription_id ON donations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_donations_payment_method ON donations(payment_method);

-- Add comments for documentation
COMMENT ON COLUMN donations.stripe_payment_intent_id IS 'Stripe payment intent ID for one-time payments';
COMMENT ON COLUMN donations.stripe_subscription_id IS 'Stripe subscription ID for recurring donations';
COMMENT ON COLUMN donations.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN donations.stripe_invoice_id IS 'Stripe invoice ID for tracking';
COMMENT ON COLUMN donations.payment_method IS 'Payment method: etransfer or stripe';
COMMENT ON COLUMN donations.payment_type IS 'Payment type: one_time or subscription';
COMMENT ON COLUMN donations.is_recurring IS 'Whether this is a recurring donation';
COMMENT ON COLUMN donations.currency IS 'Currency code (default: CAD)';
COMMENT ON COLUMN donations.stripe_metadata IS 'Additional Stripe metadata stored as JSONB';

