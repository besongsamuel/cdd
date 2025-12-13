import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GavelIcon from "@mui/icons-material/Gavel";
import GroupsIcon from "@mui/icons-material/Groups";
import HomeIcon from "@mui/icons-material/Home";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  LinearProgress,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { financialTransparencyService } from "../services/financialTransparencyService";
import type { FinancialYear } from "../types";

export const FinancialTransparencyPage = () => {
  const { t } = useTranslation("financial");
  const [financialData, setFinancialData] = useState<FinancialYear | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        const data = await financialTransparencyService.getActive();
        setFinancialData(data);
      } catch (error) {
        console.error("Error loading financial data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFinancialData();
  }, []);

  if (loading) {
    return (
      <>
        <SEO
          title={t("title")}
          description={t("intro.paragraph1")}
          url="/financial-transparency"
        />
        <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
          <LoadingSpinner />
        </Container>
      </>
    );
  }

  // Default values if no data in database
  const breakdown = financialData?.budget_breakdown || {
    ministry_programs: 45,
    community_outreach: 20,
    staff_administration: 25,
    facilities_operations: 10,
  };

  const totalDonations = financialData?.total_donations || 125000;
  const totalExpenses = financialData?.total_expenses || 118000;
  const surplus = totalDonations - totalExpenses;
  const currentYear = financialData?.year || new Date().getFullYear();

  const breakdownItems = [
    {
      key: "ministry_programs",
      label: t("howFundsAreUsed.ministryPrograms"),
      description: t("howFundsAreUsed.ministryProgramsDesc"),
      icon: <GroupsIcon />,
      color: "#1e3a8a",
    },
    {
      key: "community_outreach",
      label: t("howFundsAreUsed.communityOutreach"),
      description: t("howFundsAreUsed.communityOutreachDesc"),
      icon: <LocalAtmIcon />,
      color: "#2563eb",
    },
    {
      key: "staff_administration",
      label: t("howFundsAreUsed.staffAdministration"),
      description: t("howFundsAreUsed.staffAdministrationDesc"),
      icon: <AccountBalanceIcon />,
      color: "#3b82f6",
    },
    {
      key: "facilities_operations",
      label: t("howFundsAreUsed.facilitiesOperations"),
      description: t("howFundsAreUsed.facilitiesOperationsDesc"),
      icon: <HomeIcon />,
      color: "#60a5fa",
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <SEO
        title={t("title")}
        description={t("intro.paragraph1")}
        url="/financial-transparency"
      />
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
            opacity: 0.05,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 1000"
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Financial chart-like elements */}
            <g transform="translate(200, 200)">
              <rect x="0" y="0" width="60" height="120" fill="#1e3a8a" opacity="0.3">
                <animate attributeName="height" values="120;150;120" dur="3s" repeatCount="indefinite" />
              </rect>
              <rect x="80" y="0" width="60" height="100" fill="#2563eb" opacity="0.3">
                <animate attributeName="height" values="100;130;100" dur="3.5s" repeatCount="indefinite" />
              </rect>
              <rect x="160" y="0" width="60" height="140" fill="#3b82f6" opacity="0.3">
                <animate attributeName="height" values="140;170;140" dur="4s" repeatCount="indefinite" />
              </rect>
            </g>
            {/* Dollar sign icons */}
            <g transform="translate(900, 300)">
              <circle cx="0" cy="0" r="40" fill="none" stroke="#2563eb" strokeWidth="2" opacity="0.2">
                <animate attributeName="r" values="40;50;40" dur="4s" repeatCount="indefinite" />
              </circle>
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fontSize="32"
                fill="#2563eb"
                opacity="0.2"
                fontWeight="bold"
              >
                $
              </text>
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
          {/* Page Title */}
          <Box
            sx={{
              textAlign: "center",
              mb: 6,
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 0.2s forwards",
              "@keyframes fadeInUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(30px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontSize: { xs: "32px", md: "48px" },
                fontWeight: 700,
                mb: 3,
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              {t("title")}
            </Typography>
          </Box>

          {/* Introduction Section */}
          <Box
            sx={{
              mb: 6,
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 0.4s forwards",
              "@keyframes fadeInUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(20px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Card
              sx={{
                p: { xs: 3, sm: 4 },
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                border: "1px solid rgba(30, 58, 138, 0.1)",
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{
                  fontSize: { xs: "24px", md: "32px" },
                  fontWeight: 700,
                  mb: 3,
                  color: "primary.main",
                }}
              >
                {t("intro.heading")}
              </Typography>
              <Typography
                variant="body1"
                paragraph
                sx={{
                  fontSize: { xs: "16px", md: "17px" },
                  lineHeight: 1.7,
                  color: "text.secondary",
                }}
              >
                {t("intro.paragraph1")}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: "16px", md: "17px" },
                  lineHeight: 1.7,
                  color: "text.secondary",
                }}
              >
                {t("intro.paragraph2")}
              </Typography>
            </Card>
          </Box>

          {/* How Funds Are Used Section */}
          <Box
            sx={{
              mb: 6,
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 0.6s forwards",
              "@keyframes fadeInUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(20px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{
                fontSize: { xs: "24px", md: "32px" },
                fontWeight: 700,
                mb: 2,
                color: "primary.main",
                position: "relative",
                display: "inline-block",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: -8,
                  left: 0,
                  width: "60px",
                  height: "4px",
                  background: "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                  borderRadius: 2,
                },
              }}
            >
              {t("howFundsAreUsed.heading")}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, fontSize: { xs: "16px", md: "17px" } }}
            >
              {t("howFundsAreUsed.description")}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 3,
                mb: 4,
              }}
            >
              {breakdownItems.map((item, index) => {
                const percentage =
                  breakdown[item.key as keyof typeof breakdown] || 0;
                return (
                  <Card
                    key={item.key}
                    sx={{
                      p: 3,
                      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                      border: "1px solid rgba(30, 58, 138, 0.1)",
                      borderRadius: 3,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(30, 58, 138, 0.12)",
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          color: item.color,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: { xs: "18px", md: "20px" },
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            color: item.color,
                            fontWeight: 700,
                          }}
                        >
                          {percentage}%
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        mb: 2,
                        backgroundColor: "rgba(30, 58, 138, 0.1)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: item.color,
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "14px", lineHeight: 1.6 }}
                    >
                      {item.description}
                    </Typography>
                  </Card>
                );
              })}
            </Box>
          </Box>

          {/* Annual Financial Snapshot Section */}
          <Box
            sx={{
              mb: 6,
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 0.8s forwards",
              "@keyframes fadeInUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(20px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{
                fontSize: { xs: "24px", md: "32px" },
                fontWeight: 700,
                mb: 3,
                color: "primary.main",
                position: "relative",
                display: "inline-block",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: -8,
                  left: 0,
                  width: "60px",
                  height: "4px",
                  background: "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                  borderRadius: 2,
                },
              }}
            >
              {t("annualSnapshot.heading")} ({currentYear})
            </Typography>

            <Paper
              sx={{
                p: { xs: 3, sm: 4 },
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                border: "1px solid rgba(30, 58, 138, 0.1)",
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell
                      sx={{
                        border: "none",
                        fontSize: { xs: "16px", md: "17px" },
                        fontWeight: 600,
                        color: "text.primary",
                      }}
                    >
                      {t("annualSnapshot.donationsReceived")}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        border: "none",
                        fontSize: { xs: "18px", md: "20px" },
                        fontWeight: 700,
                        color: "primary.main",
                      }}
                    >
                      {formatCurrency(totalDonations)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        border: "none",
                        fontSize: { xs: "16px", md: "17px" },
                        fontWeight: 600,
                        color: "text.primary",
                      }}
                    >
                      {t("annualSnapshot.totalExpenses")}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        border: "none",
                        fontSize: { xs: "18px", md: "20px" },
                        fontWeight: 700,
                        color: "text.primary",
                      }}
                    >
                      {formatCurrency(totalExpenses)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{
                        border: "none",
                        fontSize: { xs: "16px", md: "17px" },
                        fontWeight: 600,
                        color: "text.primary",
                        borderTop: "2px solid rgba(30, 58, 138, 0.1)",
                        pt: 2,
                      }}
                    >
                      {surplus >= 0
                        ? t("annualSnapshot.surplus")
                        : t("annualSnapshot.deficit")}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        border: "none",
                        borderTop: "2px solid rgba(30, 58, 138, 0.1)",
                        pt: 2,
                        fontSize: { xs: "18px", md: "20px" },
                        fontWeight: 700,
                        color: surplus >= 0 ? "success.main" : "error.main",
                      }}
                    >
                      {formatCurrency(Math.abs(surplus))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 3,
                  fontSize: "14px",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                }}
              >
                {t("annualSnapshot.reinvestment")}
              </Typography>
            </Paper>
          </Box>

          {/* Governance & Oversight Section */}
          <Box
            sx={{
              mb: 6,
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 1s forwards",
              "@keyframes fadeInUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(20px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{
                fontSize: { xs: "24px", md: "32px" },
                fontWeight: 700,
                mb: 2,
                color: "primary.main",
                position: "relative",
                display: "inline-block",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: -8,
                  left: 0,
                  width: "60px",
                  height: "4px",
                  background: "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                  borderRadius: 2,
                },
              }}
            >
              {t("governance.heading")}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, fontSize: { xs: "16px", md: "17px" } }}
            >
              {t("governance.description")}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 3,
              }}
            >
              <Card
                sx={{
                  p: 3,
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  border: "1px solid rgba(30, 58, 138, 0.1)",
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(30, 58, 138, 0.12)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <GavelIcon sx={{ color: "primary.main", fontSize: 32 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "18px", md: "20px" },
                      fontWeight: 600,
                    }}
                  >
                    {t("governance.budgetApproval")}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "14px", lineHeight: 1.6 }}
                >
                  {t("governance.budgetApprovalDesc")}
                </Typography>
              </Card>

              <Card
                sx={{
                  p: 3,
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  border: "1px solid rgba(30, 58, 138, 0.1)",
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(30, 58, 138, 0.12)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <AssessmentIcon sx={{ color: "primary.main", fontSize: 32 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "18px", md: "20px" },
                      fontWeight: 600,
                    }}
                  >
                    {t("governance.financeCommittee")}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "14px", lineHeight: 1.6 }}
                >
                  {t("governance.financeCommitteeDesc")}
                </Typography>
              </Card>

              <Card
                sx={{
                  p: 3,
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  border: "1px solid rgba(30, 58, 138, 0.1)",
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(30, 58, 138, 0.12)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <AccountBalanceIcon sx={{ color: "primary.main", fontSize: 32 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "18px", md: "20px" },
                      fontWeight: 600,
                    }}
                  >
                    {t("governance.externalReview")}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "14px", lineHeight: 1.6 }}
                >
                  {t("governance.externalReviewDesc")}
                </Typography>
              </Card>
            </Box>
          </Box>

          {/* Charitable Status Section */}
          <Box
            sx={{
              mb: 6,
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 1.2s forwards",
              "@keyframes fadeInUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(20px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Card
              sx={{
                p: { xs: 3, sm: 4 },
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                border: "1px solid rgba(30, 58, 138, 0.1)",
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Typography
                variant="h5"
                component="h2"
                gutterBottom
                sx={{
                  fontSize: { xs: "22px", md: "28px" },
                  fontWeight: 700,
                  mb: 2,
                  color: "primary.main",
                }}
              >
                {t("charitableStatus.heading")}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 2, fontSize: { xs: "16px", md: "17px" } }}
              >
                {t("charitableStatus.description")}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "16px", md: "17px" },
                  }}
                >
                  {t("charitableStatus.registrationNumber")}:
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "16px", md: "17px" } }}
                >
                  {/* TODO: Replace with actual CRA registration number */}
                  {t("charitableStatus.registrationPlaceholder")}
                </Typography>
              </Box>
            </Card>
          </Box>

          {/* Our Commitment Section */}
          <Box
            sx={{
              mb: 6,
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 1.4s forwards",
              "@keyframes fadeInUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(20px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Card
              sx={{
                p: { xs: 3, sm: 4 },
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                border: "1px solid rgba(30, 58, 138, 0.1)",
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Typography
                variant="h5"
                component="h2"
                gutterBottom
                sx={{
                  fontSize: { xs: "22px", md: "28px" },
                  fontWeight: 700,
                  mb: 3,
                  color: "primary.main",
                }}
              >
                {t("commitment.heading")}
              </Typography>
              <Typography
                variant="body1"
                paragraph
                sx={{
                  fontSize: { xs: "16px", md: "17px" },
                  lineHeight: 1.7,
                  color: "text.secondary",
                }}
              >
                {t("commitment.paragraph1")}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: "16px", md: "17px" },
                  lineHeight: 1.7,
                  color: "text.secondary",
                }}
              >
                {t("commitment.paragraph2")}
              </Typography>
            </Card>
          </Box>

          {/* Call to Action */}
          <Box
            sx={{
              textAlign: "center",
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 1.6s forwards",
              "@keyframes fadeInUp": {
                from: {
                  opacity: 0,
                  transform: "translateY(20px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
              <Button
                component={RouterLink}
                to="/donations"
                variant="contained"
                size="large"
                sx={{
                  px: 5,
                  py: 1.8,
                  fontSize: { xs: "16px", md: "17px" },
                  minHeight: "56px",
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                  boxShadow: "0 4px 20px rgba(30, 58, 138, 0.3)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "translateY(-2px) scale(1.02)",
                    boxShadow: "0 8px 30px rgba(30, 58, 138, 0.4)",
                    background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                  },
                  "&:active": {
                    transform: "translateY(0) scale(0.98)",
                  },
                }}
              >
                {t("cta.learnMore")}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
};

