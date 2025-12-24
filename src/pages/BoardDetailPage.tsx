import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PublicIcon from "@mui/icons-material/Public";
import PinIcon from "@mui/icons-material/PushPin";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MessageEditor } from "../components/common/MessageEditor";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { messageBoardsService } from "../services/messageBoardsService";
import type { MessageBoard, MessageThread } from "../types";

export const BoardDetailPage = () => {
  const { t } = useTranslation("messageBoards");
  const { boardId } = useParams<{ boardId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<MessageBoard | null>(null);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [newThreadDialogOpen, setNewThreadDialogOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!boardId) return;

    const loadData = async () => {
      try {
        const [boardData, threadsData] = await Promise.all([
          messageBoardsService.getById(boardId),
          messageBoardsService.getThreads(boardId),
        ]);

        setBoard(boardData);
        setThreads(threadsData);
      } catch (error) {
        console.error("Error loading board:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [boardId]);

  const handleCreateThread = async () => {
    if (!boardId || !newThreadTitle.trim() || !newThreadContent.trim()) return;

    setSubmitting(true);
    try {
      const { thread } = await messageBoardsService.createThread(
        boardId,
        newThreadTitle.trim(),
        newThreadContent.trim()
      );

      setThreads([thread, ...threads]);
      setNewThreadDialogOpen(false);
      setNewThreadTitle("");
      setNewThreadContent("");
      navigate(`/message-boards/${boardId}/threads/${thread.id}`);
    } catch (error) {
      console.error("Error creating thread:", error);
      alert(t("failedToCreateThread"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!board) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{t("boardNotFound")}</Alert>
      </Container>
    );
  }

  // Sort threads: pinned first, then by last_message_at
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <>
      <SEO title={board.name} description={board.description} />
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
            onClick={() => navigate("/message-boards")}
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
            {t("backToBoards")}
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
              sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 64,
                  height: 64,
                  borderRadius: "16px",
                  bgcolor: board.is_public
                    ? (theme) => alpha(theme.palette.primary.main, 0.1)
                    : (theme) => alpha(theme.palette.grey[500], 0.1),
                  color: board.is_public ? "primary.main" : "text.secondary",
                  flexShrink: 0,
                }}
              >
                {board.is_public ? (
                  <PublicIcon sx={{ fontSize: 32 }} />
                ) : (
                  <LockIcon sx={{ fontSize: 32 }} />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{ fontWeight: 700, mb: 1 }}
                >
                  {board.name}
                </Typography>
                {board.description && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.7 }}
                  >
                    {board.description}
                  </Typography>
                )}
              </Box>
            </Box>

            {board.pinned_announcement && (
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                  border: "1px solid",
                  borderColor: (theme) => alpha(theme.palette.info.main, 0.3),
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  {t("announcement")}
                </Typography>
                <Typography variant="body2">
                  {board.pinned_announcement}
                </Typography>
              </Alert>
            )}

            {user && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewThreadDialogOpen(true)}
                sx={{
                  mt: 2,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
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
                {t("startNewDiscussion")}
              </Button>
            )}
          </Paper>

          {sortedThreads.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                textAlign: "center",
                py: 8,
                px: 4,
                borderRadius: 3,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {t("noDiscussions")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t("noDiscussionsDescription")}
              </Typography>
              {user && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setNewThreadDialogOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  {t("createFirstThread")}
                </Button>
              )}
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sortedThreads.map((thread) => (
                <Card
                  key={thread.id}
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    border: "1px solid",
                    borderColor: thread.is_pinned
                      ? (theme) => alpha(theme.palette.primary.main, 0.3)
                      : "divider",
                    bgcolor: thread.is_pinned
                      ? (theme) => alpha(theme.palette.primary.main, 0.03)
                      : "background.paper",
                    position: "relative",
                    "&:hover": {
                      transform: "translateX(8px)",
                      boxShadow: (theme) =>
                        `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
                      borderColor: "primary.main",
                    },
                  }}
                  onClick={() =>
                    navigate(`/message-boards/${boardId}/threads/${thread.id}`)
                  }
                >
                  <CardContent>
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 1.5,
                            flexWrap: "wrap",
                          }}
                        >
                          {thread.is_pinned && (
                            <PinIcon
                              color="primary"
                              fontSize="small"
                              sx={{
                                animation: thread.is_pinned
                                  ? "pulse 2s infinite"
                                  : "none",
                                "@keyframes pulse": {
                                  "0%, 100%": { opacity: 1 },
                                  "50%": { opacity: 0.6 },
                                },
                              }}
                            />
                          )}
                          {thread.is_locked && (
                            <LockOpenIcon color="action" fontSize="small" />
                          )}
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                              fontWeight: 600,
                              flex: 1,
                              minWidth: 0,
                              wordBreak: "break-word",
                            }}
                          >
                            {thread.title}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            flexWrap: "wrap",
                            mt: 1.5,
                          }}
                        >
                          {thread.created_by_name && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontWeight: 500 }}
                            >
                              {t("by")} {thread.created_by_name}
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
                              bgcolor: (theme) =>
                                alpha(theme.palette.primary.main, 0.1),
                              color: "primary.main",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {thread.message_count}
                            </Typography>
                            <Typography variant="body2">
                              {thread.message_count !== 1
                                ? t("replies")
                                : t("reply")}
                            </Typography>
                          </Box>
                          {thread.last_message_at && (
                            <Typography variant="body2" color="text.secondary">
                              {new Date(
                                thread.last_message_at
                              ).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      <Dialog
        open={newThreadDialogOpen}
        onClose={() => setNewThreadDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 2, fontWeight: 600 }}>
          {t("startNewDiscussionTitle")}
        </DialogTitle>
        <DialogContent>
          <TextField
            label={t("threadTitle")}
            fullWidth
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            sx={{ mb: 3, mt: 1 }}
            placeholder={t("threadTitlePlaceholder")}
          />
          <Box sx={{ mb: 1 }}>
            <MessageEditor
              value={newThreadContent}
              onChange={setNewThreadContent}
              placeholder={t("shareThoughtsPlaceholder")}
              minRows={8}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mt: 4,
              justifyContent: "flex-end",
            }}
          >
            <Button
              onClick={() => setNewThreadDialogOpen(false)}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateThread}
              disabled={
                submitting || !newThreadTitle.trim() || !newThreadContent.trim()
              }
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              {submitting ? t("creating") : t("createThread")}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

