import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "../components/SEO";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { youtubeService, type YouTubeVideo } from "../services/youtubeService";
import { SOCIAL_MEDIA_LINKS } from "../utils/constants";

export const SermonsPage = () => {
  const { t, i18n } = useTranslation("sermons");
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const latestVideos = await youtubeService.getLatestVideos(10);
        setVideos(latestVideos);
      } catch (error) {
        console.error("Error loading YouTube videos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  return (
    <>
      <SEO
        title={t("title")}
        description={t("description")}
        url="/sermons"
      />
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 } }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontSize: { xs: "40px", md: "56px" },
                fontWeight: 600,
                mb: 2,
                letterSpacing: "-0.02em",
              }}
            >
              {t("title")}
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{
                fontSize: { xs: "19px", md: "21px" },
                fontWeight: 400,
                color: "text.secondary",
                maxWidth: "700px",
                mx: "auto",
                lineHeight: 1.47059,
              }}
            >
              {t("subtitle")}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ py: 8 }}>
              <LoadingSpinner />
            </Box>
          ) : videos.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                {t("noVideos")}
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: { xs: 4, md: 6 },
                  mb: 6,
                }}
              >
                {videos.map((video) => (
                  <Card
                    key={video.id}
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                    onClick={() =>
                      window.open(
                        `https://www.youtube.com/watch?v=${video.videoId}`,
                        "_blank"
                      )
                    }
                  >
                    <Box sx={{ position: "relative", paddingTop: "56.25%" }}>
                      <CardMedia
                        component="img"
                        image={video.thumbnail}
                        alt={video.title}
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          backgroundColor: "rgba(255, 0, 0, 0.9)",
                          borderRadius: "50%",
                          width: 64,
                          height: 64,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "translate(-50%, -50%) scale(1.1)",
                          },
                        }}
                      >
                        <PlayArrowIcon
                          sx={{ color: "white", fontSize: 32, ml: 0.5 }}
                        />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontSize: "19px",
                          fontWeight: 600,
                          mb: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.3,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {video.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontSize: "15px",
                        }}
                      >
                        {new Date(video.publishedAt).toLocaleDateString(
                          i18n.language === "fr" ? "fr-CA" : "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              <Box textAlign="center">
                <Button
                  variant="outlined"
                  size="large"
                  href={SOCIAL_MEDIA_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: { xs: "16px", sm: "17px" },
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1.3, sm: 1.5 },
                    borderColor: "rgba(0, 0, 0, 0.23)",
                    minHeight: "48px",
                    "&:hover": {
                      borderColor: "rgba(0, 0, 0, 0.5)",
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                    },
                    "&:active": {
                      transform: "scale(0.98)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {t("viewMore")}
                </Button>
              </Box>
            </>
          )}
        </Container>
      </Box>
    </>
  );
};





