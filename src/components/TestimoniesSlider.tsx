import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import {
  alpha,
  Box,
  Card,
  CardContent,
  Container,
  IconButton,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { testimoniesService } from "../services/testimoniesService";
import type { Testimony } from "../types";
import { LoadingSpinner } from "./common/LoadingSpinner";

export const TestimoniesSlider = () => {
  const { t } = useTranslation("testimonies");
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadTestimonies();
  }, []);

  useEffect(() => {
    if (testimonies.length <= 1) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev + 1) % testimonies.length);
      }
    }, 6000); // Rotate every 6 seconds

    return () => clearInterval(interval);
  }, [testimonies.length, isPaused]);

  const loadTestimonies = async () => {
    try {
      const data = await testimoniesService.getFeatured();
      setTestimonies(data);
    } catch (error) {
      console.error("Error loading featured testimonies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonies.length) % testimonies.length
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonies.length);
  };

  if (loading) {
    return (
      <Box sx={{ py: 6 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (testimonies.length === 0) {
    return null; // Don't show anything if no featured testimonies
  }

  const currentTestimony = testimonies[currentIndex];

  return (
    <Box
      sx={{
        py: { xs: 6, md: 8 },
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Container maxWidth="md">
        <Typography
          variant="h3"
          component="h2"
          sx={{
            textAlign: "center",
            mb: 4,
            fontWeight: 700,
            fontSize: { xs: "2rem", md: "2.5rem" },
          }}
        >
          {t("slider.title")}
        </Typography>

        <Box
          sx={{
            position: "relative",
            minHeight: "200px",
          }}
        >
          {/* Testimony Card */}
          <Card
            key={currentTestimony.id}
            sx={{
              position: "relative",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              boxShadow: (theme) =>
                `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
              animation: "fadeIn 0.6s ease-in-out",
              "@keyframes fadeIn": {
                from: {
                  opacity: 0,
                  transform: "translateY(10px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <FormatQuoteIcon
                  sx={{
                    fontSize: 60,
                    color: "primary.main",
                    opacity: 0.2,
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontStyle: "italic",
                    lineHeight: 1.8,
                    color: "text.primary",
                    fontSize: { xs: "1.1rem", md: "1.25rem" },
                    maxWidth: "700px",
                  }}
                >
                  "{currentTestimony.content}"
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: "primary.main",
                    fontSize: { xs: "1rem", md: "1.1rem" },
                  }}
                >
                  — {currentTestimony.author_name}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Navigation Arrows */}
          {testimonies.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: "absolute",
                  left: { xs: 8, md: -20 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: "background.paper",
                  boxShadow: 2,
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: "white",
                  },
                  zIndex: 2,
                }}
                aria-label={t("slider.previous")}
              >
                <NavigateBeforeIcon />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: "absolute",
                  right: { xs: 8, md: -20 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  bgcolor: "background.paper",
                  boxShadow: 2,
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: "white",
                  },
                  zIndex: 2,
                }}
                aria-label={t("slider.next")}
              >
                <NavigateNextIcon />
              </IconButton>
            </>
          )}
        </Box>

        {/* Dots Indicator */}
        {testimonies.length > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              mt: 4,
            }}
          >
            {testimonies.map((_, index) => (
              <Box
                key={index}
                onClick={() => handleDotClick(index)}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor:
                    index === currentIndex
                      ? "primary.main"
                      : alpha("#000", 0.2),
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor:
                      index === currentIndex
                        ? "primary.dark"
                        : alpha("#000", 0.4),
                    transform: "scale(1.2)",
                  },
                }}
                aria-label={`${t("slider.goTo")} ${index + 1}`}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

