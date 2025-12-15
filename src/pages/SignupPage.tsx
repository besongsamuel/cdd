import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Alert,
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import cddLogo from "../assets/cddLogo.png";
import { useAuth } from "../hooks/useAuth";

export const SignupPage = () => {
  const { t } = useTranslation(["common", "landing"]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUp(email, password, name);
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Benefits Section */}
          <Paper
            sx={{
              p: 4,
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              backgroundColor: "primary.main",
              color: "white",
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <Box
                component="img"
                src={cddLogo}
                alt="City of David Logo"
                sx={{
                  height: { xs: 80, md: 100 },
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </Box>

            {/* Welcome Text */}
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{ textAlign: "center", fontWeight: 600 }}
            >
              {t("welcomeTitle", { ns: "landing" })}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 4,
                opacity: 0.95,
                lineHeight: 1.7,
                textAlign: "center",
              }}
            >
              {t("welcomeMessage", { ns: "landing" })}
            </Typography>

            <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 2 }}>
              {t("signUpBenefitsTitle")}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
              {t("signUpBenefitsSubtitle")}
            </Typography>
            <List sx={{ pl: 0 }}>
              <ListItem sx={{ pl: 0, pb: 2 }}>
                <ListItemIcon sx={{ minWidth: 40, color: "white" }}>
                  <CheckCircleIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t("signUpBenefit1")}
                  primaryTypographyProps={{ color: "white" }}
                />
              </ListItem>
              <ListItem sx={{ pl: 0, pb: 2 }}>
                <ListItemIcon sx={{ minWidth: 40, color: "white" }}>
                  <CheckCircleIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t("signUpBenefit2")}
                  primaryTypographyProps={{ color: "white" }}
                />
              </ListItem>
              <ListItem sx={{ pl: 0, pb: 2 }}>
                <ListItemIcon sx={{ minWidth: 40, color: "white" }}>
                  <CheckCircleIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t("signUpBenefit3")}
                  primaryTypographyProps={{ color: "white" }}
                />
              </ListItem>
              <ListItem sx={{ pl: 0 }}>
                <ListItemIcon sx={{ minWidth: 40, color: "white" }}>
                  <CheckCircleIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t("signUpBenefit4")}
                  primaryTypographyProps={{ color: "white" }}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Signup Form */}
          <Paper sx={{ p: 4, width: "100%" }}>
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
              {t("signUpTitle")}
            </Typography>

            {/* Welcome Text for Mobile */}
            <Box sx={{ display: { xs: "block", md: "none" }, mb: 3, mt: 2 }}>
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                color="primary.main"
                textAlign="center"
                sx={{ fontWeight: 600 }}
              >
                {t("welcomeTitle", { ns: "landing" })}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", lineHeight: 1.6 }}
              >
                {t("welcomeMessage", { ns: "landing" })}
              </Typography>
            </Box>

            {/* Benefits Section for Mobile */}
            <Box sx={{ display: { xs: "block", md: "none" }, mb: 3, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom color="primary.main">
                {t("signUpBenefitsTitle")}
              </Typography>
              <List dense sx={{ py: 0 }}>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("signUpBenefit1")}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("signUpBenefit2")}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("signUpBenefit3")}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("signUpBenefit4")}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
              </List>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                margin="normal"
              />
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
                helperText="Must be at least 6 characters"
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
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Typography variant="body2">
                  Already have an account?{" "}
                  <Link to="/login" style={{ textDecoration: "none" }}>
                    Login
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
