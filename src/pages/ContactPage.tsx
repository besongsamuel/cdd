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
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "../components/SEO";
import { contactService } from "../services/contactService";
import {
  CHURCH_ADDRESS,
  CHURCH_PHONE,
  CHURCH_PROVINCE,
} from "../utils/constants";

export const ContactPage = () => {
  const { t } = useTranslation("contact");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Basic validation
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      setError(t("form.error"));
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t("form.error"));
      setLoading(false);
      return;
    }

    try {
      await contactService.create(formData);
      setSuccess(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <SEO title={t("title")} description={t("getInTouch")} url="/contact" />
      <Box
        sx={{
          position: "relative",
          bgcolor: "background.default",
          overflow: "hidden",
          minHeight: "100vh",
        }}
      >
        {/* Decorative Background */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            opacity: 0.06,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 1200"
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Decorative shapes */}
            <g transform="translate(200, 150)">
              <circle cx="0" cy="0" r="40" fill="#2563eb" opacity="0.4" />
              <path
                d="M -30 50 Q -30 70 0 75 Q 30 70 30 50 L 30 90 Q 30 110 0 115 Q -30 110 -30 90 Z"
                fill="#3b82f6"
                opacity="0.4"
              />
            </g>
            <g transform="translate(800, 200)">
              <circle cx="0" cy="0" r="35" fill="#3b82f6" opacity="0.35" />
              <path
                d="M -25 45 Q -25 65 0 70 Q 25 65 25 45 L 25 85 Q 25 105 0 110 Q -25 105 -25 85 Z"
                fill="#60a5fa"
                opacity="0.35"
              />
            </g>
            {/* Mail/envelope icon representation */}
            <g transform="translate(500, 300)">
              <rect
                x="-50"
                y="-30"
                width="100"
                height="60"
                rx="5"
                fill="#2563eb"
                opacity="0.3"
              />
              <path
                d="M -50 -30 L 0 0 L 50 -30"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                opacity="0.4"
              />
            </g>
            {/* Connected dots */}
            <g>
              <circle cx="300" cy="600" r="15" fill="#2563eb" opacity="0.4" />
              <circle cx="600" cy="620" r="12" fill="#3b82f6" opacity="0.4" />
              <circle cx="900" cy="600" r="14" fill="#60a5fa" opacity="0.4" />
              <line
                x1="315"
                y1="600"
                x2="588"
                y2="618"
                stroke="#2563eb"
                strokeWidth="2"
                opacity="0.3"
              />
              <line
                x1="612"
                y1="620"
                x2="886"
                y2="608"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
              />
            </g>
          </svg>
        </Box>

        <Container
          sx={{
            py: { xs: 4, md: 6 },
            px: { xs: 2, sm: 3 },
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            textAlign="center"
            sx={{ fontSize: { xs: "32px", md: "40px" } }}
          >
            {t("title")}
          </Typography>

          {/* Scripture Verse */}
          <Box
            sx={{
              maxWidth: 800,
              mx: "auto",
              mt: 4,
              mb: 4,
              textAlign: "center",
            }}
          >
            <Card
              sx={{
                background:
                  "linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)",
                border: "1px solid rgba(37, 99, 235, 0.1)",
                boxShadow: "0 4px 20px rgba(37, 99, 235, 0.08)",
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography
                  variant="h6"
                  component="blockquote"
                  sx={{
                    fontStyle: "italic",
                    fontSize: { xs: "18px", md: "22px" },
                    lineHeight: 1.8,
                    color: "text.primary",
                    mb: 2,
                    fontWeight: 400,
                  }}
                >
                  "{t("scripture.verse")}"
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: "13px", md: "14px" },
                    fontStyle: "normal",
                    mt: 2,
                  }}
                >
                  {t("scripture.reference")}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 3, md: 4 },
              mt: { xs: 3, md: 4 },
            }}
          >
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 600, color: "primary.main", mb: 3 }}
              >
                {t("getInTouch")}
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label={t("form.name")}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  margin="normal"
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: { xs: "16px", sm: "16px" }, // Prevents zoom on iOS
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label={t("form.email")}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  margin="normal"
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: { xs: "16px", sm: "16px" }, // Prevents zoom on iOS
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label={t("form.message")}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  multiline
                  rows={6}
                  margin="normal"
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: { xs: "16px", sm: "16px" }, // Prevents zoom on iOS
                    },
                  }}
                />
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {t("form.success")}
                  </Alert>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 3,
                    py: { xs: 1.5, sm: 1.5 },
                    fontSize: { xs: "16px", sm: "17px" },
                    minHeight: "48px",
                  }}
                  disabled={loading}
                >
                  {loading ? t("form.sending") : t("form.sendMessage")}
                </Button>
              </form>
            </Paper>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Card
                sx={{
                  height: "fit-content",
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{
                      fontSize: { xs: "20px", md: "24px" },
                      fontWeight: 600,
                      color: "primary.main",
                    }}
                  >
                    {t("visitUs")}
                  </Typography>
                  <Box sx={{ mt: { xs: 2, sm: 3 } }}>
                    <Typography
                      variant="body1"
                      gutterBottom
                      sx={{ fontSize: { xs: "15px", md: "16px" } }}
                    >
                      <strong>{t("address")}:</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                      sx={{ fontSize: { xs: "14px", md: "15px" } }}
                    >
                      {CHURCH_ADDRESS}
                    </Typography>

                    <Typography
                      variant="body1"
                      gutterBottom
                      sx={{ mt: 2, fontSize: { xs: "15px", md: "16px" } }}
                    >
                      <strong>{t("phone")}:</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                      sx={{ fontSize: { xs: "14px", md: "15px" } }}
                    >
                      <a
                        href={`tel:${CHURCH_PHONE.replace(/\s/g, "")}`}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {CHURCH_PHONE}
                      </a>
                    </Typography>

                    <Typography
                      variant="body1"
                      gutterBottom
                      sx={{ mt: 2, fontSize: { xs: "15px", md: "16px" } }}
                    >
                      <strong>{t("province")}:</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "14px", md: "15px" } }}
                    >
                      {CHURCH_PROVINCE}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Google Maps Embed */}
              <Box
                sx={{
                  width: "100%",
                  height: { xs: 300, sm: 400, md: 450 },
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: 2,
                }}
              >
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    CHURCH_ADDRESS
                  )}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Church Location"
                />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
};
