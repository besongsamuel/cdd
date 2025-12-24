import type { SuggestionCategory } from "../types";
import { supabase } from "./supabase";

export const suggestionCategoriesService = {
  async getActive(): Promise<SuggestionCategory[]> {
    const { data, error } = await supabase
      .from("suggestion_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAll(): Promise<SuggestionCategory[]> {
    const { data, error } = await supabase
      .from("suggestion_categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<SuggestionCategory> {
    const { data, error } = await supabase
      .from("suggestion_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },
};





