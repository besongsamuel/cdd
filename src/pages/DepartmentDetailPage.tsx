import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MarkdownRenderer } from "../components/common/MarkdownRenderer";
import { SEO } from "../components/SEO";
import { departmentJoinRequestsService } from "../services/departmentJoinRequestsService";
import { departmentMembersService } from "../services/departmentMembersService";
import { departmentsService } from "../services/departmentsService";
import type { Department, DepartmentMember } from "../types";

export const DepartmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("departments");
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDepartment = async () => {
      if (!id) return;

      try {
        const [dept, deptMembers] = await Promise.all([
          departmentsService.getById(id),
          departmentMembersService.getByDepartment(id),
        ]);
        setDepartment(dept);
        setMembers(deptMembers);
      } catch (err) {
        console.error("Error loading department:", err);
        navigate("/departments");
      } finally {
        setLoading(false);
      }
    };

    loadDepartment();
  }, [id, navigate]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !department) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError(t("form.nameRequired"));
      setSubmitting(false);
      return;
    }

    try {
      await departmentJoinRequestsService.create({
        department_id: id,
        member_name: formData.name,
        member_email: formData.email || undefined,
        member_phone: formData.phone || undefined,
      });
      setSuccess(true);
      setFormData({ name: "", email: "", phone: "" });
      setTimeout(() => {
        setJoinDialogOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <SEO
          title={department?.name || t("title")}
          description={department?.description || ""}
          url={`/departments/${id}`}
        />
        <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
          <LoadingSpinner />
        </Container>
      </>
    );
  }

  if (!department) {
    return null;
  }

  const leads = members.filter((m) => m.is_lead);
  const regularMembers = members.filter((m) => !m.is_lead);

  return (
    <>
      <SEO
        title={department.name}
        description={department.description || ""}
        url={`/departments/${department.id}`}
      />
      <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        {/* Department Image */}
        {department.image_url && (
          <Box
            sx={{
              width: "100%",
              height: { xs: 250, sm: 350, md: 400 },
              mb: 4,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src={department.image_url}
              alt={department.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Box>
        )}

        {/* Department Name */}
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontSize: { xs: "32px", md: "40px" },
            fontWeight: 600,
            mb: 3,
          }}
        >
          {department.name}
        </Typography>

        {/* Content Grid */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* Left: Mission/Description */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                fontSize: { xs: "24px", md: "28px" },
                fontWeight: 600,
                mb: 2,
              }}
            >
              {t("mission")}
            </Typography>
            {department.description ? (
              <MarkdownRenderer content={department.description} />
            ) : (
              <Typography color="text.secondary">
                {t("noDescription")}
              </Typography>
            )}
          </Grid>

          {/* Right: Members */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                fontSize: { xs: "24px", md: "28px" },
                fontWeight: 600,
                mb: 2,
              }}
            >
              {t("members")}
            </Typography>

            {members.length === 0 ? (
              <Typography color="text.secondary">{t("noMembers")}</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {leads.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="primary.main"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      {t("departmentLeads")}
                    </Typography>
                    {leads.map((member) => (
                      <Card key={member.id} sx={{ mb: 1, p: 2 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            src={member.member_picture_url}
                            alt={member.member_name}
                            sx={{ width: 48, height: 48 }}
                          >
                            {member.member_name?.charAt(0) || "?"}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" fontWeight={500}>
                              {member.member_name}
                            </Typography>
                            {(member.member_email || member.member_phone) && (
                              <Box
                                sx={{
                                  mt: 0.5,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.25,
                                }}
                              >
                                {member.member_email && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {member.member_email}
                                  </Typography>
                                )}
                                {member.member_phone && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {member.member_phone}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}

                {regularMembers.length > 0 && (
                  <Box>
                    {leads.length > 0 && (
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ fontWeight: 500, mb: 1 }}
                      >
                        {t("otherMembers")}
                      </Typography>
                    )}
                    {regularMembers.map((member) => (
                      <Card key={member.id} sx={{ mb: 1, p: 2 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            src={member.member_picture_url}
                            alt={member.member_name}
                            sx={{ width: 48, height: 48 }}
                          >
                            {member.member_name?.charAt(0) || "?"}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1">
                              {member.member_name}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Join Button */}
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => setJoinDialogOpen(true)}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: { xs: "16px", md: "17px" },
              minHeight: "48px",
            }}
          >
            {t("joinDepartment")}
          </Button>
        </Box>

        {/* Join Dialog */}
        <Dialog
          open={joinDialogOpen}
          onClose={() => setJoinDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={handleJoinSubmit}>
            <DialogTitle>{t("joinDepartment")}</DialogTitle>
            <DialogContent>
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {t("requestSubmitted")}
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <TextField
                fullWidth
                label={t("form.name")}
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                margin="normal"
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "16px", sm: "16px" },
                  },
                }}
              />
              <TextField
                fullWidth
                label={t("form.email")}
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                margin="normal"
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "16px", sm: "16px" },
                  },
                }}
              />
              <TextField
                fullWidth
                label={t("form.phone")}
                name="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                margin="normal"
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "16px", sm: "16px" },
                  },
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setJoinDialogOpen(false)}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? t("form.submitting") : t("form.submit")}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </>
  );
};
