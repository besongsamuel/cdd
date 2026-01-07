import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { donationsService } from "../services/donationsService";
import type { Donation } from "../types";
import {
    calculateTaxCredit,
    effectiveDonationPercent,
    getTaxCreditByCategory,
} from "../utils/taxCreditCalculator";

export const DonationHistory = () => {
  const { t } = useTranslation("donations");
  const { currentMember } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedDonations, setGroupedDonations] = useState<
    Record<string, Donation[]>
  >({});

  const currentYear = new Date().getFullYear();
  const highIncome = false; // Set to true for top bracket rates

  useEffect(() => {
    if (currentMember?.id) {
      loadDonations();
    }
  }, [currentMember?.id]);

  const loadDonations = async () => {
    if (!currentMember?.id) return;

    try {
      setLoading(true);
      const data = await donationsService.getByMemberId(currentMember.id);
      setDonations(data);

      // Group by category
      const grouped = await donationsService.getByMemberIdGroupedByCategory(
        currentMember.id
      );
      setGroupedDonations(grouped);
    } catch (error) {
      console.error("Error loading donations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  const yearDonations = donations.filter((donation) => {
    const donationYear = new Date(donation.created_at).getFullYear();
    return donationYear === currentYear;
  });

  const totalDonated = donations.reduce(
    (sum, d) => sum + Number(d.amount),
    0
  );
  const yearTotal = yearDonations.reduce(
    (sum, d) => sum + Number(d.amount),
    0
  );
  const estimatedTaxCredit = calculateTaxCredit(
    donations,
    currentYear,
    highIncome
  );
  const taxCreditByCategory = getTaxCreditByCategory(
    donations,
    currentYear,
    highIncome
  );
  
  // Calculate effective percentage for display
  const effectivePercent = yearTotal > 0 
    ? effectiveDonationPercent(yearTotal, highIncome) 
    : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t("donationHistory") || "Donation History"}
      </Typography>

      {/* Quebec Residents Note */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Tax credit calculations are estimates and only applicable for Canadians residing in Quebec. 
          The calculation uses a two-tier system: first $200 at 35% (15% federal + 20% Quebec), 
          and amounts above $200 at 53% (29% federal + 24% Quebec) or higher rates for top income brackets.
        </Typography>
      </Alert>

      {/* Summary Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Donated (All Time)
            </Typography>
            <Typography variant="h4">
              ${totalDonated.toLocaleString("en-CA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              {currentYear} Donations
            </Typography>
            <Typography variant="h4">
              ${yearTotal.toLocaleString("en-CA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Estimated Tax Credit ({currentYear})
            </Typography>
            <Typography variant="h4" color="success.main">
              ${estimatedTaxCredit.toLocaleString("en-CA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ~{(effectivePercent * 100).toFixed(1)}% of {currentYear} donations
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {highIncome ? "Using top bracket rates" : "Using standard rates"}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tax Credit by Category */}
      {Object.keys(taxCreditByCategory).length > 0 && (
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Estimated Tax Credit by Category ({currentYear})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {Object.entries(taxCreditByCategory).map(([category, amount]) => (
              <Chip
                key={category}
                label={`${category}: $${amount.toLocaleString("en-CA", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                color="success"
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Donations by Category */}
      {Object.keys(groupedDonations).length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Donations by Category
          </Typography>
          {Object.entries(groupedDonations).map(([category, categoryDonations]) => {
            const categoryTotal = categoryDonations.reduce(
              (sum, d) => sum + Number(d.amount),
              0
            );
            return (
              <Card key={category} sx={{ mb: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">{category}</Typography>
                    <Typography variant="h6">
                      ${categoryTotal.toLocaleString("en-CA", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {categoryDonations.length} donation
                    {categoryDonations.length !== 1 ? "s" : ""}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* All Donations Table */}
      <Typography variant="h6" gutterBottom>
        All Donations
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {donations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No donations found
                </TableCell>
              </TableRow>
            ) : (
              donations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>
                    {new Date(donation.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    ${Number(donation.amount).toLocaleString("en-CA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    {donation.category_name || "Unspecified"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={donation.payment_method === "stripe" ? "Stripe" : "E-transfer"}
                      size="small"
                      color={donation.payment_method === "stripe" ? "primary" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={donation.status}
                      size="small"
                      color={
                        donation.status === "paid"
                          ? "success"
                          : donation.status === "verified"
                          ? "info"
                          : "default"
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

