import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessPayload {
  offset?: number;
  iteration?: number;
  startTime?: number;
}

interface BoardActivity {
  board_id: string;
  board_name: string;
  message_count: number;
  reply_count: number;
  thread_count: number;
}

interface UserSummary {
  member_id: string;
  member_name: string;
  member_email: string;
  boards: BoardActivity[];
}

const BATCH_SIZE = 10;
const MAX_ITERATIONS = 100;
const MAX_EXECUTION_TIME_MS = 5 * 60 * 1000; // 5 minutes

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    // Get Supabase configuration
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ||
      Deno.env.get("SUPABASE_PROJECT_URL") ||
      "";
    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse payload
    let payload: ProcessPayload = {};
    try {
      if (req.method === "POST") {
        const body = await req.json();
        payload = body || {};
      }
    } catch {
      // Empty body is fine, use defaults
    }

    const offset = payload.offset || 0;
    const iteration = payload.iteration || 0;
    const startTime = payload.startTime || Date.now();

    // Check exit criteria
    if (iteration >= MAX_ITERATIONS) {
      console.log(
        `Reached max iterations (${MAX_ITERATIONS}). Stopping.`
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: "Reached max iterations",
          processed: offset,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= MAX_EXECUTION_TIME_MS) {
      console.log(
        `Reached max execution time (${MAX_EXECUTION_TIME_MS}ms). Stopping.`
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: "Reached max execution time",
          processed: offset,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Query active users (members with user_id) in batches
    const { data: users, error: usersError } = await supabase
      .from("members")
      .select("id, name, email, user_id")
      .not("user_id", "is", null)
      .not("email", "is", null)
      .order("id")
      .range(offset, offset + BATCH_SIZE - 1);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log("No more users to process. Stopping.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "All users processed",
          processed: offset,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `Processing batch: offset=${offset}, iteration=${iteration}, users=${users.length}`
    );

    // Process each user
    for (const user of users) {
      try {
        // Skip users without user_id (shouldn't happen due to query filter, but safety check)
        if (!user.user_id || !user.email) {
          console.log(`Skipping user ${user.id}: missing user_id or email`);
          continue;
        }

        const memberId = user.id;
        const userSummary = await processUser(
          supabase,
          memberId,
          user.user_id,
          user.name || "Member",
          user.email
        );

        // If user has activity, send email
        if (userSummary.boards.length > 0) {
          await sendSummaryEmail(supabase, userSummary);
          // Update notification timestamps
          await updateNotificationTimestamps(
            supabase,
            memberId,
            userSummary.boards
          );
        }
      } catch (error) {
        console.error(
          `Error processing user ${user.id}:`,
          error instanceof Error ? error.message : String(error)
        );
        // Continue with next user
      }
    }

    // Check if there are more users
    const hasMore = users.length === BATCH_SIZE;

    if (hasMore) {
      // Recursively call self
      const nextOffset = offset + BATCH_SIZE;
      const nextIteration = iteration + 1;

      console.log(
        `Recursively calling self: offset=${nextOffset}, iteration=${nextIteration}`
      );

      // Call edge function recursively
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-board-summaries`;
      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          offset: nextOffset,
          iteration: nextIteration,
          startTime: startTime,
        }),
      });

      const result = await response.json();
      return new Response(
        JSON.stringify({
          success: true,
          message: "Batch processed, continuing",
          processed: offset + users.length,
          nextBatch: result,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "All users processed",
        processed: offset + users.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-board-summaries:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Deno-specific: Using any for Supabase client - type is complex and not easily imported in Deno edge functions
 
async function processUser(
  supabase: any,
  memberId: string,
  userId: string,
  memberName: string,
  memberEmail: string
): Promise<UserSummary> {
  // Get all boards
  const { data: allBoards, error: boardsError } = await supabase
    .from("message_boards")
    .select("id, name")
    .is("archived_at", null);

  if (boardsError) {
    throw boardsError;
  }

  if (!allBoards || allBoards.length === 0) {
    return {
      member_id: memberId,
      member_name: memberName,
      member_email: memberEmail,
      boards: [],
    };
  }

  const boardsWithActivity: BoardActivity[] = [];

  // Check each board for access and activity
  for (const board of allBoards) {
    try {
      // Check if user has access to this board
      const { data: hasAccess, error: accessError } = await supabase.rpc(
        "check_board_access",
        {
          board_id: board.id,
          user_id: userId,
        }
      );

      if (accessError || !hasAccess) {
        continue; // Skip boards user doesn't have access to
      }

      // Get last notification time for this user/board
      const { data: lastNotification } = await supabase
        .from("board_summary_notifications")
        .select("last_notified_at")
        .eq("member_id", memberId)
        .eq("board_id", board.id)
        .single();

      const lastNotificationTime = lastNotification?.last_notified_at
        ? new Date(lastNotification.last_notified_at)
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago if no previous notification

      // Calculate activity window (last 24h from now, or since last notification if more recent)
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const activityStartTime =
        lastNotificationTime > twentyFourHoursAgo
          ? lastNotificationTime
          : twentyFourHoursAgo;

      // Get thread IDs and created_at for this board
      const { data: threadsData, error: threadsError } = await supabase
        .from("message_threads")
        .select("id, created_at")
        .eq("board_id", board.id)
        .is("archived_at", null);

      if (threadsError || !threadsData || threadsData.length === 0) {
        continue;
      }

      const threadIdList = threadsData.map((t: { id: string }) => t.id);

      // Count new messages in last 24h
      const { count: messageCount, error: messagesError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("thread_id", threadIdList)
        .eq("is_deleted", false)
        .gt("created_at", activityStartTime.toISOString());

      if (messagesError) {
        console.error(
          `Error counting messages for board ${board.id}:`,
          messagesError
        );
        continue;
      }

      // Count new replies (messages with reply_to_id)
      const { count: replyCount, error: repliesError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .not("reply_to_id", "is", null)
        .in("thread_id", threadIdList)
        .eq("is_deleted", false)
        .gt("created_at", activityStartTime.toISOString());

      if (repliesError) {
        console.error(
          `Error counting replies for board ${board.id}:`,
          repliesError
        );
        continue;
      }

      // Count new threads
      const threadCount = threadsData.filter(
        (t: { id: string; created_at: string | null }) =>
          new Date(t.created_at || 0) > activityStartTime
      ).length;

      // Only include board if there's activity
      if (
        (messageCount && messageCount > 0) ||
        (replyCount && replyCount > 0) ||
        (threadCount && threadCount > 0)
      ) {
        boardsWithActivity.push({
          board_id: board.id,
          board_name: board.name,
          message_count: messageCount || 0,
          reply_count: replyCount || 0,
          thread_count: threadCount || 0,
        });
      }
    } catch (error) {
      console.error(
        `Error processing board ${board.id} for user ${memberId}:`,
        error
      );
      // Continue with next board
    }
  }

  return {
    member_id: memberId,
    member_name: memberName,
    member_email: memberEmail,
    boards: boardsWithActivity,
  };
}

async function sendSummaryEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _supabase: any, // NOSONAR
  summary: UserSummary
): Promise<void> {
  // Helper function to generate board HTML - beautiful design with optimized character count
  // Must be under 2000 chars to meet Resend's limit
  const generateBoardHtml = (board: BoardActivity) => {
    // Truncate board name if too long (max 30 chars to save space)
    const boardName = board.board_name.length > 30 ? board.board_name.substring(0, 27) + '...' : board.board_name;
    // Ultra-compact but beautiful design - removed role="presentation", shortened styles, reduced padding
    return `<table style="width:100%;margin-bottom:16px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.1)"><tr><td style="padding:16px;background:linear-gradient(135deg,#667eea,#764ba2)"><h3 style="margin:0;color:#fff;font-size:16px;font-weight:700">📋 ${boardName}</h3></td></tr><tr><td style="padding:16px"><table style="width:100%"><tr><td style="padding:0;width:33%"><table style="width:100%;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:6px;border:2px solid #bfdbfe"><tr><td style="padding:12px 10px;text-align:center"><div style="color:#1e40af;font-size:24px;font-weight:800;margin-bottom:2px">${board.message_count}</div><div style="color:#3b82f6;font-size:10px;font-weight:600;text-transform:uppercase">💬 Msgs</div></td></tr></table></td><td style="width:10px"></td><td style="padding:0;width:33%"><table style="width:100%;background:linear-gradient(135deg,#fef2f2,#fee2e2);border-radius:6px;border:2px solid #fecaca"><tr><td style="padding:12px 10px;text-align:center"><div style="color:#dc2626;font-size:24px;font-weight:800;margin-bottom:2px">${board.reply_count}</div><div style="color:#ef4444;font-size:10px;font-weight:600;text-transform:uppercase">↩️ Replies</div></td></tr></table></td><td style="width:10px"></td><td style="padding:0;width:33%"><table style="width:100%;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:6px;border:2px solid #bbf7d0"><tr><td style="padding:12px 10px;text-align:center"><div style="color:#16a34a;font-size:24px;font-weight:800;margin-bottom:2px">${board.thread_count}</div><div style="color:#22c55e;font-size:10px;font-weight:600;text-transform:uppercase">✨ Threads</div></td></tr></table></td></tr></table></td></tr></table>`;
  };
  
  // Generate HTML for each board and split into separate variables
  // Support up to 10 boards (each ~750 chars, well under 2000 limit)
  const MAX_BOARDS = 10;
  const includedBoards = summary.boards.slice(0, MAX_BOARDS);
  
  // Build event data with separate variables for each board
  const eventData: Record<string, string> = {
    member_id: summary.member_id,
    member_name: summary.member_name,
    view_url: `${Deno.env.get("FRONTEND_URL") || "https://eglisecitededavid.com"}/message-boards`,
    // Include deprecated BOARDS_SUMMARY_HTML as empty string to satisfy Resend's requirement
    // This variable exists in the template but is no longer used (we use BOARD_SUMMARY_1-10 instead)
    boards_summary_html: '',
  };
  
  // Generate HTML for each board and assign to separate variables
  // Always provide all 10 variables (empty string if no board) to satisfy Resend's requirement
  for (let i = 0; i < MAX_BOARDS; i++) {
    if (i < includedBoards.length) {
      const board = includedBoards[i];
      const boardHtml = generateBoardHtml(board);
      eventData[`board_summary_${i + 1}`] = boardHtml;
      console.log(`Generated board_summary_${i + 1} HTML length: ${boardHtml.length} chars`);
    } else {
      // Provide empty string for unused board slots
      eventData[`board_summary_${i + 1}`] = '';
    }
  }
  
  if (summary.boards.length > MAX_BOARDS) {
    console.warn(
      `Too many boards (${summary.boards.length}), including only first ${MAX_BOARDS} boards`
    );
  }
  
  console.log(`Generated ${includedBoards.length} board summaries for email`);

  // Call send-email edge function
  const supabaseUrl =
    Deno.env.get("SUPABASE_URL") ||
    Deno.env.get("SUPABASE_PROJECT_URL") ||
    "";
  const supabaseServiceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-email`;

  const emailPayload = {
    eventType: "board-summary",
    eventData,
  };

  const response = await fetch(emailFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to send email: ${response.status} ${errorText}`
    );
  }
}

// Deno-specific: Using any for Supabase client - type is complex and not easily imported in Deno edge functions
 
async function updateNotificationTimestamps(
  supabase: any, // NOSONAR
  memberId: string,
  boards: BoardActivity[]
): Promise<void> {
  const now = new Date().toISOString();

  for (const board of boards) {
    await supabase.from("board_summary_notifications").upsert(
      {
        member_id: memberId,
        board_id: board.board_id,
        last_notified_at: now,
        updated_at: now,
      },
      {
        onConflict: "member_id,board_id",
      }
    );
  }
}

