import type { FinancialYear } from "../types";
import { supabase } from "./supabase";

export const financialTransparencyService = {
  async getActive(): Promise<FinancialYear | null> {
    const { data, error } = await supabase
      .from("financial_years")
      .select("*")
      .eq("is_active", true)
      .order("year", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no active year found, return null (will use defaults)
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data;
  },

  async getByYear(year: number): Promise<FinancialYear | null> {
    const { data, error } = await supabase
      .from("financial_years")
      .select("*")
      .eq("year", year)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data;
  },

  async getAll(): Promise<FinancialYear[]> {
    const { data, error } = await supabase
      .from("financial_years")
      .select("*")
      .order("year", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(
    financialYear: Omit<FinancialYear, "id" | "created_at" | "updated_at">
  ): Promise<FinancialYear> {
    const { data, error } = await supabase
      .from("financial_years")
      .insert(financialYear)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    id: string,
    financialYear: Partial<
      Omit<FinancialYear, "id" | "created_at" | "updated_at">
    >
  ): Promise<FinancialYear> {
    const { data, error } = await supabase
      .from("financial_years")
      .update({ ...financialYear, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};




