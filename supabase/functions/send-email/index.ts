import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// AWS SES configuration
const AWS_SES_REGION = Deno.env.get("AWS_SES_REGION") || "us-east-1";
const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID") || "";
const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY") || "";
const FROM_EMAIL = "noreply@eglisecitededavid.com";

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailPayload {
  eventType: string;
  eventData: Record<string, unknown>;
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
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    const payload: EmailPayload = await req.json();

    // Validate payload
    if (!payload.eventType || !payload.eventData) {
      return new Response(
        JSON.stringify({ error: "Missing eventType or eventData" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Supabase client
    // Use service role key for database access from edge function
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ||
      Deno.env.get("SUPABASE_PROJECT_URL") ||
      "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      throw new Error("Missing Supabase configuration");
    }

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
        { status: 200, headers: { "Content-Type": "application/json" } }
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
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const htmlBody = await loadAndProcessTemplate(
      templateName,
      payload.eventData
    );

    // Send email via AWS SES
    await sendEmailViaSES(
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
      { status: 200, headers: { "Content-Type": "application/json" } }
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
      { status: 200, headers: { "Content-Type": "application/json" } }
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

    // Simple placeholder replacement
    // Replace {{variable}} with actual values from eventData
    let processed = templateContent;

    // Replace common placeholders
    for (const [key, value] of Object.entries(eventData)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      processed = processed.replace(placeholder, String(value || ""));
    }

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

async function sendEmailViaSES(
  toAddresses: string[],
  ccAddresses: string[],
  subject: string,
  htmlBody: string
): Promise<void> {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials not configured");
  }

  // AWS SES v2 SendEmail API endpoint
  const endpoint = `https://email.${AWS_SES_REGION}.amazonaws.com/v2/email/outbound-emails`;

  // Create AWS Signature Version 4
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.substring(0, 8);

  const payload = {
    FromEmailAddress: FROM_EMAIL,
    Destination: {
      ToAddresses: toAddresses,
      ...(ccAddresses.length > 0 && { CcAddresses: ccAddresses }),
    },
    Content: {
      Simple: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
        },
      },
    },
  };

  const payloadString = JSON.stringify(payload);
  const payloadHash = await sha256(payloadString);

  // Create canonical request for AWS Signature V4
  const canonicalRequest = `POST
/v2/email/outbound-emails

host:email.${AWS_SES_REGION}.amazonaws.com
x-amz-date:${amzDate}

host;x-amz-date
${payloadHash}`;

  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = `AWS4-HMAC-SHA256
${amzDate}
${dateStamp}/${AWS_SES_REGION}/ses/aws4_request
${canonicalRequestHash}`;

  const signingKey = await getSigningKey(
    AWS_SECRET_ACCESS_KEY,
    dateStamp,
    AWS_SES_REGION,
    "ses"
  );

  const signature = await hmacSha256Hex(signingKey, stringToSign);
  const authHeader = `AWS4-HMAC-SHA256 Credential=${AWS_ACCESS_KEY_ID}/${dateStamp}/${AWS_SES_REGION}/ses/aws4_request, SignedHeaders=host;x-amz-date, Signature=${signature}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-amz-date": amzDate,
      Authorization: authHeader,
    },
    body: payloadString,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AWS SES error: ${response.status} - ${errorText}`);
  }
}

// Helper functions for AWS Signature V4
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(
  key: Uint8Array,
  message: string
): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<Uint8Array> {
  const kDate = await hmacSha256Raw(
    new TextEncoder().encode(`AWS4${secretKey}`),
    dateStamp
  );
  const kRegion = await hmacSha256Raw(kDate, region);
  const kService = await hmacSha256Raw(kRegion, service);
  return await hmacSha256Raw(kService, "aws4_request");
}

async function hmacSha256Raw(
  key: Uint8Array,
  message: string
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message)
  );
  return new Uint8Array(signature);
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
