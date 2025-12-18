import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactSubmissionPayload {
  name: string;
  email: string;
  message: string;
}

// Rate limit: 3 submissions per hour per IP
const RATE_LIMIT_COUNT = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

/**
 * Extract IP address from request headers
 * Checks X-Forwarded-For, X-Real-IP, and CF-Connecting-IP headers
 */
function getClientIP(req: Request): string {
  // Check X-Forwarded-For (first IP in chain if proxied)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    if (ips.length > 0) {
      return ips[0];
    }
  }

  // Check X-Real-IP
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) {
    return cfIP;
  }

  // Fallback: try to get from request URL or return unknown
  return "unknown";
}

/**
 * Validate contact submission payload
 */
function validatePayload(payload: unknown): {
  valid: boolean;
  error?: string;
  data?: ContactSubmissionPayload;
} {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Invalid payload" };
  }

  const data = payload as Record<string, unknown>;

  // Validate name
  if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
    return { valid: false, error: "Name is required" };
  }
  if (data.name.length > 200) {
    return { valid: false, error: "Name must be 200 characters or less" };
  }

  // Validate email
  if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
    return { valid: false, error: "Email is required" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, error: "Invalid email format" };
  }
  if (data.email.length > 255) {
    return { valid: false, error: "Email must be 255 characters or less" };
  }

  // Validate message
  if (
    !data.message ||
    typeof data.message !== "string" ||
    !data.message.trim()
  ) {
    return { valid: false, error: "Message is required" };
  }
  if (data.message.length > 5000) {
    return { valid: false, error: "Message must be 5000 characters or less" };
  }

  return {
    valid: true,
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      message: data.message.trim(),
    },
  };
}

/**
 * Check if IP address has exceeded rate limit
 */
// Deno-specific: Using any for Supabase client - type is complex and not easily imported in Deno edge functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any; // NOSONAR

async function checkRateLimit(
  supabase: SupabaseClient,
  ipAddress: string
): Promise<{ allowed: boolean; count: number }> {
  try {
    // Count submissions from this IP in the last hour
    const oneHourAgo = new Date(
      Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { count, error } = await supabase
      .from("contact_submission_throttle")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ipAddress)
      .gte("created_at", oneHourAgo);

    if (error) {
      console.error("Error checking rate limit:", error);
      // On error, allow the request (fail open) but log it
      return { allowed: true, count: 0 };
    }

    const submissionCount = count || 0;
    return {
      allowed: submissionCount < RATE_LIMIT_COUNT,
      count: submissionCount,
    };
  } catch (error) {
    console.error("Exception checking rate limit:", error);
    // Fail open on exception
    return { allowed: true, count: 0 };
  }
}

/**
 * Record throttle entry for IP address
 */
async function recordThrottleEntry(
  supabase: SupabaseClient,
  ipAddress: string
): Promise<void> {
  try {
    await supabase.from("contact_submission_throttle").insert({
      ip_address: ipAddress,
    } as Record<string, unknown>);
  } catch (error) {
    console.error("Error recording throttle entry:", error);
    // Non-fatal error, continue
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Supabase configuration
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ||
      Deno.env.get("SUPABASE_PROJECT_URL") ||
      "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract IP address
    const ipAddress = getClientIP(req);

    // Check rate limit
    if (ipAddress !== "unknown") {
      const rateLimitCheck = await checkRateLimit(supabase, ipAddress);
      if (!rateLimitCheck.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Rate limit exceeded. Maximum ${RATE_LIMIT_COUNT} submissions per hour.`,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Parse and validate request payload
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validation = validatePayload(payload);
    if (!validation.valid || !validation.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error || "Validation failed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const submissionData = validation.data;

    // Insert into contact_submissions table
    const { data: submission, error: insertError } = await supabase
      .from("contact_submissions")
      .insert(submissionData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting contact submission:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to submit contact form",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Record throttle entry (after successful insert)
    if (ipAddress !== "unknown") {
      await recordThrottleEntry(supabase, ipAddress);
    }

    // The database trigger should automatically send the email notification
    // (from migration 20251215101522_email_notifications.sql)

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contact form submitted successfully",
        submission: {
          id: submission.id,
          created_at: submission.created_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in contact-us function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
