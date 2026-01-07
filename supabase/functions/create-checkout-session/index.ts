import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckoutSessionRequest {
  amount: number;
  category_id?: string;
  payment_type: "one_time" | "subscription";
  member_id?: string;
  email: string;
  donor_name?: string;
  notes?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header (optional - donations can be anonymous)
    const authHeader = req.headers.get("Authorization");

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Create Supabase client (with auth header if provided)
    const supabase = authHeader
      ? createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        })
      : createClient(supabaseUrl, supabaseAnonKey);

    // Try to get user if authenticated (optional)
    let user = null;
    if (authHeader) {
      try {
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.log("Auth error (non-fatal, continuing as anonymous):", userError.message);
        } else if (authUser) {
          user = authUser;
        }
      } catch (authErr) {
        console.log("Auth exception (non-fatal, continuing as anonymous):", authErr);
        // Continue without user - donation can be anonymous
      }
    }

    // Parse request body
    const body: CheckoutSessionRequest = await req.json();

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.payment_type || !["one_time", "subscription"].includes(body.payment_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment_type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
    });

    // Get member info if member_id is provided or if user is authenticated
    let memberId = body.member_id;
    let memberName = body.donor_name;
    
    if (!memberId && user) {
      // Try to find member by user_id
      const { data: member } = await supabase
        .from("members")
        .select("id, name, email")
        .eq("user_id", user.id)
        .single();

      if (member) {
        memberId = member.id;
        if (!memberName) {
          memberName = member.name;
        }
      }
    }

    // Get category name if category_id is provided
    let categoryName = "General Donation";
    if (body.category_id) {
      const { data: category } = await supabase
        .from("donation_categories")
        .select("name")
        .eq("id", body.category_id)
        .single();

      if (category) {
        categoryName = category.name;
      }
    }

    // Build metadata
    const metadata: Record<string, string> = {
      payment_type: body.payment_type,
      email: body.email,
    };

    if (memberId) {
      metadata.member_id = memberId;
    }
    if (body.category_id) {
      metadata.donation_category_id = body.category_id;
    }
    if (memberName) {
      metadata.donor_name = memberName;
    }

    // Get success and cancel URLs from environment or use defaults
    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "") || "";
    const successUrl = Deno.env.get("STRIPE_SUCCESS_URL") || 
      `${baseUrl.replace("/functions/v1", "")}/donations?success=true`;
    const cancelUrl = Deno.env.get("STRIPE_CANCEL_URL") || 
      `${baseUrl.replace("/functions/v1", "")}/donations?canceled=true`;

    // Create Stripe Checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: body.payment_type === "subscription" ? "subscription" : "payment",
      customer_email: body.email,
      client_reference_id: memberId || body.email,
      metadata,
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `Donation - ${categoryName}`,
              description: body.notes || `Donation to ${categoryName}`,
            },
            unit_amount: Math.round(body.amount * 100), // Convert to cents
            ...(body.payment_type === "subscription" && {
              recurring: {
                interval: "month",
              },
            }),
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ["card"],
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

