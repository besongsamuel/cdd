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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  _supabase: any, // NOSONAR
  summary: UserSummary
): Promise<void> {
  // Build boards summary HTML - optimized to minimize character count
  // Resend has a 2000 character limit per template variable
  const MAX_HTML_LENGTH = 1900; // Leave buffer for safety
  
  // Helper function to generate board HTML
  const generateBoardHtml = (board: BoardActivity) => `<table role="presentation" style="width:100%;margin-bottom:28px;border-collapse:separate;border-spacing:0;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.08)"><tr><td style="padding:24px 24px 20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)"><h3 style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-.3px">📋 ${board.board_name}</h3></td></tr><tr><td style="padding:24px"><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:0;width:33.33%"><table role="presentation" style="width:100%;border-collapse:collapse;background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-radius:10px;border:2px solid #bfdbfe"><tr><td style="padding:18px 16px;text-align:center"><div style="color:#1e40af;font-size:32px;font-weight:800;margin-bottom:6px;line-height:1.2">${board.message_count}</div><div style="color:#3b82f6;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;margin-top:4px">💬 Messages</div></td></tr></table></td><td style="width:16px;padding:0"></td><td style="padding:0;width:33.33%"><table role="presentation" style="width:100%;border-collapse:collapse;background:linear-gradient(135deg,#fef2f2 0%,#fee2e2 100%);border-radius:10px;border:2px solid #fecaca"><tr><td style="padding:18px 16px;text-align:center"><div style="color:#dc2626;font-size:32px;font-weight:800;margin-bottom:6px;line-height:1.2">${board.reply_count}</div><div style="color:#ef4444;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;margin-top:4px">↩️ Replies</div></td></tr></table></td><td style="width:16px;padding:0"></td><td style="padding:0;width:33.33%"><table role="presentation" style="width:100%;border-collapse:collapse;background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-radius:10px;border:2px solid #bbf7d0"><tr><td style="padding:18px 16px;text-align:center"><div style="color:#16a34a;font-size:32px;font-weight:800;margin-bottom:6px;line-height:1.2">${board.thread_count}</div><div style="color:#22c55e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;margin-top:4px">✨ New Threads</div></td></tr></table></td></tr></table></td></tr></table>`;
  
  // Build HTML only for boards that fit within the limit
  let accumulatedLength = 0;
  const includedBoards: BoardActivity[] = [];
  
  for (const board of summary.boards) {
    const boardHtml = generateBoardHtml(board);
    // Check if adding this board would exceed limit (account for joining)
    const newLength = accumulatedLength + (accumulatedLength > 0 ? 0 : 0) + boardHtml.length;
    if (newLength > MAX_HTML_LENGTH && accumulatedLength > 0) {
      // Don't add this board if we already have some boards
      break;
    }
    // Always include at least one board, even if it slightly exceeds limit
    if (includedBoards.length === 0 || newLength <= MAX_HTML_LENGTH) {
      includedBoards.push(board);
      accumulatedLength = newLength;
    } else {
      break;
    }
  }
  
  // Ensure we always have at least one board if there are any boards
  if (includedBoards.length === 0 && summary.boards.length > 0) {
    includedBoards.push(summary.boards[0]);
    console.warn(`First board HTML too long (${generateBoardHtml(summary.boards[0]).length} chars), including anyway`);
  }
  
  const boardsSummaryHtml = includedBoards.map(generateBoardHtml).join("");
  
  if (summary.boards.length > includedBoards.length) {
    console.warn(
      `HTML too long, including only ${includedBoards.length} of ${summary.boards.length} boards (${accumulatedLength} chars)`
    );
  }
  
  // Ensure we have HTML content - if empty, add a fallback message
  const finalBoardsSummaryHtml = boardsSummaryHtml || '<p style="color:#666;font-size:14px;padding:20px;text-align:center">No board activity to display.</p>';
  
  console.log(`Generated boards summary HTML length: ${finalBoardsSummaryHtml.length}, boards included: ${includedBoards.length}`);

  // Get frontend URL from environment or use default
  const frontendUrl =
    Deno.env.get("FRONTEND_URL") || "https://eglisecitededavid.com";
  const viewUrl = `${frontendUrl}/message-boards`;

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
    eventData: {
      member_id: summary.member_id,
      member_name: summary.member_name,
      boards_summary_html: finalBoardsSummaryHtml,
      view_url: viewUrl,
      boards: includedBoards.map((b) => ({
        board_name: b.board_name,
        message_count: b.message_count,
        reply_count: b.reply_count,
        thread_count: b.thread_count,
      })),
    },
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

