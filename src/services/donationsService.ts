import type { Donation } from "../types";
import { supabase } from "./supabase";

export const donationsService = {
  async create(
    donation: Omit<Donation, "id" | "created_at" | "category_name">
  ): Promise<Donation> {
    const { data, error } = await supabase
      .from("donations")
      .insert({
        ...donation,
        status: donation.status || "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAll(): Promise<Donation[]> {
    const { data, error } = await supabase
      .from("donations")
      .select(
        `
        *,
        donation_categories (
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      category_name: item.donation_categories?.name,
    }));
  },

  async update(id: string, donation: Partial<Donation>): Promise<Donation> {
    const updateData: any = { ...donation };

    // If status is being updated to 'received' or 'verified', set received_at
    if (donation.status === "received" || donation.status === "verified") {
      if (!donation.received_at) {
        updateData.received_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from("donations")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        donation_categories (
          name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      category_name: data.donation_categories?.name,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("donations").delete().eq("id", id);

    if (error) throw error;
  },

  async getStats(): Promise<{
    total: number;
    totalAmount: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const donations = await this.getAll();

    const stats = {
      total: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + Number(d.amount), 0),
      byStatus: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    donations.forEach((donation) => {
      // Count by status
      stats.byStatus[donation.status] =
        (stats.byStatus[donation.status] || 0) + 1;

      // Count by category
      const categoryName = donation.category_name || "Unspecified";
      stats.byCategory[categoryName] =
        (stats.byCategory[categoryName] || 0) + Number(donation.amount);
    });

    return stats;
  },
};


