import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PinIcon from "@mui/icons-material/PushPin";
import ReplyIcon from "@mui/icons-material/Reply";
import ReportIcon from "@mui/icons-material/Report";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { messageBoardsService } from "../services/messageBoardsService";
import type { Message, MessageThread } from "../types";

export const ThreadDetailPage = () => {
  const { boardId, threadId } = useParams<{
    boardId: string;
    threadId: string;
  }>();
  const { user, currentMember } = useAuth();
  const navigate = useNavigate();
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState("");
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<{
    element: HTMLElement;
    message: Message;
  } | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    if (!threadId) return;

    const loadData = async () => {
      try {
        const [threadData, messagesData] = await Promise.all([
          messageBoardsService.getThreadById(threadId),
          messageBoardsService.getMessages(threadId),
        ]);

        setThread(threadData);
        setMessages(messagesData);
      } catch (error) {
        console.error("Error loading thread:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [threadId]);

  const handleSendMessage = async () => {
    if (!threadId || !newMessage.trim()) return;

    setSubmitting(true);
    try {
      const message = await messageBoardsService.createMessage(
        threadId,
        newMessage.trim(),
        replyingTo?.id
      );

      setMessages([...messages, message]);
      setNewMessage("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      const updated = await messageBoardsService.updateMessage(
        editingMessage.id,
        editContent.trim()
      );

      setMessages(messages.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMessage(null);
      setEditContent("");
    } catch (error) {
      console.error("Error updating message:", error);
      alert("Failed to update message. Please try again.");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await messageBoardsService.deleteMessage(messageId);
      setMessages(messages.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message. Please try again.");
    }
  };

  const handleReportMessage = async () => {
    if (!messageMenuAnchor || !reportReason.trim()) return;

    try {
      await messageBoardsService.createReport(
        messageMenuAnchor.message.id,
        reportReason.trim()
      );

      setReportDialogOpen(false);
      setReportReason("");
      setMessageMenuAnchor(null);
      alert("Message reported. Thank you for helping keep our community safe.");
    } catch (error) {
      console.error("Error reporting message:", error);
      alert("Failed to report message. Please try again.");
    }
  };

  const handleReaction = async (
    messageId: string,
    reactionType: "like" | "love" | "prayer" | "check"
  ) => {
    try {
      const message = messages.find((m) => m.id === messageId);
      const existingReaction = message?.reactions?.find(
        (r) =>
          r.reaction_type === reactionType && r.member_id === currentMember?.id
      );

      if (existingReaction) {
        await messageBoardsService.removeReaction(messageId, reactionType);
        setMessages(
          messages.map((m) => {
            if (m.id === messageId) {
              return {
                ...m,
                reactions: m.reactions?.filter(
                  (r) =>
                    !(
                      r.reaction_type === reactionType &&
                      r.member_id === currentMember?.id
                    )
                ),
              };
            }
            return m;
          })
        );
      } else {
        await messageBoardsService.addReaction(messageId, reactionType);
        // Reload messages to get updated reactions
        const updated = await messageBoardsService.getMessages(threadId!);
        setMessages(updated);
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!thread) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Thread not found
        </Typography>
      </Container>
    );
  }

  const canPost = user && !thread.is_locked;
  const isAuthor = (message: Message) =>
    currentMember && message.author_id === currentMember.id;

  return (
    <>
      <SEO title={thread.title} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            {thread.is_pinned && <PinIcon color="primary" />}
            {thread.is_locked && <LockIcon color="action" />}
            <Typography variant="h4" component="h1">
              {thread.title}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            {thread.created_by_name && (
              <Typography variant="body2" color="text.secondary">
                Started by {thread.created_by_name}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {thread.message_count} message
              {thread.message_count !== 1 ? "s" : ""}
            </Typography>
          </Box>

          {thread.is_locked && (
            <Alert severity="info">
              This thread is locked. No new replies can be posted.
            </Alert>
          )}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
          {messages.map((message) => (
            <Card key={message.id}>
              <CardContent>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Avatar
                    src={message.author_picture_url}
                    alt={message.author_name}
                  >
                    {message.author_name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {message.author_name || "Anonymous"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(message.created_at).toLocaleString()}
                          {message.edited_at && " (edited)"}
                        </Typography>
                      </Box>
                      {user && (
                        <IconButton
                          size="small"
                          onClick={(e) =>
                            setMessageMenuAnchor({
                              element: e.currentTarget,
                              message,
                            })
                          }
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </Box>

                    {message.is_deleted ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontStyle="italic"
                      >
                        [Message deleted]
                      </Typography>
                    ) : editingMessage?.id === message.id ? (
                      <Box>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={handleEditMessage}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingMessage(null);
                              setEditContent("");
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        {message.reply_to && (
                          <Card
                            variant="outlined"
                            sx={{
                              mb: 2,
                              p: 1,
                              bgcolor: "action.hover",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Replying to {message.reply_to.author_name}:
                            </Typography>
                            <Typography variant="body2">
                              {message.reply_to.content.substring(0, 100)}
                              {message.reply_to.content.length > 100
                                ? "..."
                                : ""}
                            </Typography>
                          </Card>
                        )}
                        <Box sx={{ mb: 2 }}>
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </Box>

                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          <Button
                            size="small"
                            startIcon={<ReplyIcon />}
                            onClick={() => setReplyingTo(message)}
                          >
                            Reply
                          </Button>

                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {(["like", "love", "prayer", "check"] as const).map(
                              (type) => {
                                const count =
                                  message.reactions?.filter(
                                    (r) => r.reaction_type === type
                                  ).length || 0;
                                const hasReacted =
                                  message.reactions?.some(
                                    (r) =>
                                      r.reaction_type === type &&
                                      r.member_id === currentMember?.id
                                  ) || false;

                                return (
                                  <Chip
                                    key={type}
                                    label={`${type === "like" ? "👍" : type === "love" ? "❤️" : type === "prayer" ? "🙏" : "✅"} ${count || ""}`}
                                    size="small"
                                    onClick={() =>
                                      handleReaction(message.id, type)
                                    }
                                    color={hasReacted ? "primary" : "default"}
                                    variant={hasReacted ? "filled" : "outlined"}
                                  />
                                );
                              }
                            )}
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {replyingTo && (
          <Alert
            severity="info"
            onClose={() => setReplyingTo(null)}
            sx={{ mb: 2 }}
          >
            Replying to {replyingTo.author_name}
          </Alert>
        )}

        {canPost && (
          <Card>
            <CardContent>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.author_name}...`
                    : "Write your message..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                {replyingTo && (
                  <Button onClick={() => setReplyingTo(null)}>
                    Cancel Reply
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={submitting || !newMessage.trim()}
                >
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        <Menu
          anchorEl={messageMenuAnchor?.element}
          open={!!messageMenuAnchor}
          onClose={() => setMessageMenuAnchor(null)}
        >
          {messageMenuAnchor &&
            isAuthor(messageMenuAnchor.message) &&
            !messageMenuAnchor.message.is_deleted && (
              <>
                <MenuItem
                  onClick={() => {
                    setEditingMessage(messageMenuAnchor.message);
                    setEditContent(messageMenuAnchor.message.content);
                    setMessageMenuAnchor(null);
                  }}
                >
                  <EditIcon sx={{ mr: 1 }} /> Edit
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleDeleteMessage(messageMenuAnchor.message.id);
                    setMessageMenuAnchor(null);
                  }}
                >
                  <DeleteIcon sx={{ mr: 1 }} /> Delete
                </MenuItem>
              </>
            )}
          {messageMenuAnchor && (
            <MenuItem
              onClick={() => {
                setReportDialogOpen(true);
              }}
            >
              <ReportIcon sx={{ mr: 1 }} /> Report
            </MenuItem>
          )}
        </Menu>

        <Dialog
          open={reportDialogOpen}
          onClose={() => setReportDialogOpen(false)}
        >
          <DialogTitle>Report Message</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason for reporting"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              sx={{ mt: 1 }}
            />
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 3,
                justifyContent: "flex-end",
              }}
            >
              <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleReportMessage}
                disabled={!reportReason.trim()}
              >
                Submit Report
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Container>
    </>
  );
};
