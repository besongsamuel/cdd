import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "resend";

// Resend configuration
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = "City of David <noreply@eglisecitededavid.com>";

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailPayload {
  eventType: string;
  eventData: Record<string, unknown>;
  testMode?: boolean;
  testRecipient?: string;
}

// Event type to template mapping
const EVENT_TEMPLATE_MAP: Record<string, string> = {
  "department-join-request": "department-join-request.html",
  "ministry-join-request": "ministry-join-request.html",
  suggestion: "suggestion.html",
  "prayer-request": "prayer-request.html",
  "support-request": "support-request.html",
  "testimony-request": "testimony-request.html",
  donation: "donation.html",
  "contact-submission": "contact-submission.html",
};

serve(async (req) => {
  // CORS headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };

  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      });
    }

    let payload: EmailPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate payload
    if (!payload.eventType || !payload.eventData) {
      return new Response(
        JSON.stringify({ error: "Missing eventType or eventData" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Supabase configuration
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ||
      Deno.env.get("SUPABASE_PROJECT_URL") ||
      "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Missing Supabase configuration");
      throw new Error("Missing Supabase configuration");
    }

    // If test mode, verify admin authentication
    if (payload.testMode) {
      if (!payload.testRecipient) {
        return new Response(
          JSON.stringify({ error: "testRecipient is required in test mode" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Get authorization header
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing authorization header" }),
          { status: 401, headers: corsHeaders }
        );
      }

      // Create authenticated client to verify user
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      // Check if user is admin
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: currentMember } = await supabaseAdmin
        .from("members")
        .select("is_admin, user_id")
        .eq("user_id", user.id)
        .single();

      const isAdmin = currentMember?.is_admin === true;

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden: Admin access required" }),
          { status: 403, headers: corsHeaders }
        );
      }

      // Test mode: send directly to testRecipient
      const templateName = EVENT_TEMPLATE_MAP[payload.eventType];
      if (!templateName) {
        return new Response(
          JSON.stringify({ error: `Unknown event type: ${payload.eventType}` }),
          { status: 400, headers: corsHeaders }
        );
      }

      const htmlBody = await loadAndProcessTemplate(
        templateName,
        payload.eventData
      );

      await sendEmailViaResend(
        [payload.testRecipient],
        [],
        `[TEST] New ${getEventTypeLabel(payload.eventType)}`,
        htmlBody
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "Test email sent successfully",
          recipient: payload.testRecipient,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Normal mode: Get Supabase client for database access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve recipients based on event type
    const recipients = await resolveRecipients(
      payload.eventType,
      payload.eventData,
      supabase
    );

    if (recipients.to.length === 0) {
      console.log(`No recipients found for event type: ${payload.eventType}`);
      return new Response(
        JSON.stringify({ success: true, message: "No recipients to notify" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Get CC recipients (elders and apostles)
    // Special case: for donations, only apostles are CC'd (elders are TO)
    let ccRecipients: EmailRecipient[] = [];
    if (payload.eventType === "donation") {
      ccRecipients = await getApostleRecipients(supabase);
    } else {
      ccRecipients = await getCCRecipients(supabase);
    }

    // Load and process email template
    const templateName = EVENT_TEMPLATE_MAP[payload.eventType];
    if (!templateName) {
      console.error(`Unknown event type: ${payload.eventType}`);
      return new Response(
        JSON.stringify({ error: `Unknown event type: ${payload.eventType}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    const htmlBody = await loadAndProcessTemplate(
      templateName,
      payload.eventData
    );

    // Send email via Resend
    await sendEmailViaResend(
      recipients.to.map((r) => r.email),
      ccRecipients.map((r) => r.email),
      `New ${getEventTypeLabel(payload.eventType)}`,
      htmlBody
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        recipients: recipients.to.length,
        cc: ccRecipients.length,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    // Log error but return success (non-blocking)
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email processing attempted (errors logged)",
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 200, headers: corsHeaders }
    );
  }
});

// Deno-specific: Using any for Supabase client - type is complex and not easily imported in Deno edge functions
// The actual Supabase client type from @supabase/supabase-js is not available in this context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any; // NOSONAR

interface DepartmentMemberData {
  members?: {
    email?: string;
    name?: string;
  };
}

interface MemberData {
  email?: string;
  name?: string;
}

interface TitleData {
  id: string;
}

async function resolveRecipients(
  eventType: string,
  eventData: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<{ to: EmailRecipient[] }> {
  let recipients: EmailRecipient[] = [];

  switch (eventType) {
    case "department-join-request": {
      const { data, error } = await supabase
        .from("department_members")
        .select(
          `
          member_id,
          members!department_members_member_id_fkey (
            email,
            name
          )
        `
        )
        .eq("department_id", eventData.department_id)
        .eq("is_lead", true);

      if (!error && data) {
        recipients = (data as DepartmentMemberData[])
          .filter(
            (dm) => dm.members?.email && typeof dm.members.email === "string"
          )
          .map((dm) => ({
            email: dm.members!.email!,
            name: dm.members?.name,
          }));
      }
      break;
    }

    case "ministry-join-request": {
      const { data, error } = await supabase
        .from("ministry_members")
        .select(
          `
          member_id,
          members!ministry_members_member_id_fkey (
            email,
            name
          )
        `
        )
        .eq("ministry_id", eventData.ministry_id)
        .eq("is_lead", true);

      if (!error && data) {
        recipients = (data as DepartmentMemberData[])
          .filter(
            (mm) => mm.members?.email && typeof mm.members.email === "string"
          )
          .map((mm) => ({
            email: mm.members!.email!,
            name: mm.members?.name,
          }));
      }
      break;
    }

    case "suggestion":
    case "support-request": {
      // Get all members with Elder title
      const { data: titlesData } = await supabase
        .from("titles")
        .select("id")
        .eq("name", "Elder")
        .single();

      if (titlesData) {
        const { data, error } = await supabase
          .from("members")
          .select("email, name")
          .eq("title_id", titlesData.id)
          .not("email", "is", null);

        if (!error && data) {
          recipients = (data as MemberData[])
            .filter((m) => m.email && typeof m.email === "string")
            .map((m) => ({
              email: m.email!,
              name: m.name,
            }));
        }
      }
      break;
    }

    case "prayer-request": {
      // Get Intercession department heads
      const { data: deptData } = await supabase
        .from("departments")
        .select("id")
        .eq("name", "Intercession")
        .single();

      if (deptData) {
        const { data, error } = await supabase
          .from("department_members")
          .select(
            `
            member_id,
            members!department_members_member_id_fkey (
              email,
              name
            )
          `
          )
          .eq("department_id", deptData.id)
          .eq("is_lead", true);

        if (!error && data) {
          recipients = (data as DepartmentMemberData[])
            .filter(
              (dm) => dm.members?.email && typeof dm.members.email === "string"
            )
            .map((dm) => ({
              email: dm.members!.email!,
              name: dm.members?.name,
            }));
        }
      }
      break;
    }

    case "testimony-request": {
      // Get Moderation department heads
      const { data: deptData } = await supabase
        .from("departments")
        .select("id")
        .eq("name", "Moderation")
        .single();

      if (deptData) {
        const { data, error } = await supabase
          .from("department_members")
          .select(
            `
            member_id,
            members!department_members_member_id_fkey (
              email,
              name
            )
          `
          )
          .eq("department_id", deptData.id)
          .eq("is_lead", true);

        if (!error && data) {
          recipients = (data as DepartmentMemberData[])
            .filter(
              (dm) => dm.members?.email && typeof dm.members.email === "string"
            )
            .map((dm) => ({
              email: dm.members!.email!,
              name: dm.members?.name,
            }));
        }
      }
      break;
    }

    case "donation": {
      // Elders as TO, Apostles as CC (handled separately)
      const { data: titlesData } = await supabase
        .from("titles")
        .select("id")
        .eq("name", "Elder")
        .single();

      if (titlesData) {
        const { data, error } = await supabase
          .from("members")
          .select("email, name")
          .eq("title_id", titlesData.id)
          .not("email", "is", null);

        if (!error && data) {
          recipients = (data as MemberData[])
            .filter((m) => m.email && typeof m.email === "string")
            .map((m) => ({
              email: m.email!,
              name: m.name,
            }));
        }
      }
      break;
    }

    case "contact-submission": {
      const { data: titlesData } = await supabase
        .from("titles")
        .select("id")
        .eq("name", "Deacon")
        .single();

      if (titlesData) {
        const { data, error } = await supabase
          .from("members")
          .select("email, name")
          .eq("title_id", titlesData.id)
          .not("email", "is", null);

        if (!error && data) {
          recipients = (data as MemberData[])
            .filter((m) => m.email && typeof m.email === "string")
            .map((m) => ({
              email: m.email!,
              name: m.name,
            }));
        }
      }
      break;
    }
  }

  return { to: recipients };
}

async function getCCRecipients(
  supabase: SupabaseClient
): Promise<EmailRecipient[]> {
  // Get Elder and Apostle title IDs
  const { data: titlesData } = await supabase
    .from("titles")
    .select("id")
    .in("name", ["Elder", "Apostle"]);

  if (!titlesData || titlesData.length === 0) {
    return [];
  }

  const titleIds = (titlesData as TitleData[]).map((t) => t.id);
  const { data, error } = await supabase
    .from("members")
    .select("email, name")
    .in("title_id", titleIds)
    .not("email", "is", null);

  if (error || !data) {
    return [];
  }

  return (data as MemberData[])
    .filter((m) => m.email && typeof m.email === "string")
    .map((m) => ({
      email: m.email!,
      name: m.name,
    }));
}

async function getApostleRecipients(
  supabase: SupabaseClient
): Promise<EmailRecipient[]> {
  // Get Apostle title ID
  const { data: titlesData } = await supabase
    .from("titles")
    .select("id")
    .eq("name", "Apostle")
    .single();

  if (!titlesData) {
    return [];
  }

  const { data, error } = await supabase
    .from("members")
    .select("email, name")
    .eq("title_id", (titlesData as TitleData).id)
    .not("email", "is", null);

  if (error || !data) {
    return [];
  }

  return (data as MemberData[])
    .filter((m) => m.email && typeof m.email === "string")
    .map((m) => ({
      email: m.email!,
      name: m.name,
    }));
}

async function loadAndProcessTemplate(
  templateName: string,
  eventData: Record<string, unknown>
): Promise<string> {
  try {
    // Load template from filesystem
    const templatePath = `./templates/${templateName}`;
    const templateContent = await Deno.readTextFile(templatePath);

    let processed = templateContent;

    // Handle Mustache-style conditionals {{#variable}}...{{/variable}}
    // Process conditionals first to remove blocks where variables are undefined/null/empty
    processed = processed.replace(
      /{{#(\w+)}}([\s\S]*?){{\/\1}}/g,
      (_match, varName, content) => {
        const value = eventData[varName];
        // If value exists and is truthy, include the content
        if (value !== undefined && value !== null && value !== "") {
          return content;
        }
        return "";
      }
    );

    // Replace nested object properties (e.g., {{department.name}})
    const nestedRegex =
      /{{\s*([a-zA-Z_][a-zA-Z0-9_]*\.([a-zA-Z_][a-zA-Z0-9_]*))\s*}}/g;
    processed = processed.replace(nestedRegex, (_match, fullPath) => {
      const parts = fullPath.split(".");
      let value: unknown = eventData;
      for (const part of parts) {
        if (typeof value === "object" && value !== null && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          value = undefined;
        }
        if (value === undefined) break;
      }
      return value ? String(value) : "";
    });

    // Replace common placeholders (do this last after conditionals are processed)
    for (const [key, value] of Object.entries(eventData)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      processed = processed.replace(placeholder, String(value || ""));
    }

    return processed;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    // Return a basic HTML fallback
    return `
      <html>
        <body>
          <h2>New ${getEventTypeLabel(templateName.replace(".html", ""))}</h2>
          <pre>${JSON.stringify(eventData, null, 2)}</pre>
        </body>
      </html>
    `;
  }
}

async function sendEmailViaResend(
  toAddresses: string[],
  ccAddresses: string[],
  subject: string,
  htmlBody: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const resend = new Resend(RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toAddresses,
    cc: ccAddresses.length > 0 ? ccAddresses : undefined,
    subject: subject,
    html: htmlBody,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}

function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    "department-join-request": "Department Join Request",
    "ministry-join-request": "Ministry Join Request",
    suggestion: "Suggestion",
    "prayer-request": "Prayer Request",
    "support-request": "Support Request",
    "testimony-request": "Testimony Request",
    donation: "Donation",
    "contact-submission": "Contact Submission",
  };
  return labels[eventType] || eventType;
}
