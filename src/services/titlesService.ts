import type { Title } from "../types";
import { supabase } from "./supabase";

export const titlesService = {
  async getAll(): Promise<Title[]> {
    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
