import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import PreviewIcon from "@mui/icons-material/Preview";
import {
  Avatar,
  Box,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useCallback, useRef, useState, type RefObject } from "react";
import { Mention, MentionsInput } from "react-mentions";
import { useTranslation } from "react-i18next";
import { membersService } from "../../services/membersService";
import { MessageContent } from "./MessageContent";

interface MessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  enableMentions?: boolean;
}

const getMentionsInputStyle = (primaryColor: string) => ({
  control: {
    fontSize: "0.95rem",
    lineHeight: 1.6,
    fontFamily: "inherit",
  },
  input: {
    margin: 0,
    padding: "14px",
    border: "1px solid rgba(0, 0, 0, 0.23)",
    borderRadius: 8,
    outline: "none",
    minHeight: 120,
    overflow: "auto",
  },
  highlighter: {
    padding: "14px",
    border: "1px solid transparent",
    borderRadius: 8,
    minHeight: 120,
  },
  suggestions: {
    list: {
      backgroundColor: "#fff",
      border: "1px solid rgba(0, 0, 0, 0.12)",
      borderRadius: 8,
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
      fontSize: "0.9rem",
      maxHeight: 240,
      overflowY: "auto" as const,
    },
    item: {
      padding: "8px 12px",
      borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
      "&focused": {
        backgroundColor: alpha(primaryColor, 0.08),
      },
    },
  },
});

export const MessageEditor = ({
  value,
  onChange,
  placeholder = "Share your thoughts...",
  minRows = 5,
  enableMentions = true,
}: MessageEditorProps) => {
  const { t } = useTranslation("messageBoards");
  const theme = useTheme();
  const [showPreview, setShowPreview] = useState(false);
  const textFieldRef = useRef<HTMLTextAreaElement | null>(null);

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

  const fetchMembers = useCallback(
    (query: string, callback: (results: { id: string; display: string }[]) => void) => {
      membersService
        .searchByName(query, 10)
        .then((members) => {
          callback(
            members.map((m) => ({
              id: m.id,
              display: m.name,
              picture_url: m.picture_url,
              title_name: m.title_name,
            }))
          );
        })
        .catch(() => callback([]));
    },
    []
  );

  const minHeight = minRows * 24;

  return (
    <Box
      sx={{
        "& .mentions__input": {
          minHeight,
          transition: "border-color 0.2s",
        },
        "& .mentions__highlighter": {
          minHeight,
        },
        "& .mentions__mention": {
          backgroundColor: (t) => alpha(t.palette.primary.main, 0.15),
          color: "primary.main",
          fontWeight: 600,
          borderRadius: 4,
          padding: "0 2px",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          px: 1,
          py: 0.5,
          borderRadius: 2,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
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
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
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
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
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
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
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
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
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
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
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
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
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
                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
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
            bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
            border: "1px solid",
            borderColor: "divider",
            "& blockquote": {
              borderLeft: "3px solid",
              borderColor: "primary.main",
              pl: 2,
              py: 0.5,
              my: 1,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
              fontStyle: "italic",
            },
          }}
        >
          {value.trim() ? (
            <MessageContent content={value} />
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
      ) : enableMentions ? (
        <MentionsInput
          value={value}
          onChange={(_e, newValue) => onChange(newValue)}
          placeholder={placeholder}
          inputRef={textFieldRef as RefObject<HTMLTextAreaElement>}
          allowSuggestionsAboveCursor
          className="mentions"
          style={getMentionsInputStyle(theme.palette.primary.main)}
        >
          <Mention
            trigger="@"
            markup="@[__display__](member:__id__)"
            displayTransform={(_id, display) => `@${display}`}
            appendSpaceOnAdd
            data={fetchMembers}
            renderSuggestion={(
              suggestion,
              _search,
              highlightedDisplay,
              _index,
              focused
            ) => {
              const entry = suggestion as {
                display: string;
                picture_url?: string;
                title_name?: string;
              };
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 0.5,
                    bgcolor: focused
                      ? (t) => alpha(t.palette.primary.main, 0.08)
                      : "transparent",
                  }}
                >
                  <Avatar
                    src={entry.picture_url}
                    sx={{ width: 28, height: 28, fontSize: "0.75rem" }}
                  >
                    {entry.display?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {highlightedDisplay}
                    </Typography>
                    {entry.title_name && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {entry.title_name}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            }}
          />
        </MentionsInput>
      ) : (
        <Box
          component="textarea"
          ref={textFieldRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          sx={{
            width: "100%",
            minHeight,
            p: "14px",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            fontFamily: "inherit",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            resize: "vertical",
            "&:focus": {
              outline: "none",
              borderColor: "primary.main",
              borderWidth: 2,
              p: "13px",
            },
          }}
        />
      )}
    </Box>
  );
};
