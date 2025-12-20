import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import PreviewIcon from "@mui/icons-material/Preview";
import {
  Box,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  alpha,
} from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

interface MessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}

export const MessageEditor = ({
  value,
  onChange,
  placeholder = "Share your thoughts...",
  minRows = 5,
}: MessageEditorProps) => {
  const { t } = useTranslation("messageBoards");
  const [showPreview, setShowPreview] = useState(false);
  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = "") => {
    const textarea = textFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleFormat = (format: string) => {
    switch (format) {
      case "bold":
        insertText("**", "**");
        break;
      case "italic":
        insertText("*", "*");
        break;
      case "link":
        insertText("[", "](url)");
        break;
      case "quote":
        insertText("> ", "");
        break;
      case "bullet":
        insertText("- ", "");
        break;
      case "number":
        insertText("1. ", "");
        break;
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          px: 1,
          py: 0.5,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title={t("editor.bold")}>
            <IconButton
              size="small"
              onClick={() => handleFormat("bold")}
              sx={{
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("editor.italic")}>
            <IconButton
              size="small"
              onClick={() => handleFormat("italic")}
              sx={{
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("editor.insertLink")}>
            <IconButton
              size="small"
              onClick={() => handleFormat("link")}
              sx={{
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <InsertLinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("editor.quote")}>
            <IconButton
              size="small"
              onClick={() => handleFormat("quote")}
              sx={{
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <FormatQuoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("editor.bulletList")}>
            <IconButton
              size="small"
              onClick={() => handleFormat("bullet")}
              sx={{
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("editor.numberedList")}>
            <IconButton
              size="small"
              onClick={() => handleFormat("number")}
              sx={{
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Tooltip
          title={showPreview ? t("editor.editMode") : t("editor.previewMode")}
        >
          <IconButton
            size="small"
            onClick={() => setShowPreview(!showPreview)}
            sx={{
              color: showPreview ? "primary.main" : "text.secondary",
              "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <PreviewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {showPreview ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            minHeight: 120,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
            border: "1px solid",
            borderColor: "divider",
            "& p": { marginBottom: 1, marginTop: 0 },
            "& p:last-child": { marginBottom: 0 },
            "& ul, & ol": { marginBottom: 1, paddingLeft: 3 },
            "& blockquote": {
              borderLeft: "3px solid",
              borderColor: "primary.main",
              pl: 2,
              py: 0.5,
              my: 1,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              fontStyle: "italic",
            },
          }}
        >
          {value.trim() ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <Box
              sx={{
                color: "text.secondary",
                fontStyle: "italic",
                textAlign: "center",
                py: 4,
              }}
            >
              {t("editor.previewPlaceholder")}
            </Box>
          )}
        </Paper>
      ) : (
        <TextField
          inputRef={textFieldRef}
          fullWidth
          multiline
          minRows={minRows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              fontSize: "0.95rem",
              "& textarea": {
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.6,
              },
              "&:hover": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
              },
              "&.Mui-focused": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 2,
                },
              },
            },
          }}
        />
      )}
    </Box>
  );
};
