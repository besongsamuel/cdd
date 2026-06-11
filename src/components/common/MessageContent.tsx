import { Box, Chip, alpha } from "@mui/material";
import ReactMarkdown from "react-markdown";
import { splitContentWithMentions } from "../../utils/mentions";

interface MessageContentProps {
  content: string;
  compact?: boolean;
}

export const MessageContent = ({ content, compact = false }: MessageContentProps) => {
  const segments = splitContentWithMentions(content);

  const markdownSx = {
    "& p": { marginBottom: compact ? 1 : 1.5, marginTop: 0 },
    "& p:last-child": { marginBottom: 0 },
    "& ul, & ol": {
      marginBottom: compact ? 1 : 1.5,
      paddingLeft: 3,
    },
    "& h1, & h2, & h3": {
      marginTop: compact ? 1 : 2,
      marginBottom: 1,
    },
    display: "inline",
  };

  return (
    <Box
      sx={{
        fontSize: compact ? "0.9rem" : "0.95rem",
        lineHeight: 1.6,
        color: compact ? "text.secondary" : "text.primary",
        wordBreak: "break-word",
      }}
    >
      {segments.map((segment, index) => {
        if (segment.type === "mention") {
          return (
            <Chip
              key={`mention-${segment.memberId}-${index}`}
              label={`@${segment.display}`}
              size="small"
              component="span"
              sx={{
                height: "auto",
                mx: 0.25,
                verticalAlign: "baseline",
                fontWeight: 600,
                fontSize: "inherit",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
                "& .MuiChip-label": {
                  px: 0.75,
                  py: 0.25,
                },
              }}
            />
          );
        }

        if (!segment.value) return null;

        return (
          <Box key={`text-${index}`} component="span" sx={markdownSx}>
            <ReactMarkdown>{segment.value}</ReactMarkdown>
          </Box>
        );
      })}
    </Box>
  );
};
