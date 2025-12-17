import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MemberData {
  name?: string;
  bio?: string;
  picture_url?: string;
  profile_picture_position?: { x: number; y: number };
  passions?: string[];
  phone?: string;
  email?: string;
  title_id?: string;
  type?: "regular" | "leader";
  is_admin?: boolean;
}

interface RequestPayload {
  action: "create" | "update";
  memberId?: string;
  data: MemberData;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Supabase client for authenticated user
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ||
      Deno.env.get("SUPABASE_PROJECT_URL") ||
      "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get service role client for database operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseServiceKey) {
      console.error("Missing service role key");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request payload
    const payload: RequestPayload = await req.json();

    if (!payload.action || !payload.data) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing action or data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is admin
    const { data: currentMember } = await supabaseAdmin
      .from("members")
      .select("is_admin, user_id")
      .eq("user_id", user.id)
      .single();

    const isAdmin = currentMember?.is_admin === true;

    if (payload.action === "create") {
      // Validate required fields for create
      if (!payload.data.name || !payload.data.name.trim()) {
        return new Response(
          JSON.stringify({ success: false, error: "Name is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Prepare member data
      const memberData: any = {
        name: payload.data.name.trim(),
        type: payload.data.type || "regular",
        is_admin: payload.data.is_admin || false,
      };

      if (isAdmin) {
        // Admin can create members for others
        // Set user_id only if explicitly provided, otherwise leave null (for members without auth accounts)
        if (payload.data.email) {
          memberData.email = payload.data.email;
        }

        // Check if member already exists by email (if email provided)
        if (payload.data.email) {
          const { data: existingByEmail, error: emailCheckError } =
            await supabaseAdmin
              .from("members")
              .select("id")
              .eq("email", payload.data.email)
              .maybeSingle();

          if (emailCheckError && emailCheckError.code !== "PGRST116") {
            console.error(
              "Error checking for existing member by email:",
              emailCheckError
            );
            return new Response(
              JSON.stringify({
                success: false,
                error: "Error checking for existing member",
              }),
              {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          if (existingByEmail) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Member with this email already exists",
              }),
              {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }
      } else {
        // Non-admin creating their own member record
        // Check if member already exists for this user
        const { data: existingMember, error: existingError } =
          await supabaseAdmin
            .from("members")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (existingError && existingError.code !== "PGRST116") {
          console.error("Error checking for existing member:", existingError);
          return new Response(
            JSON.stringify({
              success: false,
              error: "Error checking for existing member",
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (existingMember) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Member record already exists for this user",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Non-admin defaults to their own user_id and auth email
        memberData.user_id = user.id;
        memberData.email = user.email || null;
      }

      // Add optional fields if provided
      if (payload.data.bio !== undefined) memberData.bio = payload.data.bio;
      if (payload.data.picture_url !== undefined)
        memberData.picture_url = payload.data.picture_url;
      if (payload.data.passions !== undefined)
        memberData.passions = payload.data.passions;
      if (payload.data.phone !== undefined)
        memberData.phone = payload.data.phone;
      if (payload.data.title_id !== undefined)
        memberData.title_id = payload.data.title_id;
      if (payload.data.profile_picture_position !== undefined)
        memberData.profile_picture_position =
          payload.data.profile_picture_position;

      // For admins: if no user_id is set, leave it null (member will be linked when user signs up)
      // The email fallback in getByUserId will handle linking existing members to auth users

      // Insert member
      const { data: newMember, error: insertError } = await supabaseAdmin
        .from("members")
        .insert(memberData)
        .select()
        .single();

      if (insertError) {
        console.error("Error creating member:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to create member" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, member: newMember }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (payload.action === "update") {
      if (!payload.memberId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Member ID is required for update",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get the member to update
      const { data: memberToUpdate, error: fetchError } = await supabaseAdmin
        .from("members")
        .select("user_id, is_admin")
        .eq("id", payload.memberId)
        .single();

      if (fetchError || !memberToUpdate) {
        return new Response(
          JSON.stringify({ success: false, error: "Member not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Authorization check
      if (!isAdmin && memberToUpdate.user_id !== user.id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Unauthorized: You can only update your own member record",
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Build update data based on provided fields
      if (payload.data.name !== undefined)
        updateData.name = payload.data.name.trim();
      if (payload.data.bio !== undefined) updateData.bio = payload.data.bio;
      if (payload.data.picture_url !== undefined)
        updateData.picture_url = payload.data.picture_url;
      if (payload.data.passions !== undefined)
        updateData.passions = payload.data.passions;
      if (payload.data.phone !== undefined)
        updateData.phone = payload.data.phone;
      if (payload.data.title_id !== undefined)
        updateData.title_id = payload.data.title_id;

      // Admin-only fields (only process if user is admin)
      if (isAdmin) {
        if (payload.data.type !== undefined)
          updateData.type = payload.data.type;
        if (payload.data.is_admin !== undefined)
          updateData.is_admin = payload.data.is_admin;
        if (payload.data.email !== undefined)
          updateData.email = payload.data.email;
        if (payload.data.profile_picture_position !== undefined)
          updateData.profile_picture_position =
            payload.data.profile_picture_position;
      }

      // Update member
      const { data: updatedMember, error: updateError } = await supabaseAdmin
        .from("members")
        .update(updateData)
        .eq("id", payload.memberId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating member:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update member" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, member: updatedMember }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid action. Must be 'create' or 'update'",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in manage-member function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
