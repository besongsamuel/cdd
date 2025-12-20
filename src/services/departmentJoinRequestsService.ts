import type { DepartmentJoinRequest, DepartmentRequestStatus } from "../types";
import { supabase } from "./supabase";

export const departmentJoinRequestsService = {
  async getAll(): Promise<DepartmentJoinRequest[]> {
    const { data, error } = await supabase
      .from("department_join_requests")
      .select(
        `
        *,
        departments (
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      department_name: item.departments?.name,
    }));
  },

  async getByDepartment(
    departmentId: string
  ): Promise<DepartmentJoinRequest[]> {
    const { data, error } = await supabase
      .from("department_join_requests")
      .select(
        `
        *,
        departments (
          name
        )
      `
      )
      .eq("department_id", departmentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      department_name: item.departments?.name,
    }));
  },

  async getPending(): Promise<DepartmentJoinRequest[]> {
    const { data, error } = await supabase
      .from("department_join_requests")
      .select(
        `
        *,
        departments (
          name
        )
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      department_name: item.departments?.name,
    }));
  },

  async create(
    request: Omit<
      DepartmentJoinRequest,
      "id" | "created_at" | "updated_at" | "department_name" | "status"
    >
  ): Promise<DepartmentJoinRequest> {
    const { data, error } = await supabase
      .from("department_join_requests")
      .insert({
        ...request,
        status: "pending",
      })
      .select(
        `
        *,
        departments (
          name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      department_name: data.departments?.name,
    };
  },

  async updateStatus(
    id: string,
    status: DepartmentRequestStatus,
    notes?: string
  ): Promise<DepartmentJoinRequest> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from("department_join_requests")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        departments (
          name
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      department_name: data.departments?.name,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("department_join_requests")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};



