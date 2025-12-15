import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import cddLogo from "../assets/cddLogo.png";
import { useAuth } from "../hooks/useAuth";

export const LoginPage = () => {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, user, currentMember, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if email was just verified
    const verified = searchParams.get("verified");
    if (verified === "true") {
      // Could show a success message here
    }

    // Redirect if already logged in
    if (!authLoading && user) {
      if (currentMember?.is_admin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, currentMember, authLoading, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      // Navigation will be handled by useEffect after member loads
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return null; // Or a loading spinner
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
            width: "100%",
          }}
        >
          {/* Welcome Section with Logo and Scripture */}
          <Paper
            sx={{
              p: 4,
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              backgroundColor: "primary.main",
              color: "white",
              justifyContent: "center",
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 4,
              }}
            >
              <Box
                component="img"
                src={cddLogo}
                alt="City of David Logo"
                sx={{
                  height: 100,
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </Box>

            {/* Scripture */}
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{ textAlign: "center", fontWeight: 600, mb: 3 }}
            >
              {t("loginScriptureTitle")}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                opacity: 0.95,
                lineHeight: 1.8,
                textAlign: "center",
                fontStyle: "italic",
                fontSize: "1.1rem",
              }}
            >
              {t("loginScripture")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                textAlign: "center",
                mt: 1,
              }}
            >
              {t("loginScriptureReference")}
            </Typography>
          </Paper>

          {/* Login Form */}
          <Paper sx={{ p: 4, width: "100%", position: "relative" }}>
            <IconButton
              component={Link}
              to="/"
              sx={{
                position: "absolute",
                top: 16,
                left: 16,
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
              aria-label="Back to home"
            >
              <ArrowBackIcon />
            </IconButton>

            {/* Logo for Mobile */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                justifyContent: "center",
                mb: 3,
              }}
            >
              <Box
                component="img"
                src={cddLogo}
                alt="City of David Logo"
                sx={{
                  height: 80,
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </Box>

            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              textAlign="center"
              sx={{ fontWeight: 600 }}
            >
              {t("loginTitle")}
            </Typography>

            {/* Scripture for Mobile */}
            <Box sx={{ display: { xs: "block", md: "none" }, mb: 3, mt: 2 }}>
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                color="primary.main"
                textAlign="center"
                sx={{ fontWeight: 600 }}
              >
                {t("loginScriptureTitle")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  textAlign: "center",
                  lineHeight: 1.7,
                  fontStyle: "italic",
                  mb: 1,
                }}
              >
                {t("loginScripture")}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: "center", display: "block" }}
              >
                {t("loginScriptureReference")}
              </Typography>
            </Box>
            {searchParams.get("verified") === "true" && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {t("emailVerifiedMessage")}
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                margin="normal"
              />
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Typography variant="body2">
                  Don't have an account?{" "}
                  <Link to="/signup" style={{ textDecoration: "none" }}>
                    Sign Up
                  </Link>
                </Typography>
              </Box>
            </form>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};
