import type { ContactSubmission } from "../types";
import { supabase } from "./supabase";

const getSupabaseUrl = (): string => {
  return import.meta.env.VITE_SUPABASE_URL || "";
};

export const contactService = {
  async getAll(): Promise<ContactSubmission[]> {
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(
    submission: Omit<ContactSubmission, "id" | "created_at">
  ): Promise<ContactSubmission> {
    const supabaseUrl = getSupabaseUrl();
    if (!supabaseUrl) {
      throw new Error("Missing Supabase URL configuration");
    }

    // Get session token (optional - edge function accepts both authenticated and anonymous)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/contact-us`;

    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token && {
          Authorization: `Bearer ${session.access_token}`,
        }),
      },
      body: JSON.stringify(submission),
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
    if (!result.success) {
      throw new Error(result.error || "Failed to submit contact form");
    }

    // Return the submission data in the expected format
    return {
      id: result.submission.id,
      name: submission.name,
      email: submission.email,
      message: submission.message,
      created_at: result.submission.created_at,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("contact_submissions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

