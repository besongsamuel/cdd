import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PinIcon from "@mui/icons-material/PushPin";
import ReplyIcon from "@mui/icons-material/Reply";
import ReportIcon from "@mui/icons-material/Report";
import SendIcon from "@mui/icons-material/Send";
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
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MessageEditor } from "../components/common/MessageEditor";
import { ReplyModal } from "../components/common/ReplyModal";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { messageBoardsService } from "../services/messageBoardsService";
import type { Message, MessageThread } from "../types";
import { buildMessageTree, type ThreadedMessage } from "../utils/messageThreading";

export const ThreadDetailPage = () => {
  const { t } = useTranslation("messageBoards");
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
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState("");
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<{
    element: HTMLElement;
    message: Message;
  } | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );

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

        // Mark thread as seen after successfully loading messages
        // This is non-blocking - don't fail if marking as seen fails
        if (user && messagesData.length > 0) {
          messageBoardsService.markThreadAsSeen(threadId).catch((error) => {
            console.error("Error marking thread as seen:", error);
            // Silently fail - this is not critical for thread viewing
          });
        }
      } catch (error) {
        console.error("Error loading thread:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [threadId, user]);

  const handleSendMessage = async () => {
    if (!threadId || !newMessage.trim()) return;

    setSubmitting(true);
    try {
      await messageBoardsService.createMessage(
        threadId,
        newMessage.trim(),
        undefined // Top-level message
      );

      const updated = await messageBoardsService.getMessages(threadId);
      setMessages(updated);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert(t("failedToSendMessage"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (content: string) => {
    if (!threadId || !replyingTo) return;

    setReplySubmitting(true);
    try {
      await messageBoardsService.createMessage(threadId, content, replyingTo.id);
      const updated = await messageBoardsService.getMessages(threadId);
      setMessages(updated);
    } catch (error) {
      console.error("Error sending reply:", error);
      alert(t("failedToSendMessage"));
      throw error;
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleOpenReplyModal = (message: Message) => {
    setReplyingTo(message);
    setReplyModalOpen(true);
  };

  const handleCloseReplyModal = () => {
    setReplyModalOpen(false);
    setReplyingTo(null);
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
      alert(t("failedToUpdateMessage"));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    try {
      await messageBoardsService.deleteMessage(messageId);
      const updated = await messageBoardsService.getMessages(threadId!);
      setMessages(updated);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert(t("failedToDeleteMessage"));
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
      alert(t("messageReported"));
    } catch (error) {
      console.error("Error reporting message:", error);
      alert(t("failedToReportMessage"));
    }
  };

  const handleReaction = async (
    messageId: string,
    reactionType: "like" | "love" | "prayer" | "check"
  ) => {
    try {
      const findMessageInTree = (
        tree: ThreadedMessage[],
        id: string
      ): ThreadedMessage | null => {
        for (const msg of tree) {
          if (msg.id === id) return msg;
          const found = findMessageInTree(msg.replies, id);
          if (found) return found;
        }
        return null;
      };

      const threadedMessages = buildMessageTree(messages);
      const message = findMessageInTree(threadedMessages, messageId);
      const existingReaction = message?.reactions?.find(
        (r) =>
          r.reaction_type === reactionType && r.member_id === currentMember?.id
      );

      if (existingReaction) {
        await messageBoardsService.removeReaction(messageId, reactionType);
        const updated = await messageBoardsService.getMessages(threadId!);
        setMessages(updated);
      } else {
        await messageBoardsService.addReaction(messageId, reactionType);
        const updated = await messageBoardsService.getMessages(threadId!);
        setMessages(updated);
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  // Build threaded message tree (must be before early returns)
  const threadedMessages = useMemo(
    () => buildMessageTree(messages),
    [messages]
  );

  const toggleReplies = (messageId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!thread) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          {t("threadNotFound")}
        </Typography>
      </Container>
    );
  }

  const canPost = user && !thread.is_locked;
  const isAuthor = (message: Message) =>
    currentMember && message.author_id === currentMember.id;

  // Recursive component to render messages with replies
  const MessageItem = ({
    message,
    depth = 0,
  }: {
    message: ThreadedMessage;
    depth?: number;
  }) => {
    const isRoot = depth === 0;
    const maxDepth = 4; // Limit nesting depth for UX
    const hasReplies = message.replies && message.replies.length > 0;
    const isExpanded = expandedReplies.has(message.id);

    return (
      <Box
        sx={{
          position: "relative",
          pl: isRoot ? 0 : 4,
          ml: isRoot ? 0 : 2,
          mb: 2,
        }}
      >
        {!isRoot && (
          <>
            {/* Vertical connector line */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                top: -8,
                bottom: -16,
                width: "2px",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3),
                borderRadius: "1px",
              }}
            />
            {/* Horizontal connector line */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                top: 24,
                width: 16,
                height: "2px",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3),
                borderRadius: "1px",
              }}
            />
          </>
        )}
        <Card
          sx={{
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: isRoot
              ? "background.paper"
              : (theme) => alpha(theme.palette.primary.main, 0.02),
            "&:hover": {
              boxShadow: (theme) =>
                `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
              borderColor: "primary.main",
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", gap: 2.5 }}>
              <Avatar
                src={message.author_picture_url}
                alt={message.author_name}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: "primary.main",
                  fontWeight: 600,
                  boxShadow: (theme) =>
                    `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {message.author_name?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ mb: 0.5 }}
                    >
                      {message.author_name || t("anonymous")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(message.created_at).toLocaleString()}
                      {message.edited_at && (
                        <Chip
                          label={t("edited")}
                          size="small"
                          variant="outlined"
                          sx={{
                            ml: 1,
                            height: 18,
                            fontSize: "0.65rem",
                            borderColor: "text.secondary",
                            color: "text.secondary",
                          }}
                        />
                      )}
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
                    {t("messageDeleted")}
                  </Typography>
                ) : editingMessage?.id === message.id ? (
                  <Box>
                    <MessageEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder={t("editMessage")}
                      minRows={4}
                    />
                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleEditMessage}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                      >
                        {t("saveChanges")}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingMessage(null);
                          setEditContent("");
                        }}
                        sx={{ borderRadius: 2, textTransform: "none" }}
                      >
                        {t("cancel")}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Box
                      sx={{
                        mb: 2,
                        "& p": { marginBottom: 1.5 },
                        "& p:last-child": { marginBottom: 0 },
                        "& ul, & ol": {
                          marginBottom: 1.5,
                          paddingLeft: 3,
                        },
                        "& h1, & h2, & h3": {
                          marginTop: 2,
                          marginBottom: 1,
                        },
                      }}
                    >
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        {hasReplies && (
                          <IconButton
                            size="small"
                            onClick={() => toggleReplies(message.id)}
                            sx={{
                              borderRadius: 1,
                              p: 0.5,
                              transition: "transform 0.2s",
                              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                              "&:hover": {
                                bgcolor: (theme) =>
                                  alpha(theme.palette.primary.main, 0.1),
                              },
                            }}
                          >
                            <ChevronRightIcon fontSize="small" />
                          </IconButton>
                        )}
                        <Button
                          size="small"
                          startIcon={<ReplyIcon />}
                          onClick={() => handleOpenReplyModal(message)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 500,
                          }}
                        >
                          {t("reply")}
                          {hasReplies && (
                            <Chip
                              label={message.replyCount}
                              size="small"
                              sx={{
                                ml: 1,
                                height: 20,
                                fontSize: "0.7rem",
                                bgcolor: (theme) =>
                                  alpha(theme.palette.primary.main, 0.1),
                              }}
                            />
                          )}
                        </Button>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "center",
                        }}
                      >
                        {(
                          ["like", "love", "prayer", "check"] as const
                        ).map((type) => {
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

                          const emoji =
                            type === "like"
                              ? "👍"
                              : type === "love"
                                ? "❤️"
                                : type === "prayer"
                                  ? "🙏"
                                  : "✅";

                          return (
                            <Chip
                              key={type}
                              label={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <span>{emoji}</span>
                                  {count > 0 && (
                                    <Typography
                                      variant="caption"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {count}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              size="small"
                              onClick={() => handleReaction(message.id, type)}
                              sx={{
                                borderRadius: 2,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                bgcolor: hasReacted
                                  ? (theme) =>
                                      alpha(theme.palette.primary.main, 0.15)
                                  : "transparent",
                                border: "1px solid",
                                borderColor: hasReacted
                                  ? "primary.main"
                                  : "divider",
                                "&:hover": {
                                  transform: "scale(1.05)",
                                  bgcolor: hasReacted
                                    ? (theme) =>
                                        alpha(theme.palette.primary.main, 0.2)
                                    : (theme) =>
                                        alpha(theme.palette.action.hover, 0.5),
                                },
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Render nested replies */}
        {hasReplies && depth < maxDepth && isExpanded && (
          <Box sx={{ mt: 2, ml: 2 }}>
            {message.replies.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                depth={depth + 1}
              />
            ))}
          </Box>
        )}
        {/* Collapsed replies indicator */}
        {hasReplies && depth < maxDepth && !isExpanded && (
          <Button
            size="small"
            startIcon={<ChevronRightIcon />}
            onClick={() => toggleReplies(message.id)}
            sx={{
              mt: 1,
              ml: 2,
              textTransform: "none",
              color: "text.secondary",
              fontSize: "0.875rem",
              "&:hover": {
                bgcolor: (theme) =>
                  alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            {message.replyCount}{" "}
            {message.replyCount === 1 ? t("reply") : t("replies")}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <>
      <SEO title={thread.title} />
      <Box
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          minHeight: "100vh",
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/message-boards/${boardId}`)}
            sx={{
              mb: 3,
              textTransform: "none",
              borderRadius: 2,
              color: "text.secondary",
              "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            {t("backToBoard")}
          </Button>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 4,
              borderRadius: 3,
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flex: 1,
                }}
              >
                {thread.is_pinned && (
                  <PinIcon
                    color="primary"
                    sx={{
                      animation: "pulse 2s infinite",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 1 },
                        "50%": { opacity: 0.6 },
                      },
                    }}
                  />
                )}
                {thread.is_locked && <LockIcon color="action" />}
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ fontWeight: 700 }}
                >
                  {thread.title}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 3,
                alignItems: "center",
                flexWrap: "wrap",
                mb: 2,
              }}
            >
              {thread.created_by_name && (
                <Typography variant="body2" color="text.secondary">
                  {t("startedBy")} <strong>{thread.created_by_name}</strong>
                </Typography>
              )}
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {thread.message_count}
                </Typography>
                <Typography variant="body2">
                  {thread.message_count !== 1 ? t("messages") : t("message")}
                </Typography>
              </Box>
            </Box>

            {thread.is_locked && (
              <Alert
                severity="info"
                sx={{
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                  border: "1px solid",
                  borderColor: (theme) => alpha(theme.palette.info.main, 0.3),
                }}
              >
                {t("threadLocked")}
              </Alert>
            )}
          </Paper>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 4 }}>
            {threadedMessages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
          </Box>

          {canPost && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "2px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                transition: "all 0.3s ease",
                "&:focus-within": {
                  borderColor: "primary.main",
                  boxShadow: (theme) =>
                    `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
              }}
            >
              <MessageEditor
                value={newMessage}
                onChange={setNewMessage}
                placeholder={t("shareThoughts")}
                minRows={6}
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  mt: 2,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={submitting || !newMessage.trim()}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: (theme) =>
                      `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    "&:hover": {
                      boxShadow: (theme) =>
                        `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                  }}
                >
                  {submitting ? t("sending") : t("postReply")}
                </Button>
              </Box>
            </Paper>
          )}
        </Container>
      </Box>

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
                <EditIcon sx={{ mr: 1 }} /> {t("edit")}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleDeleteMessage(messageMenuAnchor.message.id);
                  setMessageMenuAnchor(null);
                }}
              >
                <DeleteIcon sx={{ mr: 1 }} /> {t("deleteMessage")}
              </MenuItem>
            </>
          )}
        {messageMenuAnchor && (
          <MenuItem
            onClick={() => {
              setReportDialogOpen(true);
            }}
          >
            <ReportIcon sx={{ mr: 1 }} /> {t("report")}
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      >
        <DialogTitle>{t("reportMessage")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t("reportReason")}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder={t("reportReasonPlaceholder")}
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
            <Button onClick={() => setReportDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={handleReportMessage}
              disabled={!reportReason.trim()}
            >
              {t("submitReport")}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {replyingTo && (
        <ReplyModal
          open={replyModalOpen}
          onClose={handleCloseReplyModal}
          parentMessage={replyingTo}
          onSend={handleSendReply}
          submitting={replySubmitting}
        />
      )}
    </>
  );
};
