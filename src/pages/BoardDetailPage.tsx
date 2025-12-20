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
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { messageBoardsService } from "../services/messageBoardsService";
import type { MessageBoard, MessageThread } from "../types";

export const BoardDetailPage = () => {
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
      alert("Failed to create thread. Please try again.");
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
        <Alert severity="error">Board not found</Alert>
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            {board.is_public ? (
              <PublicIcon color="primary" />
            ) : (
              <LockIcon color="action" />
            )}
            <Typography variant="h3" component="h1">
              {board.name}
            </Typography>
          </Box>

          {board.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {board.description}
            </Typography>
          )}

          {board.pinned_announcement && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Announcement:
              </Typography>
              <Typography variant="body2">
                {board.pinned_announcement}
              </Typography>
            </Alert>
          )}

          {user && (
            <Button
              variant="contained"
              onClick={() => setNewThreadDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              New Thread
            </Button>
          )}
        </Box>

        {sortedThreads.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No threads yet. Be the first to start a discussion!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {sortedThreads.map((thread) => (
              <Card
                key={thread.id}
                sx={{
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateX(4px)",
                    boxShadow: 2,
                  },
                }}
                onClick={() =>
                  navigate(`/message-boards/${boardId}/threads/${thread.id}`)
                }
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        {thread.is_pinned && (
                          <PinIcon color="primary" fontSize="small" />
                        )}
                        {thread.is_locked && (
                          <LockOpenIcon color="action" fontSize="small" />
                        )}
                        <Typography variant="h6" component="h3">
                          {thread.title}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          alignItems: "center",
                          mt: 1,
                        }}
                      >
                        {thread.created_by_name && (
                          <Typography variant="body2" color="text.secondary">
                            by {thread.created_by_name}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {thread.message_count} message
                          {thread.message_count !== 1 ? "s" : ""}
                        </Typography>
                        {thread.last_message_at && (
                          <Typography variant="body2" color="text.secondary">
                            Last activity:{" "}
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

        <Dialog
          open={newThreadDialogOpen}
          onClose={() => setNewThreadDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create New Thread</DialogTitle>
          <DialogContent>
            <TextField
              label="Thread Title"
              fullWidth
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              label="Initial Message"
              fullWidth
              multiline
              rows={6}
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
            />
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 3,
                justifyContent: "flex-end",
              }}
            >
              <Button onClick={() => setNewThreadDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateThread}
                disabled={
                  submitting ||
                  !newThreadTitle.trim() ||
                  !newThreadContent.trim()
                }
              >
                {submitting ? "Creating..." : "Create Thread"}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Container>
    </>
  );
};
