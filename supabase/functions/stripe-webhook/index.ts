import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Stripe configuration
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error("Stripe configuration missing");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
    });

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the raw body
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabase, stripe);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, supabase);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any,
  stripe: Stripe
) {
  const metadata = session.metadata || {};
  const memberId = metadata.member_id || null;
  const categoryId = metadata.donation_category_id || null;
  const paymentType = metadata.payment_type || "one_time";
  const donorName = metadata.donor_name || session.customer_details?.name || null;
  const email = session.customer_email || metadata.email || null;

  // Get payment intent or subscription details
  let amount = 0;
  let currency = "CAD";
  let stripePaymentIntentId = null;
  let stripeSubscriptionId = null;
  let stripeCustomerId = session.customer as string | null;
  let stripeInvoiceId = null;

  if (session.mode === "payment") {
    // One-time payment
    const paymentIntent = session.payment_intent as string;
    if (paymentIntent) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntent);
      amount = (pi.amount || 0) / 100; // Convert from cents
      currency = (pi.currency || "cad").toUpperCase();
      stripePaymentIntentId = paymentIntent;
    }
  } else if (session.mode === "subscription") {
    // Subscription
    const subscriptionId = session.subscription as string;
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      amount = (subscription.items.data[0]?.price.unit_amount || 0) / 100;
      currency = (subscription.items.data[0]?.price.currency || "cad").toUpperCase();
      stripeSubscriptionId = subscriptionId;
      stripeCustomerId = subscription.customer as string;

      // Create or update subscription record
      await supabase.from("stripe_subscriptions").upsert({
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: stripeCustomerId,
        member_id: memberId,
        donor_email: email,
        donation_category_id: categoryId,
        amount,
        currency,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        metadata: subscription.metadata,
      }, {
        onConflict: "stripe_subscription_id",
      });
    }
  }

  // Create donation record
  const donationData: any = {
    amount,
    donor_name: donorName,
    donor_email: email,
    category_id: categoryId,
    member_id: memberId,
    status: "paid",
    payment_method: "stripe",
    payment_type: paymentType,
    is_recurring: paymentType === "subscription",
    currency,
    stripe_payment_intent_id: stripePaymentIntentId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    stripe_invoice_id: stripeInvoiceId,
    stripe_metadata: metadata,
    received_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("donations").insert(donationData);

  if (error) {
    console.error("Error creating donation:", error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  // This handles recurring subscription payments
  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;
  const amount = (invoice.amount_paid || 0) / 100;
  const currency = (invoice.currency || "cad").toUpperCase();

  // Get subscription details
  const { data: subscription } = await supabase
    .from("stripe_subscriptions")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!subscription) {
    console.error("Subscription not found:", subscriptionId);
    return;
  }

  // Create donation record for this payment
  const donationData: any = {
    amount,
    donor_name: subscription.donor_email ? null : null, // Will be filled from subscription
    donor_email: subscription.donor_email,
    category_id: subscription.donation_category_id,
    member_id: subscription.member_id,
    status: "paid",
    payment_method: "stripe",
    payment_type: "subscription",
    is_recurring: true,
    currency,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    stripe_invoice_id: invoice.id,
    received_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("donations").insert(donationData);

  if (error) {
    console.error("Error creating donation from invoice:", error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  // Log failed payment - could send notification to admin
  console.log("Invoice payment failed:", invoice.id);
  // Optionally create a donation record with status 'pending' or handle differently
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  // Update subscription record
  const { error } = await supabase
    .from("stripe_subscriptions")
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      metadata: subscription.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  // Mark subscription as canceled
  const { error } = await supabase
    .from("stripe_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}

