import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Paper,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "../components/SEO";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useHasPermission } from "../hooks/usePermissions";
import { testimoniesService } from "../services/testimoniesService";
import type { Testimony } from "../types";

export const TestimoniesPage = () => {
  const { t } = useTranslation("testimonies");
  const canModerateTestimonies = useHasPermission("moderate:testimonies");
  // const canManageTestimonies = useHasPermission("manage:testimonies"); // Reserved for future use
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    author_name: "",
    author_email: "",
    content: "",
  });

  const MAX_CONTENT_LENGTH = 300;

  useEffect(() => {
    loadTestimonies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canModerateTestimonies]);

  const loadTestimonies = async () => {
    try {
      // If user can moderate, show all testimonies (including pending)
      // Otherwise, show only approved
      const data = canModerateTestimonies
        ? await testimoniesService.getAll()
        : await testimoniesService.getApproved();
      setTestimonies(data);
    } catch (err) {
      console.error("Error loading testimonies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.author_name.trim()) {
      setError(t("form.nameRequired"));
      setSubmitting(false);
      return;
    }

    if (!formData.content.trim()) {
      setError(t("form.contentRequired"));
      setSubmitting(false);
      return;
    }

    if (formData.content.length > MAX_CONTENT_LENGTH) {
      setError(t("form.contentTooLong"));
      setSubmitting(false);
      return;
    }

    // Email validation if provided
    if (
      formData.author_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.author_email)
    ) {
      setError(t("form.invalidEmail"));
      setSubmitting(false);
      return;
    }

    try {
      await testimoniesService.create({
        author_name: formData.author_name.trim(),
        author_email: formData.author_email.trim() || undefined,
        content: formData.content.trim(),
      });

      setSuccess(true);
      setFormData({
        author_name: "",
        author_email: "",
        content: "",
      });

      // Reload testimonies after a short delay
      setTimeout(() => {
        loadTestimonies();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <SEO title={t("title")} description={t("subtitle")} url="/testimonies" />
      <Box
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          minHeight: "100vh",
          py: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="lg">
          {/* Hero Section */}
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: "2rem", md: "3rem" },
              }}
            >
              {t("title")}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: "700px",
                mx: "auto",
                fontSize: { xs: "1rem", md: "1.25rem" },
              }}
            >
              {t("subtitle")}
            </Typography>
          </Box>

          {/* Submission Form */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 6,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
            }}
          >
            <Typography
              variant="h5"
              component="h2"
              sx={{ mb: 3, fontWeight: 600 }}
            >
              {t("form.title")}
            </Typography>

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {t("form.success")}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 3,
                }}
              >
                <TextField
                  fullWidth
                  label={t("form.name")}
                  name="author_name"
                  value={formData.author_name}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label={t("form.email")}
                  name="author_email"
                  type="email"
                  value={formData.author_email}
                  onChange={handleChange}
                  variant="outlined"
                />
                <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                  <TextField
                    fullWidth
                    label={t("form.testimony")}
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder={t("form.testimonyPlaceholder")}
                    helperText={`${formData.content.length}/${MAX_CONTENT_LENGTH} ${t("form.characters")}`}
                    inputProps={{
                      maxLength: MAX_CONTENT_LENGTH,
                    }}
                  />
                </Box>
                <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    {submitting ? t("form.submitting") : t("form.submit")}
                  </Button>
                </Box>
              </Box>
            </form>
          </Paper>

          {/* Approved Testimonies Display */}
          {testimonies.length > 0 && (
            <Box>
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  mb: 4,
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                {t("approved.title")}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                  gap: 3,
                }}
              >
                {testimonies.map((testimony) => (
                  <Card
                    key={testimony.id}
                    sx={{
                      height: "100%",
                      position: "relative",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: (theme) =>
                          `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                        }}
                      >
                        <FormatQuoteIcon
                          sx={{
                            color: "primary.main",
                            fontSize: 40,
                            opacity: 0.3,
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              mb: 2,
                              fontStyle: "italic",
                              lineHeight: 1.7,
                              color: "text.primary",
                            }}
                          >
                            "{testimony.content}"
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: "primary.main",
                              textAlign: "right",
                            }}
                          >
                            — {testimony.author_name}
                          </Typography>
                          {testimony.is_featured && (
                            <Box
                              sx={{
                                mt: 1,
                                display: "inline-flex",
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: (theme) =>
                                  alpha(theme.palette.primary.main, 0.1),
                                color: "primary.main",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 600 }}
                              >
                                {t("featured")}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
};


