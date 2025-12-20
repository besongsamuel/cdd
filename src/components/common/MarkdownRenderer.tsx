import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
}) => {
  return (
    <Box
      sx={{
        "& p": {
          marginBottom: 2,
          fontSize: "17px",
          lineHeight: 1.6,
          color: "text.primary",
        },
        "& h1, & h2, & h3, & h4, & h5, & h6": {
          marginTop: 3,
          marginBottom: 2,
          fontWeight: 600,
          color: "text.primary",
        },
        "& h1": { fontSize: "32px" },
        "& h2": { fontSize: "28px" },
        "& h3": { fontSize: "24px" },
        "& h4": { fontSize: "20px" },
        "& ul, & ol": {
          marginBottom: 2,
          paddingLeft: 3,
        },
        "& li": {
          marginBottom: 1,
          fontSize: "17px",
          lineHeight: 1.6,
        },
        "& strong": {
          fontWeight: 600,
        },
        "& em": {
          fontStyle: "italic",
        },
        "& a": {
          color: "primary.main",
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
          },
        },
        "& blockquote": {
          borderLeft: "4px solid",
          borderColor: "primary.main",
          paddingLeft: 2,
          marginLeft: 0,
          marginRight: 0,
          fontStyle: "italic",
          color: "text.secondary",
        },
        "& code": {
          backgroundColor: "rgba(0, 0, 0, 0.05)",
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "0.9em",
          fontFamily: "monospace",
        },
        "& pre": {
          backgroundColor: "rgba(0, 0, 0, 0.05)",
          padding: 2,
          borderRadius: 2,
          overflow: "auto",
          "& code": {
            backgroundColor: "transparent",
            padding: 0,
          },
        },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
};



