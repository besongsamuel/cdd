import type { Member } from "../types";
import { supabase } from "./supabase";

export const profileService = {
  async uploadProfilePicture(file: File, memberId: string): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `profile-${memberId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("member-photos")
      .getPublicUrl(fileName);
    return data.publicUrl;
  },

  async uploadLandscapePicture(file: File, memberId: string): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `landscape-${memberId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("member-photos")
      .getPublicUrl(fileName);
    return data.publicUrl;
  },

  async updateProfile(
    memberId: string,
    data: Partial<Member>
  ): Promise<Member> {
    const { data: member, error } = await supabase
      .from("members")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", memberId)
      .select()
      .single();

    if (error) throw error;
    return member;
  },
};
