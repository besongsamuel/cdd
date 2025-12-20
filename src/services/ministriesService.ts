import type { Ministry } from "../types";
import { supabase } from "./supabase";

export const ministriesService = {
  async getAll(): Promise<Ministry[]> {
    const { data, error } = await supabase
      .from("ministries")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getActive(): Promise<Ministry[]> {
    const { data, error } = await supabase
      .from("ministries")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Ministry> {
    const { data, error } = await supabase
      .from("ministries")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(
    ministry: Omit<Ministry, "id" | "created_at" | "updated_at">
  ): Promise<Ministry> {
    const { data, error } = await supabase
      .from("ministries")
      .insert(ministry)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    id: string,
    ministry: Partial<Omit<Ministry, "id" | "created_at" | "updated_at">>
  ): Promise<Ministry> {
    const { data, error } = await supabase
      .from("ministries")
      .update({ ...ministry, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("ministries").delete().eq("id", id);

    if (error) throw error;
  },
};




