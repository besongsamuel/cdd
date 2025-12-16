import type { Member } from "../types";
import { supabase } from "./supabase";

const getSupabaseUrl = (): string => {
  return import.meta.env.VITE_SUPABASE_URL || "";
};

const callEdgeFunction = async (
  action: "create" | "update",
  memberId: string | undefined,
  data: Record<string, unknown>
): Promise<Member> => {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL configuration");
  }

  // Get the session token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/manage-member`;
  const payload: any = {
    action,
    data,
  };

  if (action === "update" && memberId) {
    payload.memberId = memberId;
  }

  const response = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Operation failed");
  }

  return result.member;
};

export const membersService = {
  async getAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from("members")
      .select(
        `
        *,
        titles:title_id (
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((member: any) => ({
      ...member,
      title_name: member.titles?.name || null,
      titles: undefined, // Remove the nested object
    }));
  },

  async getLeaders(): Promise<Member[]> {
    const { data, error } = await supabase
      .from("members")
      .select(
        `
        *,
        titles:title_id (
          name
        )
      `
      )
      .eq("type", "leader")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((member: any) => ({
      ...member,
      title_name: member.titles?.name || null,
      titles: undefined, // Remove the nested object
    }));
  },

  async getRegularMembers(): Promise<Member[]> {
    const { data, error } = await supabase
      .from("members")
      .select(
        `
        *,
        titles:title_id (
          name
        )
      `
      )
      .eq("type", "regular")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((member: any) => ({
      ...member,
      title_name: member.titles?.name || null,
      titles: undefined, // Remove the nested object
    }));
  },

  async create(
    member: Omit<Member, "id" | "created_at" | "updated_at">
  ): Promise<Member> {
    // Prepare data for edge function (only allowed fields)
    const edgeFunctionData: Record<string, unknown> = {};
    
    if (member.name) edgeFunctionData.name = member.name;
    if (member.bio !== undefined) edgeFunctionData.bio = member.bio;
    if (member.picture_url !== undefined) edgeFunctionData.picture_url = member.picture_url;
    if (member.passions !== undefined) edgeFunctionData.passions = member.passions;
    if (member.phone !== undefined) edgeFunctionData.phone = member.phone;
    if (member.title_id !== undefined) edgeFunctionData.title_id = member.title_id;
    if (member.landscape_picture_url !== undefined) edgeFunctionData.landscape_picture_url = member.landscape_picture_url;

    // Note: type, is_admin, email, and user_id are automatically set by the edge function
    return callEdgeFunction("create", undefined, edgeFunctionData);
  },

  async update(id: string, member: Partial<Member>): Promise<Member> {
    // Prepare data for edge function
    const edgeFunctionData: Record<string, unknown> = {};
    
    // Allowed fields for all users
    if (member.name !== undefined) edgeFunctionData.name = member.name;
    if (member.bio !== undefined) edgeFunctionData.bio = member.bio;
    if (member.picture_url !== undefined) edgeFunctionData.picture_url = member.picture_url;
    if (member.passions !== undefined) edgeFunctionData.passions = member.passions;
    if (member.phone !== undefined) edgeFunctionData.phone = member.phone;
    if (member.title_id !== undefined) edgeFunctionData.title_id = member.title_id;
    if (member.landscape_picture_url !== undefined) edgeFunctionData.landscape_picture_url = member.landscape_picture_url;

    // Admin-only fields (edge function will validate if user is admin)
    if (member.type !== undefined) edgeFunctionData.type = member.type;
    if (member.is_admin !== undefined) edgeFunctionData.is_admin = member.is_admin;

    // Note: updated_at is automatically set by the edge function
    return callEdgeFunction("update", id, edgeFunctionData);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) throw error;
  },

  async getByUserId(userId: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw error;
    }

    if (!data) return null;

    // Fetch title name if title_id exists
    if (data.title_id) {
      const { data: titleData } = await supabase
        .from("titles")
        .select("name")
        .eq("id", data.title_id)
        .single();

      if (titleData) {
        (data as Member).title_name = titleData.name;
      }
    }

    return data as Member;
  },

  async getCurrentMember(): Promise<Member | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return this.getByUserId(user.id);
  },
};
