import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
  alpha,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { MessageEditor } from "./MessageEditor";
import type { Message } from "../../types";

interface ReplyModalProps {
  open: boolean;
  onClose: () => void;
  parentMessage: Message;
  onSend: (content: string) => Promise<void>;
  submitting?: boolean;
}

export const ReplyModal = ({
  open,
  onClose,
  parentMessage,
  onSend,
  submitting = false,
}: ReplyModalProps) => {
  const { t } = useTranslation("messageBoards");
  const [replyContent, setReplyContent] = useState("");

  const handleSend = async () => {
    if (!replyContent.trim()) return;

    try {
      await onSend(replyContent.trim());
      setReplyContent("");
      onClose();
    } catch (error) {
      // Error handling is done by parent
      console.error("Error sending reply:", error);
    }
  };

  const handleClose = () => {
    setReplyContent("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {t("reply")}
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            "&:hover": {
              bgcolor: (theme) => alpha(theme.palette.action.hover, 0.5),
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Parent Message Preview */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
            border: "1px solid",
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
          }}
        >
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Avatar
              src={parentMessage.author_picture_url}
              alt={parentMessage.author_name}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "primary.main",
                fontWeight: 600,
              }}
            >
              {parentMessage.author_name?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ mb: 0.5 }}
              >
                {parentMessage.author_name || t("anonymous")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(parentMessage.created_at).toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              "& p": { marginBottom: 1, marginTop: 0 },
              "& p:last-child": { marginBottom: 0 },
              "& ul, & ol": { marginBottom: 1, paddingLeft: 3 },
              color: "text.secondary",
              fontSize: "0.9rem",
            }}
          >
            <ReactMarkdown>
              {parentMessage.content.length > 300
                ? `${parentMessage.content.substring(0, 300)}...`
                : parentMessage.content}
            </ReactMarkdown>
          </Box>
        </Paper>

        {/* Reply Editor */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{ mb: 1.5, color: "text.primary" }}
          >
            {t("yourReply")}
          </Typography>
          <MessageEditor
            value={replyContent}
            onChange={setReplyContent}
            placeholder={t("writeReply")}
            minRows={6}
          />
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "flex-end",
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            onClick={handleClose}
            disabled={submitting}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
            disabled={submitting || !replyContent.trim()}
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
      </DialogContent>
    </Dialog>
  );
};


