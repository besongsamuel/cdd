import { Box, Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SEO } from "../components/SEO";
import { MarkdownRenderer } from "../components/common/MarkdownRenderer";

export const TermsAndConditionsPage = () => {
  const { t } = useTranslation("legal");

  return (
    <>
      <SEO
        title={t("termsAndConditions.title")}
        description={t("termsAndConditions.description")}
        url="/terms-and-conditions"
      />
      <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontSize: { xs: "32px", md: "40px" }, mb: 3 }}
        >
          {t("termsAndConditions.title")}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 4, fontSize: { xs: "14px", md: "15px" } }}
        >
          {t("termsAndConditions.lastUpdated")}:{" "}
          {new Date().toLocaleDateString()}
        </Typography>

        <Box sx={{ maxWidth: "800px", mx: "auto" }}>
          <MarkdownRenderer content={t("termsAndConditions.content")} />
        </Box>
      </Container>
    </>
  );
};



