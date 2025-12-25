import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
// import { useHasPermission } from "../hooks/usePermissions"; // Reserved for future use
import { requestsService } from "../services/requestsService";
import type { RequestType } from "../types";

export const RequestsPage = () => {
  const { t } = useTranslation("requests");
  const navigate = useNavigate();
  const { user, currentMember } = useAuth();
  // const canModerateRequests = useHasPermission("moderate:requests"); // Reserved for future use
  const [formData, setFormData] = useState({
    type: "prayer" as RequestType,
    name: "",
    email: "",
    phone: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form with member info when authenticated
  useEffect(() => {
    if (currentMember) {
      setFormData((prev) => ({
        ...prev,
        name: currentMember.name || "",
        email: currentMember.email || "",
        phone: currentMember.phone || "",
      }));
    }
  }, [currentMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError(
        t("form.loginRequired") || "You must be logged in to submit a request"
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    // Basic validation
    if (!formData.content.trim()) {
      setError(t("form.error"));
      setLoading(false);
      return;
    }

    // Email validation if provided
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError(t("form.error"));
        setLoading(false);
        return;
      }
    }

    try {
      await requestsService.create(formData);
      setSuccess(true);
      setFormData({
        type: "prayer",
        name: currentMember?.name || "",
        email: currentMember?.email || "",
        phone: currentMember?.phone || "",
        content: "",
      });
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

  const handleTypeChange = (e: any) => {
    setFormData({
      ...formData,
      type: e.target.value as RequestType,
    });
  };

  return (
    <>
      <SEO title={t("title")} description={t("subtitle")} url="/requests" />
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
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 4, fontSize: { xs: "15px", md: "16px" } }}
        >
          {t("subtitle")}
        </Typography>

        <Box sx={{ maxWidth: "600px", mx: "auto" }}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            {!user && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t("form.loginRequiredMessage") ||
                    "You need to be logged in to submit a request."}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate("/login")}
                  >
                    {t("form.login") || "Log In"}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate("/signup")}
                  >
                    {t("form.signup") || "Sign Up"}
                  </Button>
                </Box>
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <FormControl
                fullWidth
                margin="normal"
                required
                disabled={!user}
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "16px", sm: "16px" }, // Prevents zoom on iOS
                  },
                }}
              >
                <InputLabel>{t("form.type")}</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleTypeChange}
                  label={t("form.type")}
                  disabled={!user}
                >
                  <MenuItem value="prayer">{t("form.prayer")}</MenuItem>
                  <MenuItem value="support">{t("form.support")}</MenuItem>
                  <MenuItem value="testimony">{t("form.testimony")}</MenuItem>
                </Select>
              </FormControl>

              {user && currentMember && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {`Submitting as ${currentMember.name}${
                      currentMember.email ? ` (${currentMember.email})` : ""
                    }`}
                  </Typography>
                </Alert>
              )}
              <TextField
                fullWidth
                label={t("form.name")}
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                disabled={!user}
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
                margin="normal"
                disabled={!user}
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "16px", sm: "16px" }, // Prevents zoom on iOS
                  },
                }}
              />
              <TextField
                fullWidth
                label={t("form.phone")}
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                margin="normal"
                disabled={!user}
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "16px", sm: "16px" }, // Prevents zoom on iOS
                  },
                }}
              />
              <TextField
                fullWidth
                label={t("form.message")}
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                multiline
                rows={6}
                margin="normal"
                disabled={!user}
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
                disabled={loading || !user}
              >
                {loading ? t("form.submitting") : t("form.submit")}
              </Button>
            </form>
          </Paper>
        </Box>
      </Container>
    </>
  );
};
