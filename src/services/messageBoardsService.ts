import type {
  BoardNotificationPreference,
  Message,
  MessageBoard,
  MessageReaction,
  MessageReport,
  MessageThread,
  Notification,
} from "../types";
import { supabase } from "./supabase";

export const messageBoardsService = {
  // Boards
  async getAll(): Promise<MessageBoard[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Use RPC function for authenticated users
      const { data, error } = await supabase.rpc("get_accessible_boards", {
        user_id: user.id,
      });

      if (error) throw error;

      // Join with members to get created_by_name
      const boardIds = (data || []).map((b: MessageBoard) => b.id);
      if (boardIds.length > 0) {
        const { data: boardsWithMembers, error: joinError } = await supabase
          .from("message_boards")
          .select(
            `
            *,
            created_by_member:created_by (
              name
            )
          `
          )
          .in("id", boardIds);

        if (joinError) throw joinError;

        return (boardsWithMembers || []).map((board: any) => ({
          ...board,
          created_by_name: board.created_by_member?.name,
        }));
      }

      return data || [];
    } else {
      // Public boards only for unauthenticated users
      const { data, error } = await supabase
        .from("message_boards")
        .select(
          `
          *,
          created_by_member:created_by (
            name
          )
        `
        )
        .eq("is_public", true)
        .is("archived_at", null)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((board: any) => ({
        ...board,
        created_by_name: board.created_by_member?.name,
      }));
    }
  },

  async getById(id: string): Promise<MessageBoard | null> {
    const { data, error } = await supabase
      .from("message_boards")
      .select(
        `
        *,
        created_by_member:created_by (
          name
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    return {
      ...data,
      created_by_name: (data as any).created_by_member?.name,
    };
  },

  async create(
    board: Omit<
      MessageBoard,
      "id" | "created_at" | "updated_at" | "created_by_name"
    >
  ): Promise<MessageBoard> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { data, error } = await supabase
      .from("message_boards")
      .insert({
        ...board,
        created_by: member.id,
      })
      .select(
        `
        *,
        created_by_member:created_by (
          name
        )
      `
      )
      .single();

    if (error) throw error;

    return {
      ...data,
      created_by_name: (data as any).created_by_member?.name,
    };
  },

  async update(
    id: string,
    board: Partial<
      Omit<MessageBoard, "id" | "created_at" | "updated_at" | "created_by_name">
    >
  ): Promise<MessageBoard> {
    const { data, error } = await supabase
      .from("message_boards")
      .update({ ...board, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(
        `
        *,
        created_by_member:created_by (
          name
        )
      `
      )
      .single();

    if (error) throw error;

    return {
      ...data,
      created_by_name: (data as any).created_by_member?.name,
    };
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from("message_boards")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  },

  // Threads
  async getThreads(boardId: string): Promise<MessageThread[]> {
    const { data, error } = await supabase
      .from("message_threads")
      .select(
        `
        *,
        created_by_member:created_by (
          name,
          picture_url
        )
      `
      )
      .eq("board_id", boardId)
      .is("archived_at", null)
      .order("is_pinned", { ascending: false })
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((thread: any) => ({
      ...thread,
      created_by_name: thread.created_by_member?.name,
      created_by_picture_url: thread.created_by_member?.picture_url,
    }));
  },

  async getThreadById(threadId: string): Promise<MessageThread | null> {
    const { data, error } = await supabase
      .from("message_threads")
      .select(
        `
        *,
        created_by_member:created_by (
          name,
          picture_url
        )
      `
      )
      .eq("id", threadId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    return {
      ...data,
      created_by_name: (data as any).created_by_member?.name,
      created_by_picture_url: (data as any).created_by_member?.picture_url,
    };
  },

  async createThread(
    boardId: string,
    title: string,
    content: string
  ): Promise<{ thread: MessageThread; message: Message }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    // Use RPC function to atomically create thread and message
    const { data, error } = await supabase.rpc("create_thread_with_message", {
      p_board_id: boardId,
      p_title: title,
      p_content: content,
      p_author_id: member.id,
    });

    if (error) throw error;

    const { thread_id, message_id } = data[0];

    // Fetch the created thread and message
    const [thread, message] = await Promise.all([
      this.getThreadById(thread_id),
      this.getMessageById(message_id),
    ]);

    if (!thread || !message) throw new Error("Failed to create thread");

    return { thread, message };
  },

  async lockThread(threadId: string, locked: boolean): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { error } = await supabase.rpc("toggle_thread_lock", {
      p_thread_id: threadId,
      p_locked: locked,
      p_moderator_id: member.id,
    });

    if (error) throw error;
  },

  async pinThread(threadId: string, pinned: boolean): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { error } = await supabase.rpc("toggle_thread_pin", {
      p_thread_id: threadId,
      p_pinned: pinned,
      p_moderator_id: member.id,
    });

    if (error) throw error;
  },

  // Messages
  async getMessages(threadId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        author:author_id (
          name,
          picture_url
        ),
        reply_to:reply_to_id (
          id,
          content,
          author_id,
          author:author_id (
            name
          )
        )
      `
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Get reactions for all messages
    const messageIds = (data || []).map((m: Message) => m.id);
    let reactions: MessageReaction[] = [];

    if (messageIds.length > 0) {
      const { data: reactionsData, error: reactionsError } = await supabase
        .from("message_reactions")
        .select(
          `
          *,
          member:member_id (
            name
          )
        `
        )
        .in("message_id", messageIds);

      if (!reactionsError && reactionsData) {
        reactions = reactionsData.map((r: any) => ({
          ...r,
          member_name: r.member?.name,
        }));
      }
    }

    // Group reactions by message_id
    const reactionsByMessage = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = [];
        }
        acc[reaction.message_id].push(reaction);
        return acc;
      },
      {} as Record<string, MessageReaction[]>
    );

    return (data || []).map((message: any) => ({
      ...message,
      author_name: message.author?.name,
      author_picture_url: message.author?.picture_url,
      reply_to: message.reply_to
        ? {
            ...message.reply_to,
            author_name: message.reply_to.author?.name,
          }
        : undefined,
      reactions: reactionsByMessage[message.id] || [],
    }));
  },

  async getMessageById(messageId: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        author:author_id (
          name,
          picture_url
        )
      `
      )
      .eq("id", messageId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    return {
      ...data,
      author_name: (data as any).author?.name,
      author_picture_url: (data as any).author?.picture_url,
    };
  },

  async createMessage(
    threadId: string,
    content: string,
    replyToId?: string
  ): Promise<Message> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        thread_id: threadId,
        author_id: member.id,
        content,
        content_html: content, // Will be rendered on frontend
        reply_to_id: replyToId,
      })
      .select(
        `
        *,
        author:author_id (
          name,
          picture_url
        )
      `
      )
      .single();

    if (error) throw error;

    return {
      ...data,
      author_name: (data as any).author?.name,
      author_picture_url: (data as any).author?.picture_url,
    };
  },

  async updateMessage(messageId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .update({
        content,
        content_html: content,
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select(
        `
        *,
        author:author_id (
          name,
          picture_url
        )
      `
      )
      .single();

    if (error) throw error;

    return {
      ...data,
      author_name: (data as any).author?.name,
      author_picture_url: (data as any).author?.picture_url,
    };
  },

  async deleteMessage(messageId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { error } = await supabase.rpc("soft_delete_message", {
      p_message_id: messageId,
      p_deleted_by: member.id,
    });

    if (error) throw error;
  },

  // Reactions
  async addReaction(
    messageId: string,
    reactionType: "like" | "love" | "prayer" | "check"
  ): Promise<MessageReaction> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { data, error } = await supabase
      .from("message_reactions")
      .insert({
        message_id: messageId,
        member_id: member.id,
        reaction_type: reactionType,
      })
      .select(
        `
        *,
        member:member_id (
          name
        )
      `
      )
      .single();

    if (error) throw error;

    return {
      ...data,
      member_name: (data as any).member?.name,
    };
  },

  async removeReaction(messageId: string, reactionType: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { error } = await supabase
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("member_id", member.id)
      .eq("reaction_type", reactionType);

    if (error) throw error;
  },

  // Reports
  async createReport(
    messageId: string,
    reason: string
  ): Promise<MessageReport> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { data, error } = await supabase
      .from("message_reports")
      .insert({
        message_id: messageId,
        reported_by: member.id,
        reason,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { data, error } = await supabase
      .from("notifications")
      .select(
        `
        *,
        board:board_id (
          name
        ),
        thread:thread_id (
          title
        ),
        message:message_id (
          content
        )
      `
      )
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []).map((notif: any) => ({
      ...notif,
      board_name: notif.board?.name,
      thread_title: notif.thread?.title,
      message_preview: notif.message?.content?.substring(0, 100),
    }));
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
  },

  async markAllNotificationsRead(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("member_id", member.id)
      .eq("is_read", false);

    if (error) throw error;
  },

  // Notification Preferences
  async getNotificationPreferences(
    boardId: string
  ): Promise<BoardNotificationPreference | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { data, error } = await supabase
      .from("board_notification_preferences")
      .select("*")
      .eq("member_id", member.id)
      .eq("board_id", boardId)
      .maybeSingle();

    if (error) throw error;

    return data;
  },

  async updateNotificationPreferences(
    boardId: string,
    preferences: {
      email_notifications?: boolean;
      in_app_notifications?: boolean;
    }
  ): Promise<BoardNotificationPreference> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { data, error } = await supabase
      .from("board_notification_preferences")
      .upsert(
        {
          member_id: member.id,
          board_id: boardId,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "member_id,board_id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  // Message Views
  async markThreadAsSeen(threadId: string): Promise<number> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { data, error } = await supabase.rpc("mark_thread_as_seen", {
      p_thread_id: threadId,
      p_member_id: member.id,
    });

    if (error) throw error;

    return data || 0;
  },

  async getUnseenMessageCount(threadId?: string): Promise<number> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    // Get member_id
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!member) throw new Error("Member not found");

    const { data, error } = await supabase.rpc("get_unseen_message_count", {
      p_member_id: member.id,
      p_thread_id: threadId || null,
    });

    if (error) throw error;

    return data || 0;
  },
};

