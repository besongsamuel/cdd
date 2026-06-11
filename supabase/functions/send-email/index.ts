import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// Import Resend directly from npm registry via esm.sh
import { Resend } from "https://esm.sh/resend@3.3.0";

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

// Event type to template ID mapping
// Template IDs are the template file names without the .html extension
const EVENT_TEMPLATE_MAP: Record<string, string> = {
  "department-join-request": "department-join-request",
  "ministry-join-request": "ministry-join-request",
  suggestion: "suggestion",
  "prayer-request": "prayer-request",
  "support-request": "support-request",
  "testimony-request": "testimony-request",
  donation: "donation",
  "contact-submission": "contact-submission",
  "weekly-digest": "weekly-digest",
  "board-summary": "board-summary",
  "thread-mention": "thread-mention",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
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
    let payload: EmailPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate payload
    if (!payload.eventType || !payload.eventData) {
      return new Response(
        JSON.stringify({ error: "Missing eventType or eventData" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get authorization header
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing authorization header" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Test mode: send directly to testRecipient
      const templateId = EVENT_TEMPLATE_MAP[payload.eventType];
      if (!templateId) {
        return new Response(
          JSON.stringify({ error: `Unknown event type: ${payload.eventType}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      await sendEmailViaResend(
        [payload.testRecipient],
        [],
        `[TEST] New ${getEventTypeLabel(payload.eventType)}`,
        templateId,
        payload.eventData,
        payload.eventType
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: "Test email sent successfully",
          recipient: payload.testRecipient,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get CC recipients (elders and apostles)
    // Special case: for donations, only apostles are CC'd (elders are TO)
    // For weekly-digest and board-summary, no CC (all recipients are in TO)
    let ccRecipients: EmailRecipient[] = [];
    if (payload.eventType === "donation") {
      ccRecipients = await getApostleRecipients(supabase);
    } else if (
      payload.eventType !== "weekly-digest" &&
      payload.eventType !== "board-summary" &&
      payload.eventType !== "thread-mention"
    ) {
      ccRecipients = await getCCRecipients(supabase);
    }

    if (payload.eventType === "thread-mention") {
      payload.eventData = await enrichThreadMentionData(
        payload.eventData,
        supabase
      );
    }

    // Get template ID for this event type
    const templateId = EVENT_TEMPLATE_MAP[payload.eventType];
    if (!templateId) {
      console.error(`Unknown event type: ${payload.eventType}`);
      return new Response(
        JSON.stringify({ error: `Unknown event type: ${payload.eventType}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email via Resend using template
    await sendEmailViaResend(
      recipients.to.map((r) => r.email),
      ccRecipients.map((r) => r.email),
      `New ${getEventTypeLabel(payload.eventType)}`,
      templateId,
      payload.eventData,
      payload.eventType
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        recipients: recipients.to.length,
        cc: ccRecipients.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
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
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
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
    user_id?: string | null;
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
            name,
            user_id
          )
        `
        )
        .eq("department_id", eventData.department_id)
        .eq("is_lead", true);

      if (!error && data) {
        recipients = (data as DepartmentMemberData[])
          .filter(
            (dm) =>
              dm.members?.email &&
              typeof dm.members.email === "string" &&
              dm.members.user_id !== null &&
              dm.members.user_id !== undefined
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
            name,
            user_id
          )
        `
        )
        .eq("ministry_id", eventData.ministry_id)
        .eq("is_lead", true);

      if (!error && data) {
        recipients = (data as DepartmentMemberData[])
          .filter(
            (mm) =>
              mm.members?.email &&
              typeof mm.members.email === "string" &&
              mm.members.user_id !== null &&
              mm.members.user_id !== undefined
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
          .not("email", "is", null)
          ;

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
              name,
              user_id
            )
          `
          )
          .eq("department_id", deptData.id)
          .eq("is_lead", true);

        if (!error && data) {
          recipients = (data as DepartmentMemberData[])
            .filter(
              (dm) =>
                dm.members?.email &&
                typeof dm.members.email === "string" &&
                dm.members.user_id !== null &&
                dm.members.user_id !== undefined
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
              name,
              user_id
            )
          `
          )
          .eq("department_id", deptData.id)
          .eq("is_lead", true);

        if (!error && data) {
          recipients = (data as DepartmentMemberData[])
            .filter(
              (dm) =>
                dm.members?.email &&
                typeof dm.members.email === "string" &&
                dm.members.user_id !== null &&
                dm.members.user_id !== undefined
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
          .not("email", "is", null)
          ;

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
          .not("email", "is", null)
          ;

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

    case "weekly-digest": {
      // Get Elder and Apostle title IDs
      const { data: titlesData } = await supabase
        .from("titles")
        .select("id")
        .in("name", ["Elder", "Apostle"]);

      if (titlesData && titlesData.length > 0) {
        const titleIds = (titlesData as TitleData[]).map(
          (t: TitleData) => t.id
        );
        const { data, error } = await supabase
          .from("members")
          .select("email, name")
          .in("title_id", titleIds)
          .not("email", "is", null)
          ;

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

    case "board-summary":
    case "thread-mention": {
      const memberId = eventData.member_id;
      if (memberId && typeof memberId === "string") {
        const { data, error } = await supabase
          .from("members")
          .select("email, name, user_id")
          .eq("id", memberId)
          .single();

        if (
          !error &&
          data &&
          data.email &&
          data.user_id
        ) {
          recipients = [
            {
              email: data.email,
              name: data.name,
            },
          ];
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
    .not("email", "is", null)
    ;

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
    .not("email", "is", null)
    ;

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

/**
 * Convert event data to template variables
 * Handles nested properties (e.g., department.name -> DEPARTMENT_NAME)
 * and flattens the object for Resend template variables
 */
function prepareTemplateVariables(
  eventData: Record<string, unknown>
): Record<string, string | number> {
  const variables: Record<string, string | number> = {};

  function flattenObject(obj: Record<string, unknown>, prefix = ""): void {
    for (const [key, value] of Object.entries(obj)) {
      const variableKey = prefix
        ? `${prefix}_${key.toUpperCase()}`
        : key.toUpperCase();

      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === "object" && !Array.isArray(value)) {
        // Recursively flatten nested objects
        flattenObject(value as Record<string, unknown>, variableKey);
      } else {
        // Convert value to string or number
        if (typeof value === "number") {
          variables[variableKey] = value;
        } else {
          variables[variableKey] = String(value);
        }
      }
    }
  }

  flattenObject(eventData);
  return variables;
}

async function sendEmailViaResend(
  toAddresses: string[],
  ccAddresses: string[],
  subject: string,
  templateId: string,
  eventData: Record<string, unknown>,
  eventType?: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const resend = new Resend(RESEND_API_KEY);

  // Prepare template variables from event data
  const templateVariables = prepareTemplateVariables(eventData);

  // Suggestion template: ensure all required variables have a value (anonymous or optional fields may be missing)
  const NOT_PROVIDED = "Not provided";
  if (eventType === "suggestion") {
    const suggestionDefaults: Record<string, string> = {
      SUBMITTER_NAME: "Anonymous Member",
      SUBMITTER_PHONE: NOT_PROVIDED,
      CATEGORY_NAME: NOT_PROVIDED,
      SUGGESTION_TEXT: NOT_PROVIDED,
      CREATED_AT: new Date().toISOString(),
    };
    for (const [key, defaultVal] of Object.entries(suggestionDefaults)) {
      if (
        templateVariables[key] === undefined ||
        templateVariables[key] === null ||
        String(templateVariables[key]).trim() === ""
      ) {
        templateVariables[key] = defaultVal;
      }
    }
  }

  // Debug logging for board-summary emails
  if (eventType === "board-summary") {
    console.log("Board summary template variables:", Object.keys(templateVariables));
    if (templateVariables.BOARDS_SUMMARY_HTML) {
      console.log(`BOARDS_SUMMARY_HTML length: ${String(templateVariables.BOARDS_SUMMARY_HTML).length}`);
    } else {
      console.warn("BOARDS_SUMMARY_HTML variable not found in template variables!");
    }
  }

  // Map EMAIL to appropriate variable name to avoid Resend reserved variable
  if ("EMAIL" in templateVariables) {
    const emailValue = templateVariables.EMAIL;
    const emailKey =
      eventType === "contact-submission" ? "CONTACT_EMAIL" : "SUBMITTER_EMAIL";

    // Create new object without EMAIL and with the correct email key
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { EMAIL: _removed, ...rest } = templateVariables;
    const finalVariables = {
      ...rest,
      [emailKey]: emailValue,
    };

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toAddresses,
      cc: ccAddresses.length > 0 ? ccAddresses : undefined,
      subject: subject,
      template: {
        id: templateId,
        variables: finalVariables,
      },
    });

    if (error) {
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toAddresses,
    cc: ccAddresses.length > 0 ? ccAddresses : undefined,
    subject: subject,
    template: {
      id: templateId,
      variables: templateVariables,
    },
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
    "weekly-digest": "Weekly Digest",
    "board-summary": "Board Activity Summary",
    "thread-mention": "Board Mention",
  };
  return labels[eventType] || eventType;
}

async function enrichThreadMentionData(
  eventData: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<Record<string, unknown>> {
  const memberId = eventData.member_id as string | undefined;
  const boardId = eventData.board_id as string | undefined;
  const threadId = eventData.thread_id as string | undefined;
  const messageId = eventData.message_id as string | undefined;
  const mentionerId = eventData.mentioner_id as string | undefined;

  const frontendUrl =
    Deno.env.get("FRONTEND_URL") || "https://eglisecitededavid.com";

  const enriched: Record<string, unknown> = { ...eventData };

  if (memberId) {
    const { data } = await supabase
      .from("members")
      .select("name")
      .eq("id", memberId)
      .single();
    if (data?.name) enriched.MEMBER_NAME = data.name;
  }

  if (boardId) {
    const { data } = await supabase
      .from("message_boards")
      .select("name")
      .eq("id", boardId)
      .single();
    if (data?.name) enriched.BOARD_NAME = data.name;
  }

  if (threadId) {
    const { data } = await supabase
      .from("message_threads")
      .select("title")
      .eq("id", threadId)
      .single();
    if (data?.title) enriched.THREAD_TITLE = data.title;
  }

  if (mentionerId) {
    const { data } = await supabase
      .from("members")
      .select("name")
      .eq("id", mentionerId)
      .single();
    if (data?.name) enriched.MENTIONER_NAME = data.name;
  }

  if (messageId) {
    const { data } = await supabase
      .from("messages")
      .select("content")
      .eq("id", messageId)
      .single();
    if (data?.content) {
      const preview = String(data.content)
        .replace(/@\[([^\]]+)\]\(member:[^)]+\)/g, "@$1")
        .substring(0, 200);
      enriched.MESSAGE_PREVIEW = preview;
    }
  }

  if (boardId && threadId) {
    enriched.THREAD_URL = `${frontendUrl}/message-boards/${boardId}/threads/${threadId}`;
  }

  return enriched;
}
