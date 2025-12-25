import type { Permission } from "../types";
import { supabase } from "./supabase";

export const permissionsService = {
  async getAll(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Permission | null> {
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  async create(permission: Omit<Permission, "id" | "created_at">): Promise<Permission> {
    const { data, error } = await supabase
      .from("permissions")
      .insert(permission)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, permission: Partial<Permission>): Promise<Permission> {
    const { data, error } = await supabase
      .from("permissions")
      .update(permission)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("permissions").delete().eq("id", id);

    if (error) throw error;
  },
};

