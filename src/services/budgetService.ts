import type { YearlyBudget } from "../types";
import { supabase } from "./supabase";

export const budgetService = {
  async getByYear(year: number): Promise<YearlyBudget[]> {
    const { data, error } = await supabase
      .from("yearly_budgets")
      .select(
        `
        *,
        donation_categories (
          name
        )
      `
      )
      .eq("year", year)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      category_name: item.donation_categories?.name,
    }));
  },

  async getByCategory(categoryId: string): Promise<YearlyBudget[]> {
    const { data, error } = await supabase
      .from("yearly_budgets")
      .select("*")
      .eq("category_id", categoryId)
      .order("year", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAll(): Promise<YearlyBudget[]> {
    const { data, error } = await supabase
      .from("yearly_budgets")
      .select(
        `
        *,
        donation_categories (
          name
        )
      `
      )
      .order("year", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      category_name: item.donation_categories?.name,
    }));
  },

  async create(
    budget: Omit<
      YearlyBudget,
      "id" | "created_at" | "updated_at" | "category_name"
    >
  ): Promise<YearlyBudget> {
    const { data, error } = await supabase
      .from("yearly_budgets")
      .insert(budget)
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

  async update(
    id: string,
    budget: Partial<YearlyBudget>
  ): Promise<YearlyBudget> {
    const { data, error } = await supabase
      .from("yearly_budgets")
      .update({ ...budget, updated_at: new Date().toISOString() })
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
    const { error } = await supabase
      .from("yearly_budgets")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};




