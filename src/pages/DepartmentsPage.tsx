import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { departmentMembersService } from "../services/departmentMembersService";
import { departmentsService } from "../services/departmentsService";
import type { Department } from "../types";

export const DepartmentsPage = () => {
  const { t } = useTranslation("departments");
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const activeDepartments = await departmentsService.getActive();
        setDepartments(activeDepartments);

        // Load member counts for each department
        const counts: Record<string, number> = {};
        for (const dept of activeDepartments) {
          const members = await departmentMembersService.getByDepartment(
            dept.id
          );
          counts[dept.id] = members.length;
        }
        setMemberCounts(counts);
      } catch (error) {
        console.error("Error loading departments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  if (loading) {
    return (
      <>
        <SEO
          title={t("title")}
          description={t("subtitle")}
          url="/departments"
        />
        <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
          <LoadingSpinner />
        </Container>
      </>
    );
  }

  return (
    <>
      <SEO title={t("title")} description={t("subtitle")} url="/departments" />
      <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          textAlign="center"
          sx={{ fontSize: { xs: "32px", md: "40px" }, mb: 2 }}
        >
          {t("title")}
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 4, fontSize: { xs: "16px", md: "17px" } }}
        >
          {t("subtitle")}
        </Typography>

        {departments.length === 0 ? (
          <Typography color="text.secondary" textAlign="center">
            {t("noDepartments")}
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {departments.map((department) => (
              <Grid item xs={12} sm={6} md={4} key={department.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/departments/${department.id}`)}
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                    }}
                  >
                    {department.image_url ? (
                      <CardMedia
                        component="img"
                        image={department.image_url}
                        alt={department.name}
                        sx={{
                          height: { xs: 200, sm: 220 },
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: { xs: 200, sm: 220 },
                          backgroundColor: "primary.main",
                          opacity: 0.1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            color: "primary.main",
                            fontWeight: 600,
                            opacity: 0.5,
                          }}
                        >
                          {department.name.charAt(0)}
                        </Typography>
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h5"
                        component="h2"
                        gutterBottom
                        sx={{
                          fontSize: { xs: "20px", md: "22px" },
                          fontWeight: 600,
                        }}
                      >
                        {department.name}
                      </Typography>
                      {department.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontSize: { xs: "14px", md: "15px" },
                          }}
                        >
                          {department.description
                            .replace(/#{1,6}\s+/g, "")
                            .replace(/\*\*/g, "")
                            .substring(0, 150)}
                          {department.description.length > 150 ? "..." : ""}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        color="primary.main"
                        sx={{ fontWeight: 500 }}
                      >
                        {t("memberCount", {
                          count: memberCounts[department.id] || 0,
                        })}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
};
