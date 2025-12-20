import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { messageBoardsService } from "../services/messageBoardsService";
import type { MessageBoard } from "../types";

export const MessageBoardPage = () => {
  const [boards, setBoards] = useState<MessageBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <SEO
        title="Message Boards"
        description="Community message boards for discussions and fellowship"
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Message Boards
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Join discussions and connect with the community
        </Typography>

        {boards.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No message boards available yet.
            </Typography>
          </Box>
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
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate(`/message-boards/${board.id}`)}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    {board.is_public ? (
                      <PublicIcon color="primary" />
                    ) : (
                      <LockIcon color="action" />
                    )}
                    <Typography variant="h6" component="h2">
                      {board.name}
                    </Typography>
                  </Box>

                  {board.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {board.description}
                    </Typography>
                  )}

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      label={board.is_public ? "Public" : "Private"}
                      size="small"
                      color={board.is_public ? "primary" : "default"}
                    />
                    {board.access_type !== "public" && (
                      <Chip
                        label={board.access_type}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </>
  );
};
