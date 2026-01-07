import { supabase } from "./supabase";

interface CreateCheckoutSessionParams {
  amount: number;
  categoryId?: string;
  paymentType: "one_time" | "subscription";
  memberId?: string;
  email: string;
  donorName?: string;
  notes?: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export const stripeService = {
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CheckoutSessionResponse> {
    // Transform camelCase to snake_case to match edge function interface
    const requestBody = {
      amount: params.amount,
      category_id: params.categoryId,
      payment_type: params.paymentType,
      member_id: params.memberId,
      email: params.email,
      donor_name: params.donorName,
      notes: params.notes,
    };

    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: requestBody,
      }
    );

    if (error) {
      throw new Error(error.message || "Failed to create checkout session");
    }

    if (!data) {
      throw new Error("No data returned from checkout session creation");
    }

    return data as CheckoutSessionResponse;
  },

  async createCustomerPortalSession(
    customerId: string
  ): Promise<{ url: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }

    // Use invoke - it should automatically include Authorization header from session
    // If this doesn't work, the issue is likely in the edge function not receiving the header
    const { data, error } = await supabase.functions.invoke(
      "create-portal-session",
      {
        body: { customer_id: customerId },
      }
    );

    if (error) {
      throw new Error(error.message || "Failed to create portal session");
    }

    if (!data) {
      throw new Error("No data returned from portal session creation");
    }

    return data as { url: string };
  },
};

