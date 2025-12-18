import type { Member } from "../types";
import { supabase } from "./supabase";

interface EdgeFunctionPayload {
  action: "create" | "update";
  data: Record<string, unknown>;
  memberId?: string;
}

interface MemberWithTitle extends Omit<Member, "title_name"> {
  titles?: {
    name: string;
  } | null;
}

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
  const payload: EdgeFunctionPayload = {
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
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
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
    return (data || []).map((member: MemberWithTitle) => {
      const { titles, ...rest } = member;
      return {
        ...rest,
        title_name: titles?.name || undefined,
      };
    });
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
    return (data || []).map((member: MemberWithTitle) => {
      const { titles, ...rest } = member;
      return {
        ...rest,
        title_name: titles?.name || undefined,
      };
    });
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
    return (data || []).map((member: MemberWithTitle) => {
      const { titles, ...rest } = member;
      return {
        ...rest,
        title_name: titles?.name || undefined,
      };
    });
  },

  async create(
    member: Omit<Member, "id" | "created_at" | "updated_at">
  ): Promise<Member> {
    // Prepare data for edge function (only allowed fields)
    const edgeFunctionData: Record<string, unknown> = {};

    if (member.name) edgeFunctionData.name = member.name;
    if (member.bio !== undefined) edgeFunctionData.bio = member.bio;
    if (member.picture_url !== undefined)
      edgeFunctionData.picture_url = member.picture_url;
    if (member.passions !== undefined)
      edgeFunctionData.passions = member.passions;
    if (member.phone !== undefined) edgeFunctionData.phone = member.phone;
    if (member.title_id !== undefined)
      edgeFunctionData.title_id = member.title_id;

    // Note: type, is_admin, email, and user_id are automatically set by the edge function
    return callEdgeFunction("create", undefined, edgeFunctionData);
  },

  async update(id: string, member: Partial<Member>): Promise<Member> {
    // Prepare data for edge function
    const edgeFunctionData: Record<string, unknown> = {};

    // Allowed fields for all users
    if (member.name !== undefined) edgeFunctionData.name = member.name;
    if (member.bio !== undefined) edgeFunctionData.bio = member.bio;
    if (member.picture_url !== undefined)
      edgeFunctionData.picture_url = member.picture_url;
    if (member.passions !== undefined)
      edgeFunctionData.passions = member.passions;
    if (member.phone !== undefined) edgeFunctionData.phone = member.phone;
    if (member.title_id !== undefined)
      edgeFunctionData.title_id = member.title_id;

    // Admin-only fields (edge function will validate if user is admin)
    if (member.type !== undefined) edgeFunctionData.type = member.type;
    if (member.is_admin !== undefined)
      edgeFunctionData.is_admin = member.is_admin;
    if (member.email !== undefined) edgeFunctionData.email = member.email;
    if (member.profile_picture_position !== undefined)
      edgeFunctionData.profile_picture_position =
        member.profile_picture_position;

    // Note: updated_at is automatically set by the edge function
    return callEdgeFunction("update", id, edgeFunctionData);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) throw error;
  },

  async getByUserId(userId: string): Promise<Member | null> {
    // First, try to find by user_id
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    let member = data;

    // If not found by user_id, try email fallback
    if (!member) {
      // Get the user's email from auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const { data: emailData, error: emailError } = await supabase
          .from("members")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();

        if (emailError && emailError.code !== "PGRST116") {
          throw emailError;
        }

        member = emailData;

        // If found by email, update the user_id to link them
        if (member) {
          await supabase
            .from("members")
            .update({ user_id: userId })
            .eq("id", member.id);
          member.user_id = userId;
        }
      }
    }

    if (!member) return null;

    // Fetch title name if title_id exists
    if (member.title_id) {
      const { data: titleData } = await supabase
        .from("titles")
        .select("name")
        .eq("id", member.title_id)
        .single();

      if (titleData) {
        (member as Member).title_name = titleData.name;
      }
    }

    return member as Member;
  },

  async getCurrentMember(): Promise<Member | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return this.getByUserId(user.id);
  },
};
