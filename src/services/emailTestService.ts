import { supabase } from "./supabase";

const getSupabaseUrl = (): string => {
  return import.meta.env.VITE_SUPABASE_URL || "";
};

export interface TestEmailPayload {
  eventType: string;
  eventData: Record<string, unknown>;
  testRecipient: string;
}

export interface TestEmailResponse {
  success: boolean;
  message: string;
  recipient?: string;
  error?: string;
}

export const emailTestService = {
  async sendTestEmail(payload: TestEmailPayload): Promise<TestEmailResponse> {
    const supabaseUrl = getSupabaseUrl();
    if (!supabaseUrl) {
      throw new Error("Missing Supabase URL configuration");
    }

    // Get the session token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Not authenticated");
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-email`;

    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        eventType: payload.eventType,
        eventData: payload.eventData,
        testMode: true,
        testRecipient: payload.testRecipient,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  },
};

