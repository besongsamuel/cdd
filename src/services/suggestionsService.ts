import type { Suggestion } from "../types";
import { supabase } from "./supabase";

export const suggestionsService = {
  async getAll(): Promise<Suggestion[]> {
    const { data, error } = await supabase
      .from("suggestions")
      .select(
        `
        *,
        suggestion_categories (
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      category_name: item.suggestion_categories?.name,
    }));
  },

  async getByStatus(status: string): Promise<Suggestion[]> {
    const { data, error } = await supabase
      .from("suggestions")
      .select(
        `
        *,
        suggestion_categories (
          name
        )
      `
      )
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      category_name: item.suggestion_categories?.name,
    }));
  },

  async getPending(): Promise<Suggestion[]> {
    return this.getByStatus("pending");
  },

  async create(
    suggestion: Omit<
      Suggestion,
      "id" | "created_at" | "updated_at" | "category_name" | "status" | "notes"
    >
  ): Promise<Suggestion> {
    const { data, error } = await supabase
      .from("suggestions")
      .insert({
        ...suggestion,
        status: "pending",
      })
      .select(
        `
        *,
        suggestion_categories (
          name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      category_name: data.suggestion_categories?.name,
    };
  },

  async updateStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<Suggestion> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from("suggestions")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        suggestion_categories (
          name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      category_name: data.suggestion_categories?.name,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("suggestions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};



