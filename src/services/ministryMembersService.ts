import type { MinistryMember } from "../types";
import { supabase } from "./supabase";

export const ministryMembersService = {
  async getByMinistry(ministryId: string): Promise<MinistryMember[]> {
    const { data, error } = await supabase
      .from("ministry_members")
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
      .eq("ministry_id", ministryId)
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
    ministryId: string,
    memberId: string,
    isLead: boolean = false
  ): Promise<MinistryMember> {
    const { data, error } = await supabase
      .from("ministry_members")
      .insert({
        ministry_id: ministryId,
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

  async removeMember(ministryId: string, memberId: string): Promise<void> {
    const { error } = await supabase
      .from("ministry_members")
      .delete()
      .eq("ministry_id", ministryId)
      .eq("member_id", memberId);

    if (error) throw error;
  },

  async setLead(
    ministryId: string,
    memberId: string,
    isLead: boolean
  ): Promise<MinistryMember> {
    const { data, error } = await supabase
      .from("ministry_members")
      .update({ is_lead: isLead })
      .eq("ministry_id", ministryId)
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




