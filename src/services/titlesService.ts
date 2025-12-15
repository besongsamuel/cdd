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

  async getById(id: string): Promise<Title> {
    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(title: Omit<Title, "id" | "created_at">): Promise<Title> {
    const { data, error } = await supabase
      .from("titles")
      .insert(title)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    id: string,
    title: Partial<Omit<Title, "id" | "created_at">>
  ): Promise<Title> {
    const { data, error } = await supabase
      .from("titles")
      .update(title)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("titles").delete().eq("id", id);

    if (error) throw error;
  },

  async reorder(
    titles: { id: string; display_order: number }[]
  ): Promise<void> {
    const updates = titles.map((title) =>
      supabase
        .from("titles")
        .update({ display_order: title.display_order })
        .eq("id", title.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      throw new Error("Failed to reorder titles");
    }
  },
};
