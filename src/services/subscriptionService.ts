import type { StripeSubscription } from "../types";
import { supabase } from "./supabase";

export const subscriptionService = {
  async getByMemberId(memberId: string): Promise<StripeSubscription[]> {
    const { data, error } = await supabase
      .from("stripe_subscriptions")
      .select(
        `
        *,
        donation_categories (
          name
        )
      `
      )
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      category_name: item.donation_categories?.name,
    }));
  },

  async getByEmail(email: string): Promise<StripeSubscription[]> {
    const { data, error } = await supabase
      .from("stripe_subscriptions")
      .select(
        `
        *,
        donation_categories (
          name
        )
      `
      )
      .eq("donor_email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      category_name: item.donation_categories?.name,
    }));
  },

  async getActiveByMemberId(memberId: string): Promise<StripeSubscription[]> {
    const subscriptions = await this.getByMemberId(memberId);
    return subscriptions.filter((sub) => sub.status === "active");
  },
};

