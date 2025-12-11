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
      <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          textAlign="center"
          sx={{ fontSize: { xs: "32px", md: "40px" } }}
        >
          {t("title")}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 3, md: 4 },
            mt: { xs: 3, md: 4 },
          }}
        >
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" gutterBottom>
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

          <Card sx={{ height: "fit-content" }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontSize: { xs: "20px", md: "24px" } }}
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
        </Box>
      </Container>
    </>
  );
};
