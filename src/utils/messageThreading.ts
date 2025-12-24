import type { Message } from "../types";

export interface ThreadedMessage extends Message {
  replies: ThreadedMessage[];
  replyCount: number;
}

/**
 * Builds a hierarchical tree structure from a flat array of messages
 * Groups replies under their parent messages based on reply_to_id
 */
export function buildMessageTree(messages: Message[]): ThreadedMessage[] {
  // Create a map for quick lookup
  const messageMap = new Map<string, ThreadedMessage>();
  const rootMessages: ThreadedMessage[] = [];

  // First pass: create threaded message objects
  messages.forEach((msg) => {
    messageMap.set(msg.id, {
      ...msg,
      replies: [],
      replyCount: 0,
    });
  });

  // Second pass: build the tree structure
  messages.forEach((msg) => {
    const threadedMsg = messageMap.get(msg.id)!;

    if (msg.reply_to_id) {
      // This is a reply - find its parent
      const parent = messageMap.get(msg.reply_to_id);
      if (parent) {
        parent.replies.push(threadedMsg);
        parent.replyCount = parent.replies.length;
      } else {
        // Orphaned reply (parent not found) - treat as root
        rootMessages.push(threadedMsg);
      }
    } else {
      // This is a root message (no reply_to_id)
      rootMessages.push(threadedMsg);
    }
  });

  // Sort root messages by created_at
  rootMessages.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Sort replies within each message by created_at
  function sortReplies(msg: ThreadedMessage) {
    msg.replies.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    msg.replies.forEach(sortReplies);
  }

  rootMessages.forEach(sortReplies);

  return rootMessages;
}

/**
 * Counts total replies recursively (including nested replies)
 */
export function getTotalReplyCount(message: ThreadedMessage): number {
  let count = message.replies.length;
  message.replies.forEach((reply) => {
    count += getTotalReplyCount(reply);
  });
  return count;
}

/**
 * Finds a message in the tree by ID
 */
export function findMessageInTree(
  tree: ThreadedMessage[],
  messageId: string
): ThreadedMessage | null {
  for (const msg of tree) {
    if (msg.id === messageId) {
      return msg;
    }
    const found = findMessageInTree(msg.replies, messageId);
    if (found) {
      return found;
    }
  }
  return null;
}


