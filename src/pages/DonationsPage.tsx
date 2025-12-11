import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "../components/SEO";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { budgetService } from "../services/budgetService";
import { donationCategoryService } from "../services/donationCategoryService";
import { donationsService } from "../services/donationsService";
import type { DonationCategory, YearlyBudget } from "../types";
import { DONATION_EMAIL } from "../utils/constants";

export const DonationsPage = () => {
  const { t } = useTranslation("donations");
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [budgets, setBudgets] = useState<YearlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: "",
    donor_name: "",
    donor_email: "",
    category_id: "",
    notes: "",
  });

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, budgetsData] = await Promise.all([
          donationCategoryService.getActive(),
          budgetService.getByYear(currentYear),
        ]);
        setCategories(categoriesData);
        setBudgets(budgetsData);
      } catch (error) {
        console.error("Error loading donation data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError(t("form.amountRequired"));
      setSubmitting(false);
      return;
    }

    try {
      await donationsService.create({
        amount: parseFloat(formData.amount),
        donor_name: formData.donor_name || undefined,
        donor_email: formData.donor_email || undefined,
        category_id: formData.category_id || undefined,
        notes: formData.notes || undefined,
        etransfer_email: DONATION_EMAIL,
        status: "pending",
      });

      setSuccess(true);
      setFormData({
        amount: "",
        donor_name: "",
        donor_email: "",
        category_id: "",
        notes: "",
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategoryChange = (e: any) => {
    setFormData({
      ...formData,
      category_id: e.target.value,
    });
  };

  const getBudgetForCategory = (categoryId: string) => {
    return budgets.find((b) => b.category_id === categoryId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <SEO title={t("title")} description={t("subtitle")} url="/donations" />
      <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontSize: { xs: "32px", md: "40px" } }}
          >
            {t("title")}
          </Typography>
          <Typography
            variant="h6"
            component="p"
            color="text.secondary"
            sx={{
              fontSize: { xs: "17px", md: "19px" },
              maxWidth: "700px",
              mx: "auto",
              mb: 4,
            }}
          >
            {t("subtitle")}
          </Typography>

          {/* Donation Email Prominently Displayed */}
          <Paper
            sx={{
              p: { xs: 3, sm: 4 },
              backgroundColor: "primary.main",
              color: "white",
              maxWidth: "600px",
              mx: "auto",
            }}
          >
            <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
              {t("etransferInstructions")}
            </Typography>
            <Typography
              variant="h5"
              component="a"
              href={`mailto:${DONATION_EMAIL}`}
              sx={{
                color: "white",
                textDecoration: "none",
                fontWeight: 600,
                display: "block",
                wordBreak: "break-word",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              {DONATION_EMAIL}
            </Typography>
          </Paper>
        </Box>

        {/* Donation Form */}
        <Box sx={{ mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontSize: { xs: "24px", md: "32px" }, mb: 3 }}
          >
            {t("makeDonation")}
          </Typography>
          <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: "600px", mx: "auto" }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t("form.amount")}
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                margin="normal"
                inputProps={{ step: "0.01", min: "0.01" }}
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "16px", sm: "16px" },
                  },
                }}
              />
              <TextField
                fullWidth
                label={t("form.donorName")}
                name="donor_name"
                value={formData.donor_name}
                onChange={handleChange}
                margin="normal"
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "16px", sm: "16px" },
                  },
                }}
              />
              <TextField
                fullWidth
                label={t("form.donorEmail")}
                name="donor_email"
                type="email"
                value={formData.donor_email}
                onChange={handleChange}
                margin="normal"
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "16px", sm: "16px" },
                  },
                }}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>{t("form.category")}</InputLabel>
                <Select
                  value={formData.category_id}
                  onChange={handleCategoryChange}
                  label={t("form.category")}
                >
                  <MenuItem value="">{t("form.noCategory")}</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label={t("form.notes")}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={{ xs: 4, sm: 4 }}
                margin="normal"
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "16px", sm: "16px" },
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
                disabled={submitting}
              >
                {submitting ? t("form.submitting") : t("form.submit")}
              </Button>
            </form>
          </Paper>
        </Box>

        {/* Partners/Projects Section */}
        <Box>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontSize: { xs: "24px", md: "32px" }, mb: 4 }}
            textAlign="center"
          >
            {t("partnersProjects")}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {categories.map((category) => {
              const budget = getBudgetForCategory(category.id);
              const progress = budget
                ? (budget.allocated_amount / budget.target_amount) * 100
                : 0;

              return (
                <Card key={category.id}>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {category.name}
                    </Typography>
                    {category.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                        sx={{ mb: 2 }}
                      >
                        {category.description}
                      </Typography>
                    )}
                    {budget && (
                      <Box sx={{ mt: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {t("budgetProgress")} {currentYear}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            ${budget.allocated_amount.toLocaleString()} / $
                            {budget.target_amount.toLocaleString()}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(progress, 100)}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5, display: "block" }}
                        >
                          {progress.toFixed(1)}% {t("complete")}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      </Container>
    </>
  );
};
