import type { MinistryJoinRequest, DepartmentRequestStatus } from "../types";
import { supabase } from "./supabase";

export const ministryJoinRequestsService = {
  async getAll(): Promise<MinistryJoinRequest[]> {
    const { data, error } = await supabase
      .from("ministry_join_requests")
      .select(
        `
        *,
        ministries (
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      ministry_name: item.ministries?.name,
    }));
  },

  async getByMinistry(
    ministryId: string
  ): Promise<MinistryJoinRequest[]> {
    const { data, error } = await supabase
      .from("ministry_join_requests")
      .select(
        `
        *,
        ministries (
          name
        )
      `
      )
      .eq("ministry_id", ministryId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      ministry_name: item.ministries?.name,
    }));
  },

  async getPending(): Promise<MinistryJoinRequest[]> {
    const { data, error } = await supabase
      .from("ministry_join_requests")
      .select(
        `
        *,
        ministries (
          name
        )
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      ministry_name: item.ministries?.name,
    }));
  },

  async create(
    request: Omit<
      MinistryJoinRequest,
      "id" | "created_at" | "updated_at" | "ministry_name" | "status"
    >
  ): Promise<MinistryJoinRequest> {
    const { data, error } = await supabase
      .from("ministry_join_requests")
      .insert({
        ...request,
        status: "pending",
      })
      .select(
        `
        *,
        ministries (
          name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      ministry_name: data.ministries?.name,
    };
  },

  async updateStatus(
    id: string,
    status: DepartmentRequestStatus,
    notes?: string
  ): Promise<MinistryJoinRequest> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from("ministry_join_requests")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        ministries (
          name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      ministry_name: data.ministries?.name,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("ministry_join_requests")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};



