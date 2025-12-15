import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { suggestionCategoriesService } from "../services/suggestionCategoriesService";
import { suggestionsService } from "../services/suggestionsService";
import type { SuggestionCategory } from "../types";

export const SuggestionsPage = () => {
  const { t } = useTranslation("suggestions");
  const { currentMember, user } = useAuth();
  const [categories, setCategories] = useState<SuggestionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    category_id: "",
    custom_category: "",
    suggestion_text: "",
    submitter_name: "",
    submitter_phone: "",
    is_anonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form with member info when authenticated
  useEffect(() => {
    if (currentMember && !formData.is_anonymous) {
      setFormData((prev) => ({
        ...prev,
        submitter_name: currentMember.name || "",
        submitter_phone: currentMember.phone || "",
      }));
    }
  }, [currentMember, formData.is_anonymous]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const activeCategories = await suggestionCategoriesService.getActive();
        setCategories(activeCategories);
      } catch (err) {
        console.error("Error loading categories:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.category_id) {
      setError(t("form.categoryRequired"));
      setSubmitting(false);
      return;
    }

    // If "Other" is selected, require custom_category
    const selectedCategory = categories.find(
      (cat) => cat.id === formData.category_id
    );
    if (selectedCategory?.name === "Other" && !formData.custom_category.trim()) {
      setError(t("form.customCategoryRequired"));
      setSubmitting(false);
      return;
    }

    if (!formData.suggestion_text.trim()) {
      setError(t("form.suggestionRequired"));
      setSubmitting(false);
      return;
    }

    try {
      await suggestionsService.create({
        category_id:
          selectedCategory?.name === "Other"
            ? undefined
            : formData.category_id,
        custom_category:
          selectedCategory?.name === "Other"
            ? formData.custom_category
            : undefined,
        suggestion_text: formData.suggestion_text,
        submitter_name: formData.is_anonymous
          ? undefined
          : formData.submitter_name || undefined,
        submitter_phone: formData.is_anonymous
          ? undefined
          : formData.submitter_phone || undefined,
        member_id: formData.is_anonymous || !currentMember
          ? undefined
          : currentMember.id,
      });

      setSuccess(true);
      setFormData({
        category_id: "",
        custom_category: "",
        suggestion_text: "",
        submitter_name: "",
        submitter_phone: "",
        is_anonymous: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCategoryChange = (e: any) => {
    setFormData({
      ...formData,
      category_id: e.target.value,
      custom_category: "", // Reset custom category when changing
    });
  };

  const handleAnonymousChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isAnonymous = e.target.checked;
    setFormData({
      ...formData,
      is_anonymous: isAnonymous,
      submitter_name: isAnonymous
        ? ""
        : currentMember?.name || "",
      submitter_phone: isAnonymous
        ? ""
        : currentMember?.phone || "",
    });
  };

  const selectedCategory = categories.find(
    (cat) => cat.id === formData.category_id
  );
  const showCustomCategory = selectedCategory?.name === "Other";

  if (loading) {
    return (
      <>
        <SEO
          title={t("title")}
          description={t("subtitle")}
          url="/suggestions"
        />
        <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
          <LoadingSpinner />
        </Container>
      </>
    );
  }

  return (
    <>
      <SEO title={t("title")} description={t("subtitle")} url="/suggestions" />
      <Box
        sx={{
          position: "relative",
          bgcolor: "background.default",
          overflow: "hidden",
          minHeight: "100vh",
        }}
      >
        {/* Animated Background Illustrations */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            opacity: 0.08,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 1000"
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%" }}
          >
            <defs>
              <linearGradient id="suggestionGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4">
                  <animate attributeName="stop-opacity" values="0.2;0.5;0.2" dur="5s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.3">
                  <animate attributeName="stop-opacity" values="0.3;0.6;0.3" dur="5s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              <linearGradient id="suggestionGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3">
                  <animate attributeName="stop-opacity" values="0.2;0.4;0.2" dur="4s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4">
                  <animate attributeName="stop-opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>

            {/* Floating Thought Bubbles */}
            <g transform="translate(100, 150)">
              <circle cx="0" cy="0" r="40" fill="url(#suggestionGradient1)">
                <animate attributeName="r" values="40;50;40" dur="3s" repeatCount="indefinite" />
                <animate attributeName="cy" values="0;10;0" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="25" cy="-15" r="15" fill="#2563eb" opacity="0.4">
                <animate attributeName="r" values="15;20;15" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="-20" cy="20" r="12" fill="#60a5fa" opacity="0.3">
                <animate attributeName="r" values="12;18;12" dur="3.5s" repeatCount="indefinite" />
              </circle>
            </g>

            <g transform="translate(1000, 200)">
              <circle cx="0" cy="0" r="35" fill="url(#suggestionGradient2)">
                <animate attributeName="r" values="35;45;35" dur="3.5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="0;-15;0" dur="5s" repeatCount="indefinite" />
              </circle>
              <circle cx="20" cy="-10" r="12" fill="#3b82f6" opacity="0.4">
                <animate attributeName="r" values="12;17;12" dur="2.8s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Light Bulb / Idea Icons */}
            <g transform="translate(200, 400)">
              <circle cx="0" cy="0" r="30" fill="#fbbf24" opacity="0.3">
                <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;15 0 0;-15 0 0;0 0 0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
              <path
                d="M -15 -20 L 15 -20 L 10 -5 L -10 -5 Z"
                fill="#f59e0b"
                opacity="0.4"
              >
                <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2.5s" repeatCount="indefinite" />
              </path>
              <circle cx="0" cy="-12" r="8" fill="#fbbf24" opacity="0.5">
                <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>

            <g transform="translate(900, 500)">
              <circle cx="0" cy="0" r="25" fill="#fbbf24" opacity="0.25">
                <animate attributeName="opacity" values="0.2;0.35;0.2" dur="3.5s" repeatCount="indefinite" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;-20 0 0;20 0 0;0 0 0"
                  dur="5s"
                  repeatCount="indefinite"
                />
              </circle>
              <path
                d="M -12 -15 L 12 -15 L 8 -3 L -8 -3 Z"
                fill="#f59e0b"
                opacity="0.35"
              >
                <animate attributeName="opacity" values="0.25;0.4;0.25" dur="3s" repeatCount="indefinite" />
              </path>
            </g>

            {/* Speech Bubbles */}
            <g transform="translate(150, 700)">
              <path
                d="M 0 0 Q -20 -10 -30 0 Q -20 10 0 0 L 0 20 L 10 15 Z"
                fill="#3b82f6"
                opacity="0.3"
              >
                <animate attributeName="opacity" values="0.2;0.4;0.2" dur="4s" repeatCount="indefinite" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 5,-5; 0,0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </path>
            </g>

            <g transform="translate(1050, 750)">
              <ellipse cx="0" cy="0" rx="40" ry="30" fill="#2563eb" opacity="0.25">
                <animate attributeName="rx" values="40;50;40" dur="3.5s" repeatCount="indefinite" />
                <animate attributeName="ry" values="30;40;30" dur="3.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.35;0.2" dur="4s" repeatCount="indefinite" />
              </ellipse>
              <path
                d="M 20 15 L 30 25 L 25 20 Z"
                fill="#2563eb"
                opacity="0.3"
              >
                <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
              </path>
            </g>

            {/* Animated Stars / Sparkles */}
            <g transform="translate(500, 100)">
              <path
                d="M 0 -10 L 3 -3 L 10 -3 L 4 1 L 6 8 L 0 4 L -6 8 L -4 1 L -10 -3 L -3 -3 Z"
                fill="#fbbf24"
                opacity="0.4"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;360 0 0"
                  dur="8s"
                  repeatCount="indefinite"
                />
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
              </path>
            </g>

            <g transform="translate(700, 300)">
              <path
                d="M 0 -8 L 2.5 -2.5 L 8 -2.5 L 3 1 L 5 8 L 0 3 L -5 8 L -3 1 L -8 -2.5 L -2.5 -2.5 Z"
                fill="#60a5fa"
                opacity="0.35"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;-360 0 0"
                  dur="6s"
                  repeatCount="indefinite"
                />
                <animate attributeName="opacity" values="0.25;0.5;0.25" dur="2.5s" repeatCount="indefinite" />
              </path>
            </g>

            <g transform="translate(400, 800)">
              <path
                d="M 0 -12 L 4 -4 L 12 -4 L 5 2 L 8 12 L 0 5 L -8 12 L -5 2 L -12 -4 L -4 -4 Z"
                fill="#fbbf24"
                opacity="0.3"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 0 0;360 0 0"
                  dur="10s"
                  repeatCount="indefinite"
                />
                <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
              </path>
            </g>

            {/* Animated Connecting Lines */}
            <path
              d="M 300 200 Q 500 300 700 250"
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            >
              <animate
                attributeName="opacity"
                values="0.2;0.4;0.2"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-dasharray"
                values="0,200;100,200;200,0"
                dur="5s"
                repeatCount="indefinite"
              />
            </path>

            <path
              d="M 800 400 Q 1000 500 1100 450"
              stroke="#2563eb"
              strokeWidth="2"
              fill="none"
              opacity="0.25"
            >
              <animate
                attributeName="opacity"
                values="0.15;0.35;0.15"
                dur="5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-dasharray"
                values="0,300;150,300;300,0"
                dur="6s"
                repeatCount="indefinite"
              />
            </path>

            {/* Floating Particles */}
            <circle cx="300" cy="600" r="4" fill="#60a5fa" opacity="0.4">
              <animate attributeName="cy" values="600;550;600" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="600" cy="650" r="3" fill="#3b82f6" opacity="0.35">
              <animate attributeName="cy" values="650;600;650" dur="5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.45;0.25" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="800" cy="200" r="5" fill="#2563eb" opacity="0.3">
              <animate attributeName="cy" values="200;150;200" dur="4.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.4;0.2" dur="4s" repeatCount="indefinite" />
            </circle>
          </svg>
        </Box>

        <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 }, position: "relative", zIndex: 1 }}>
          <Box
            sx={{
              maxWidth: 800,
              mx: "auto",
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 0.2s forwards",
              "@keyframes fadeInUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(30px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            textAlign="center"
            sx={{
              fontSize: { xs: "32px", md: "48px" },
              fontWeight: 700,
              mb: 2,
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            {t("title")}
          </Typography>
          <Typography
            variant="body1"
            textAlign="center"
            color="text.secondary"
            sx={{
              mb: 5,
              fontSize: { xs: "16px", md: "18px" },
              maxWidth: "600px",
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            {t("subtitle")}
          </Typography>

          {success ? (
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                border: "1px solid rgba(30, 58, 138, 0.1)",
                borderRadius: 3,
              }}
            >
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  {t("success.title")}
                </Typography>
                <Typography variant="body1">
                  {t("success.message")}
                </Typography>
              </Alert>
              <Button
                variant="contained"
                onClick={() => setSuccess(false)}
                sx={{
                  mt: 2,
                  px: 4,
                  py: 1.5,
                  background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                }}
              >
                Submit Another Suggestion
              </Button>
            </Paper>
          ) : (
            <Paper
              sx={{
                p: { xs: 3, sm: 4 },
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                border: "1px solid rgba(30, 58, 138, 0.1)",
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
              }}
            >
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <FormControl fullWidth sx={{ mb: 3 }} required>
                  <InputLabel id="category-label">
                    {t("form.category")}
                  </InputLabel>
                  <Select
                    labelId="category-label"
                    id="category"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleCategoryChange}
                    label={t("form.category")}
                    sx={{
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "16px", sm: "16px" },
                      },
                    }}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {showCustomCategory && (
                  <TextField
                    fullWidth
                    label={t("form.customCategory")}
                    name="custom_category"
                    value={formData.custom_category}
                    onChange={handleChange}
                    placeholder={t("form.customCategoryPlaceholder")}
                    required
                    margin="normal"
                    sx={{
                      mb: 3,
                      "& .MuiInputBase-input": {
                        fontSize: { xs: "16px", sm: "16px" },
                      },
                    }}
                  />
                )}

                <TextField
                  fullWidth
                  label={t("form.suggestion")}
                  name="suggestion_text"
                  value={formData.suggestion_text}
                  onChange={handleChange}
                  placeholder={t("form.suggestionPlaceholder")}
                  required
                  multiline
                  rows={6}
                  margin="normal"
                  sx={{
                    mb: 3,
                    "& .MuiInputBase-input": {
                      fontSize: { xs: "16px", sm: "16px" },
                    },
                  }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_anonymous}
                      onChange={handleAnonymousChange}
                      name="is_anonymous"
                    />
                  }
                  label={t("form.anonymous")}
                  sx={{ mb: 2 }}
                />
                {!formData.is_anonymous && (
                  <>
                    {user && currentMember && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          {`Submitting as ${currentMember.name}${currentMember.email ? ` (${currentMember.email})` : ""}`}
                        </Typography>
                      </Alert>
                    )}
                    <TextField
                      fullWidth
                      label={t("form.name")}
                      name="submitter_name"
                      value={formData.submitter_name}
                      onChange={handleChange}
                      placeholder={t("form.namePlaceholder")}
                      margin="normal"
                      sx={{
                        mb: 2,
                        "& .MuiInputBase-input": {
                          fontSize: { xs: "16px", sm: "16px" },
                        },
                      }}
                    />
                    {!user && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          fontSize: "14px",
                          fontStyle: "italic",
                          px: 1,
                        }}
                      >
                        {t("form.nameNote")}
                      </Typography>
                    )}
                    <TextField
                      fullWidth
                      label={t("form.phone")}
                      name="submitter_phone"
                      value={formData.submitter_phone}
                      onChange={handleChange}
                      placeholder={t("form.phonePlaceholder")}
                      type="tel"
                      margin="normal"
                      sx={{
                        mb: 3,
                        "& .MuiInputBase-input": {
                          fontSize: { xs: "16px", sm: "16px" },
                        },
                      }}
                    />
                  </>
                )}

                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    sx={{
                      px: 5,
                      py: 1.5,
                      fontSize: { xs: "16px", md: "17px" },
                      minHeight: "48px",
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                      boxShadow: "0 4px 20px rgba(30, 58, 138, 0.3)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-2px) scale(1.02)",
                        boxShadow: "0 8px 30px rgba(30, 58, 138, 0.4)",
                        background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                      },
                      "&:active": {
                        transform: "translateY(0) scale(0.98)",
                      },
                    }}
                  >
                    {submitting ? t("form.submitting") : t("form.submit")}
                  </Button>
                </Box>
              </form>
            </Paper>
          )}
        </Box>
      </Container>
      </Box>
    </>
  );
};

