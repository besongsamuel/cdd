import ForumIcon from "@mui/icons-material/Forum";
import LockIcon from "@mui/icons-material/Lock";
import LoginIcon from "@mui/icons-material/Login";
import PublicIcon from "@mui/icons-material/Public";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
  Paper,
  Typography,
  alpha,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
// import { useHasPermission } from "../hooks/usePermissions"; // Reserved for future use
import { messageBoardsService } from "../services/messageBoardsService";
import type { MessageBoard } from "../types";

export const MessageBoardPage = () => {
  const { t } = useTranslation("messageBoards");
  const { user } = useAuth();
  // const canManageBoards = useHasPermission("manage:message-boards"); // Reserved for future use
  const [boards, setBoards] = useState<MessageBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<MessageBoard | null>(null);
  const navigate = useNavigate();

  const truncateMarkdown = (text: string, maxLines: number = 10): string => {
    const lines = text.split("\n");
    if (lines.length <= maxLines) {
      return text;
    }
    return lines.slice(0, maxLines).join("\n");
  };

  const handleReadMore = (e: React.MouseEvent, board: MessageBoard) => {
    e.stopPropagation(); // Prevent card click
    setSelectedBoard(board);
    setDescriptionDialogOpen(true);
  };

  useEffect(() => {
    const loadBoards = async () => {
      try {
        const data = await messageBoardsService.getAll();
        setBoards(data);
      } catch (error) {
        console.error("Error loading boards:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBoards();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <SEO title={t("title")} description={t("description")} />
      <Box
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          minHeight: "100vh",
          py: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: "center" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "white",
                mb: 3,
                boxShadow: 3,
              }}
            >
              <ForumIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("title")}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: "auto", fontWeight: 400 }}
            >
              {t("subtitle")}
            </Typography>
          </Box>

          {!user && (
            <Alert
              severity="info"
              icon={<LoginIcon />}
              sx={{
                mb: 4,
                borderRadius: 3,
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.info.main, 0.3),
                "& .MuiAlert-message": {
                  width: "100%",
                },
              }}
              action={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    component={RouterLink}
                    to="/login"
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    {t("login")}
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/signup"
                    size="small"
                    variant="contained"
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    {t("signUp")}
                  </Button>
                </Box>
              }
            >
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t("joinConversation")}
              </Typography>
              <Typography variant="body2">
                {t("joinConversationDescription")}
              </Typography>
            </Alert>
          )}

          {boards.length === 0 ? (
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
              <ForumIcon
                sx={{
                  fontSize: 64,
                  color: "text.secondary",
                  mb: 2,
                  opacity: 0.5,
                }}
              />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {t("noBoards")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("noBoardsDescription")}
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {boards.map((board) => (
                <Card
                  key={board.id}
                  sx={{
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    border: "1px solid",
                    borderColor: "divider",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: board.is_public
                        ? (theme) =>
                            `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                        : (theme) => theme.palette.grey[400],
                      transform: "scaleX(0)",
                      transformOrigin: "left",
                      transition: "transform 0.3s ease",
                    },
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: (theme) =>
                        `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderColor: "primary.main",
                      "&::before": {
                        transform: "scaleX(1)",
                      },
                    },
                  }}
                  onClick={() => navigate(`/message-boards/${board.id}`)}
                >
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 48,
                          height: 48,
                          borderRadius: "12px",
                          bgcolor: board.is_public
                            ? (theme) => alpha(theme.palette.primary.main, 0.1)
                            : (theme) => alpha(theme.palette.grey[500], 0.1),
                          color: board.is_public
                            ? "primary.main"
                            : "text.secondary",
                        }}
                      >
                        {board.is_public ? <PublicIcon /> : <LockIcon />}
                      </Box>
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{ fontWeight: 600, flex: 1 }}
                      >
                        {board.name}
                      </Typography>
                    </Box>

                    {board.description && (
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.875rem",
                            "& p": { margin: 0, marginBottom: 1 },
                            "& p:last-child": { marginBottom: 0 },
                          }}
                        >
                          <ReactMarkdown>
                            {truncateMarkdown(board.description)}
                          </ReactMarkdown>
                        </Box>
                        {board.description.split("\n").length > 10 && (
                          <Link
                            component="button"
                            variant="body2"
                            onClick={(e) => handleReadMore(e, board)}
                            sx={{ mt: 1, cursor: "pointer" }}
                          >
                            {t("readMore")}
                          </Link>
                        )}
                      </Box>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        mt: "auto",
                        pt: 2,
                      }}
                    >
                      <Chip
                        label={board.is_public ? t("public") : t("private")}
                        size="small"
                        color={board.is_public ? "primary" : "default"}
                        sx={{
                          fontWeight: 500,
                          boxShadow: (theme) =>
                            board.is_public
                              ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                              : "none",
                        }}
                      />
                      {board.access_type !== "public" && (
                        <Chip
                          label={t(`accessTypes.${board.access_type}`)}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      <Dialog
        open={descriptionDialogOpen}
        onClose={() => setDescriptionDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 2 }}>
          {selectedBoard?.name}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              "& p": { marginBottom: 2, lineHeight: 1.8 },
              "& p:last-child": { marginBottom: 0 },
              "& ul, & ol": { marginBottom: 2, paddingLeft: 3 },
              "& h1, & h2, & h3, & h4, & h5, & h6": {
                marginTop: 3,
                marginBottom: 1.5,
                fontWeight: 600,
              },
              "& code": {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                px: 0.5,
                py: 0.25,
                borderRadius: 1,
                fontSize: "0.9em",
              },
              "& pre": {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                p: 2,
                borderRadius: 2,
                overflow: "auto",
              },
            }}
          >
            {selectedBoard?.description && (
              <ReactMarkdown>{selectedBoard.description}</ReactMarkdown>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
