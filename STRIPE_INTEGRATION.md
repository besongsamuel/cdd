# Stripe Integration for Donations

This document describes the Stripe integration for accepting donations through the City of David Church website.

## Overview

The Stripe integration enables:
- **One-time donations** via Stripe Checkout
- **Recurring monthly subscriptions** for ongoing support
- **Automatic payment processing** via webhooks
- **User subscription management** through Stripe Customer Portal
- **Donation history tracking** with tax credit estimates

## Architecture

```
User → Donations Page → Stripe Checkout → Payment Success
                                              ↓
                                    Stripe Webhook → Edge Function
                                              ↓
                                    Database (donations, stripe_subscriptions)
```

## Database Schema

### Donations Table Updates

The `donations` table has been extended with the following Stripe-related fields:

- `stripe_payment_intent_id` - Stripe payment intent ID for one-time payments
- `stripe_subscription_id` - Stripe subscription ID for recurring donations
- `stripe_customer_id` - Stripe customer ID
- `stripe_invoice_id` - Stripe invoice ID for tracking
- `payment_method` - Payment method: 'etransfer' or 'stripe'
- `payment_type` - Payment type: 'one_time' or 'subscription'
- `is_recurring` - Boolean indicating if donation is recurring
- `currency` - Currency code (default: 'CAD')
- `stripe_metadata` - Additional Stripe metadata stored as JSONB

### Stripe Subscriptions Table

New table `stripe_subscriptions` tracks active subscriptions:

- `stripe_subscription_id` - Unique Stripe subscription ID
- `stripe_customer_id` - Stripe customer ID
- `member_id` - Reference to members table (nullable)
- `donor_email` - Email of donor
- `donation_category_id` - Reference to donation_categories
- `amount` - Monthly donation amount
- `currency` - Currency code
- `status` - Subscription status (active, canceled, past_due, etc.)
- `current_period_start` - Start of current billing period
- `current_period_end` - End of current billing period
- `cancel_at_period_end` - Whether subscription will cancel at period end
- `canceled_at` - Cancellation timestamp
- `metadata` - Additional metadata

## Configuration

### Environment Variables

#### Frontend (.env)

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Stripe publishable key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Backend (Supabase Edge Functions)

Set via Supabase CLI:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_... # Stripe secret key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret
```

Optional environment variables for edge functions:

```bash
STRIPE_SUCCESS_URL=https://your-domain.com/donations?success=true
STRIPE_CANCEL_URL=https://your-domain.com/donations?canceled=true
STRIPE_PORTAL_RETURN_URL=https://your-domain.com/profile/complete
```

### Stripe Dashboard Configuration

1. **Create a Stripe Account** at https://stripe.com
2. **Get API Keys** from Dashboard → Developers → API keys
3. **Set up Webhook**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Select events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the webhook signing secret

4. **Configure Customer Portal** (optional):
   - Go to Settings → Billing → Customer portal
   - Enable subscription cancellation and updates

## Edge Functions

### create-checkout-session

Creates a Stripe Checkout session for donations.

**Endpoint**: `/functions/v1/create-checkout-session`

**Method**: POST

**Authentication**: Required (Supabase JWT)

**Request Body**:
```json
{
  "amount": 50.00,
  "categoryId": "uuid-here",
  "paymentType": "one_time" | "subscription",
  "memberId": "uuid-here",
  "email": "donor@example.com",
  "donorName": "John Doe",
  "notes": "Optional notes"
}
```

**Response**:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### stripe-webhook

Handles Stripe webhook events for payment processing.

**Endpoint**: `/functions/v1/stripe-webhook`

**Method**: POST

**Authentication**: Webhook signature verification

**Events Handled**:
- `checkout.session.completed` - Creates donation record
- `invoice.payment_succeeded` - Creates donation for subscription payment
- `invoice.payment_failed` - Logs failed payment
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks subscription as canceled

### create-portal-session

Creates a Stripe Customer Portal session for subscription management.

**Endpoint**: `/functions/v1/create-portal-session`

**Method**: POST

**Authentication**: Required (Supabase JWT)

**Request Body**:
```json
{
  "customer_id": "cus_..."
}
```

**Response**:
```json
{
  "url": "https://billing.stripe.com/..."
}
```

## Frontend Integration

### Donations Page

The donations page (`src/pages/DonationsPage.tsx`) has been updated to support:

1. **Payment Method Selection**: Choose between Stripe (card) or E-transfer
2. **Payment Type Selection**: One-time or monthly subscription (for Stripe)
3. **Stripe Checkout Redirect**: Redirects to Stripe-hosted checkout page
4. **Success/Cancel Handling**: Handles redirects from Stripe

### User Profile

The profile page (`src/pages/CompleteProfilePage.tsx`) includes tabs for:

1. **Profile**: Edit user profile information
2. **Donation History**: View all donations with tax credit estimates
3. **Subscriptions**: Manage active subscriptions

### Components

#### DonationHistory

Displays:
- Total donations (all time)
- Current year donations
- Estimated tax credit for current tax year
- Donations grouped by category
- Tax credit breakdown by category
- Complete donation history table

#### SubscriptionManagement

Displays:
- Active subscriptions with details
- Next billing date
- Actions to manage or cancel subscriptions
- Redirects to Stripe Customer Portal for management

## Tax Credit Calculation

Canadian charitable donation tax credits typically range from **50-59%** of the donation amount.

The tax credit calculator (`src/utils/taxCreditCalculator.ts`):
- Defaults to **50%** (conservative estimate)
- Can be configured via environment variable
- Calculates credits for the current tax year
- Provides breakdown by category

**Functions**:
- `calculateTaxCredit(donations, taxYear, rate?)` - Calculate total tax credit
- `getTaxCreditByCategory(donations, taxYear, rate?)` - Get breakdown by category

## Payment Flow

### One-Time Payment

1. User fills donation form on `/donations`
2. Selects "Credit/Debit Card (Stripe)" and "One-time"
3. Clicks "Pay with Stripe"
4. Redirected to Stripe Checkout
5. Completes payment
6. Redirected back to `/donations?success=true`
7. Webhook creates donation record with status "paid"

### Subscription Payment

1. User fills donation form on `/donations`
2. Selects "Credit/Debit Card (Stripe)" and "Monthly Subscription"
3. Clicks "Subscribe with Stripe"
4. Redirected to Stripe Checkout
5. Completes subscription setup
6. Redirected back to `/donations?success=true`
7. Webhook creates:
   - Subscription record in `stripe_subscriptions`
   - Initial donation record with status "paid"
8. Each month, `invoice.payment_succeeded` webhook creates new donation record

### Subscription Management

1. User goes to Profile → Subscriptions tab
2. Views active subscriptions
3. Clicks "Manage" to open Stripe Customer Portal
4. Can update payment method, cancel subscription, etc.
5. Changes sync via webhook events

## Testing

### Test Mode

Use Stripe test mode keys for development:
- Test publishable key: `pk_test_...`
- Test secret key: `sk_test_...`
- Test card numbers: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (declined)

### Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

## Security Considerations

1. **Webhook Signature Verification**: All webhooks are verified using Stripe's signature
2. **Authentication**: Checkout and portal sessions require user authentication
3. **RLS Policies**: Database RLS ensures users can only access their own data
4. **Environment Variables**: Sensitive keys stored as Supabase secrets

## Troubleshooting

### Checkout Session Not Created

- Verify `STRIPE_SECRET_KEY` is set in Supabase secrets
- Check user authentication (must be logged in)
- Verify request body format

### Webhook Not Processing

- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check webhook endpoint URL in Stripe dashboard
- Verify webhook events are selected in Stripe dashboard
- Check edge function logs in Supabase dashboard

### Subscription Not Appearing

- Verify webhook processed `checkout.session.completed` event
- Check `stripe_subscriptions` table for record
- Verify `member_id` or `donor_email` matches user

### Portal Session Not Created

- Verify user owns the subscription (check `member_id` or `donor_email`)
- Verify `STRIPE_SECRET_KEY` is set
- Check customer ID is valid

## Migration

To apply the database changes:

```bash
supabase migration up
```

Or apply manually via Supabase SQL Editor:
- Run `supabase/migrations/20260107000000_add_stripe_to_donations.sql`

## Support

For issues or questions:
1. Check Supabase edge function logs
2. Check Stripe dashboard for payment status
3. Review webhook events in Stripe dashboard
4. Check browser console for frontend errors

## Future Enhancements

Potential improvements:
- [ ] Support for annual subscriptions
- [ ] Custom donation amounts for subscriptions
- [ ] Email receipts for donations
- [ ] Tax receipt generation
- [ ] Donation goals and progress tracking
- [ ] Multi-currency support
- [ ] Refund handling via Stripe

