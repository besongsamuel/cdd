import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="https://esm.sh/stripe@14.21.0/types/index.d.ts"
import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header (check both cases)
    const authHeader =
      req.headers.get("Authorization") || req.headers.get("authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Ensure authHeader starts with "Bearer " (some clients are strict about this)
    const normalizedAuthHeader = authHeader.startsWith("Bearer ")
      ? authHeader
      : `Bearer ${authHeader}`;

    // Create authenticated Supabase client
    // Pass both Authorization and apikey headers to ensure proper authentication
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: normalizedAuthHeader,
          apikey: supabaseAnonKey,
        },
      },
    });

    // Verify user authentication
    // getUser() uses the Authorization header from the client configuration
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Log for debugging
    if (userError) {
      console.error("getUser error details:", {
        message: userError.message,
        status: userError.status,
        name: userError.name,
      });
    }

    if (userError) {
      console.error("Auth error:", userError.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      console.error("No user found");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { customer_id } = body;

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: "customer_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify that the customer belongs to the authenticated user
    const { data: subscription } = await supabase
      .from("stripe_subscriptions")
      .select("member_id, donor_email")
      .eq("stripe_customer_id", customer_id)
      .single();

    if (!subscription) {
      return new Response(JSON.stringify({ error: "Subscription not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user owns this subscription
    if (subscription.member_id) {
      const { data: member } = await supabase
        .from("members")
        .select("user_id")
        .eq("id", subscription.member_id)
        .single();

      if (!member || member.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (subscription.donor_email !== user.email) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
    });

    // Get return URL from environment or use production default
    const returnUrl =
      Deno.env.get("STRIPE_PORTAL_RETURN_URL") ||
      "https://eglisecitededavid.com/profile/complete";

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: returnUrl,
    });

    return new Response(
      JSON.stringify({
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating portal session:", error);
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
