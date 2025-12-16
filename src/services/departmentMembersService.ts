import type { DepartmentMember } from "../types";
import { supabase } from "./supabase";

export const departmentMembersService = {
  async getByDepartment(departmentId: string): Promise<DepartmentMember[]> {
    const { data, error } = await supabase
      .from("department_members")
      .select(
        `
        *,
        members (
          name,
          picture_url,
          email,
          phone
        )
      `
      )
      .eq("department_id", departmentId)
      .order("is_lead", { ascending: false })
      .order("joined_at", { ascending: true });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      member_name: item.members?.name,
      member_picture_url: item.members?.picture_url,
      member_email: item.members?.email,
      member_phone: item.members?.phone,
    }));
  },

  async addMember(
    departmentId: string,
    memberId: string,
    isLead: boolean = false
  ): Promise<DepartmentMember> {
    const { data, error } = await supabase
      .from("department_members")
      .insert({
        department_id: departmentId,
        member_id: memberId,
        is_lead: isLead,
      })
      .select(
        `
        *,
        members (
          name,
          picture_url,
          email,
          phone
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      member_name: data.members?.name,
      member_picture_url: data.members?.picture_url,
      member_email: data.members?.email,
      member_phone: data.members?.phone,
    };
  },

  async removeMember(departmentId: string, memberId: string): Promise<void> {
    const { error } = await supabase
      .from("department_members")
      .delete()
      .eq("department_id", departmentId)
      .eq("member_id", memberId);

    if (error) throw error;
  },

  async setLead(
    departmentId: string,
    memberId: string,
    isLead: boolean
  ): Promise<DepartmentMember> {
    const { data, error } = await supabase
      .from("department_members")
      .update({ is_lead: isLead })
      .eq("department_id", departmentId)
      .eq("member_id", memberId)
      .select(
        `
        *,
        members (
          name,
          picture_url,
          email,
          phone
        )
      `
      )
      .single();

    if (error) throw error;
    return {
      ...data,
      member_name: data.members?.name,
      member_picture_url: data.members?.picture_url,
      member_email: data.members?.email,
      member_phone: data.members?.phone,
    };
  },
};


