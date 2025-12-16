import type { Member } from "../types";
import { supabase } from "./supabase";

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
    // Try using the database function first (if it exists)
    // This bypasses RLS restrictions while still ensuring security
    try {
      const { data, error } = await supabase.rpc("create_member_for_user", {
        p_name: member.name,
        p_type: member.type,
        p_user_id: member.user_id,
        p_is_admin: member.is_admin || false,
      });

      if (!error && data) {
        return data;
      }
    } catch {
      // RPC function might not exist yet, fall through to direct insert
      console.log("RPC function not available, using direct insert");
    }

    // Fall back to direct insert (will use updated RLS policy)
    const { data, error } = await supabase
      .from("members")
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, member: Partial<Member>): Promise<Member> {
    const { data, error } = await supabase
      .from("members")
      .update({ ...member, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
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
