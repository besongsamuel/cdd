import EmailIcon from "@mui/icons-material/Email";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabase";

export const EmailVerificationPage = () => {
  const { t } = useTranslation("common");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Supabase email verification redirects with hash fragments
    // Check for hash fragments in the URL
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // Remove the # and parse
    const type = params.get("type");
    const accessToken = params.get("access_token");

    // Also check query params (in case Supabase is configured to use query params)
    const queryType = searchParams.get("type");
    const queryTokenHash = searchParams.get("token_hash");

    if (
      (accessToken && type === "signup") ||
      (queryTokenHash && queryType === "signup")
    ) {
      // Email verification callback from Supabase
      setVerifying(true);

      if (accessToken) {
        // If we have an access_token in hash, Supabase has already verified
        // Just wait a moment and redirect
        setTimeout(() => {
          setVerified(true);
          setVerifying(false);
          // Clear the hash from URL
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
          // Redirect to login after showing success message
          setTimeout(() => {
            navigate("/login?verified=true");
          }, 2000);
        }, 500);
      } else if (queryTokenHash) {
        // Verify using token_hash
        supabase.auth
          .verifyOtp({
            token_hash: queryTokenHash,
            type: "signup",
          })
          .then(({ error }) => {
            if (error) {
              console.error("Email verification error:", error);
              setVerifying(false);
            } else {
              setVerified(true);
              setVerifying(false);
              setTimeout(() => {
                navigate("/login?verified=true");
              }, 2000);
            }
          });
      }
    }
  }, [searchParams, navigate]);

  // Check hash fragments
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const hashParams = hash ? new URLSearchParams(hash.substring(1)) : null;
  const type = hashParams?.get("type") || searchParams.get("type");
  const hasToken =
    (hashParams?.get("access_token") || searchParams.get("token_hash")) &&
    type === "signup";

  // If verifying or verified, show verification status
  if (hasToken) {
    if (verifying) {
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}
          >
            <Paper sx={{ p: 4, width: "100%", textAlign: "center" }}>
              <EmailIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                {t("verifyingEmail")}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t("verifyingEmailMessage")}
              </Typography>
            </Paper>
          </Box>
        </Container>
      );
    }

    if (verified) {
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}
          >
            <Paper sx={{ p: 4, width: "100%", textAlign: "center" }}>
              <EmailIcon sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                {t("emailVerifiedTitle")}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {t("emailVerifiedMessage")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t("redirectingToLogin")}
              </Typography>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                fullWidth
              >
                {t("goToLogin")}
              </Button>
            </Paper>
          </Box>
        </Container>
      );
    }
  }

  // Otherwise show the "check your email" message
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Paper sx={{ p: 4, width: "100%", textAlign: "center" }}>
          <EmailIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            {t("checkYourEmail")}
          </Typography>
          {email && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {t("verificationEmailSentTo")} <strong>{email}</strong>
            </Typography>
          )}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t("verificationEmailInstructions")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("didntReceiveEmail")}
          </Typography>
          <Button
            component={Link}
            to="/login"
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
          >
            {t("backToLogin")}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

