import type { Department } from "../types";
import { supabase } from "./supabase";

export const departmentsService = {
  async getAll(): Promise<Department[]> {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getActive(): Promise<Department[]> {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Department> {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(
    department: Omit<Department, "id" | "created_at" | "updated_at">
  ): Promise<Department> {
    const { data, error } = await supabase
      .from("departments")
      .insert(department)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    id: string,
    department: Partial<Omit<Department, "id" | "created_at" | "updated_at">>
  ): Promise<Department> {
    const { data, error } = await supabase
      .from("departments")
      .update({ ...department, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("departments").delete().eq("id", id);

    if (error) throw error;
  },
};



