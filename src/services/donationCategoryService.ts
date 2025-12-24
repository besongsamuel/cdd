import type { DonationCategory } from "../types";
import { supabase } from "./supabase";

export const donationCategoryService = {
  async getAll(): Promise<DonationCategory[]> {
    const { data, error } = await supabase
      .from("donation_categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getActive(): Promise<DonationCategory[]> {
    const { data, error } = await supabase
      .from("donation_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(
    category: Omit<DonationCategory, "id" | "created_at" | "updated_at">
  ): Promise<DonationCategory> {
    const { data, error } = await supabase
      .from("donation_categories")
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    id: string,
    category: Partial<DonationCategory>
  ): Promise<DonationCategory> {
    const { data, error } = await supabase
      .from("donation_categories")
      .update({ ...category, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("donation_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};




