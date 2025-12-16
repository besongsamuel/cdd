import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Validation helpers
  const isValidEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const isFormValid = (): boolean => {
    return (
      email.trim() !== "" &&
      isValidEmail(email) &&
      password !== "" &&
      confirmPassword !== "" &&
      password === confirmPassword &&
      password.length >= 6
    );
  };

  const getValidationError = (): string | null => {
    if (!email.trim()) {
      return "Email is required";
    }
    if (!isValidEmail(email)) {
      return "Please enter a valid email address";
    }
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      return "Please confirm your password";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    if (!acceptTerms) {
      return "You must accept the terms and conditions to continue";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signUp(email, password);
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        width: "100%",
        px: 0,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" },
          gap: 3,
          width: "100%",
          maxWidth: "1200px",
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
          {/* Bible Verse */}
          <Box
            sx={{
              mt: 3,
              mb: 3,
              p: 2,
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 2,
              borderLeft: "4px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontStyle: "italic",
                mb: 1,
                opacity: 0.95,
                lineHeight: 1.8,
              }}
            >
              {t("signUpBibleVerse", { ns: "common" })}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                textAlign: "right",
                opacity: 0.85,
                mt: 1,
              }}
            >
              {t("signUpBibleVerseReference", { ns: "common" })}
            </Typography>
          </Box>
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
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              required
              margin="normal"
              autoComplete="email"
              error={email.trim() !== "" && !isValidEmail(email) ? true : false}
              helperText={
                email.trim() !== "" && !isValidEmail(email)
                  ? "Please enter a valid email address"
                  : ""
              }
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              required
              margin="normal"
              autoComplete="new-password"
              helperText="Must be at least 6 characters"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
              required
              margin="normal"
              autoComplete="new-password"
              error={
                confirmPassword !== "" &&
                password !== "" &&
                password !== confirmPassword
                  ? true
                  : false
              }
              helperText={
                confirmPassword !== "" &&
                password !== "" &&
                password !== confirmPassword
                  ? "Passwords do not match"
                  : ""
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (error) setError(null);
                  }}
                  required
                />
              }
              label={
                <Typography variant="body2">
                  I accept the{" "}
                  <Link
                    to="/terms-and-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    Terms and Conditions
                  </Link>
                </Typography>
              }
              sx={{ mt: 2 }}
            />
            {(error || getValidationError()) && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error || getValidationError()}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3 }}
              disabled={loading || !isFormValid() || !acceptTerms}
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
  );
};
