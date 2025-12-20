import type { Testimony } from "../types";
import { supabase } from "./supabase";

export const testimoniesService = {
  async getAll(): Promise<Testimony[]> {
    const { data, error } = await supabase
      .from("testimonies")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getFeatured(): Promise<Testimony[]> {
    const { data, error } = await supabase
      .from("testimonies")
      .select("*")
      .eq("is_featured", true)
      .eq("is_approved", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getApproved(): Promise<Testimony[]> {
    const { data, error } = await supabase
      .from("testimonies")
      .select("*")
      .eq("is_approved", true)
      .order("is_featured", { ascending: false })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(
    testimony: Omit<
      Testimony,
      | "id"
      | "is_featured"
      | "is_approved"
      | "display_order"
      | "created_at"
      | "updated_at"
    >
  ): Promise<Testimony> {
    const { data, error } = await supabase
      .from("testimonies")
      .insert({
        ...testimony,
        is_featured: false,
        is_approved: false,
        display_order: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    id: string,
    updates: Partial<Omit<Testimony, "id" | "created_at">>
  ): Promise<Testimony> {
    const { data, error } = await supabase
      .from("testimonies")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("testimonies").delete().eq("id", id);

    if (error) throw error;
  },

  async toggleFeatured(id: string): Promise<Testimony> {
    // First get current state
    const { data: current, error: fetchError } = await supabase
      .from("testimonies")
      .select("is_featured")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!current) throw new Error("Testimony not found");

    return this.update(id, { is_featured: !current.is_featured });
  },

  async approve(id: string): Promise<Testimony> {
    return this.update(id, { is_approved: true });
  },

  async reject(id: string): Promise<Testimony> {
    return this.update(id, { is_approved: false, is_featured: false });
  },
};
