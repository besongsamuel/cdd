import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MarkdownRenderer } from "../components/common/MarkdownRenderer";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { departmentJoinRequestsService } from "../services/departmentJoinRequestsService";
import { departmentMembersService } from "../services/departmentMembersService";
import { departmentsService } from "../services/departmentsService";
import { membersService } from "../services/membersService";
import { roleService } from "../services/roleService";
import type { Department, DepartmentMember, Member } from "../types";

export const DepartmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("departments");
  const navigate = useNavigate();
  const { user, currentMember, isAdmin } = useAuth();
  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isDepartmentLead, setIsDepartmentLead] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

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

  useEffect(() => {
    const checkLeadStatus = async () => {
      if (!currentMember || !id) {
        setIsDepartmentLead(false);
        return;
      }
      try {
        const isLead = await roleService.isDepartmentLead(id, currentMember.id);
        setIsDepartmentLead(isLead);
      } catch (error) {
        console.error("Error checking department lead status:", error);
        setIsDepartmentLead(false);
      }
    };

    checkLeadStatus();
  }, [currentMember, id]);

  const canAddMembers = isAdmin || isDepartmentLead;

  const handleJoinConfirm = async () => {
    if (!id || !department || !user || !currentMember) return;

    setSubmitting(true);
    setError(null);

    try {
      await departmentJoinRequestsService.create({
        department_id: id,
        member_name: currentMember.name,
        member_email: currentMember.email || undefined,
        member_phone: currentMember.phone || undefined,
      });
      setJoinDialogOpen(false);
      // Optionally show a success message or reload the page
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddMemberDialog = async () => {
    if (!canAddMembers) return;
    try {
      const allMembersData = await membersService.getAll();
      setAllMembers(allMembersData);
      setAddMemberDialogOpen(true);
    } catch (err) {
      console.error("Error loading members:", err);
      alert("Failed to load members");
    }
  };

  const handleAddMember = async (memberId: string) => {
    if (!id || !canAddMembers) return;
    setAddingMember(true);
    try {
      await departmentMembersService.addMember(id, memberId, false);
      // Reload members
      const deptMembers = await departmentMembersService.getByDepartment(id);
      setMembers(deptMembers);
      // Reload all members to update available list
      const allMembersData = await membersService.getAll();
      setAllMembers(allMembersData);
    } catch (err) {
      console.error("Error adding member:", err);
      alert(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const availableMembers = allMembers.filter(
    (m) => !members.some((dm) => dm.member_id === m.id)
  );

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
  const isMember = currentMember
    ? members.some((m) => m.member_id === currentMember.id)
    : false;
  const showJoinButton = !isMember;

  return (
    <>
      <SEO
        title={department.name}
        description={department.description || ""}
        url={`/departments/${department.id}`}
      />
      <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/departments")}
          sx={{
            mb: 4,
            color: "text.secondary",
            borderRadius: 2,
            px: 2,
            py: 1,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              backgroundColor: "rgba(30, 58, 138, 0.08)",
              color: "primary.main",
              transform: "translateX(-4px)",
            },
          }}
        >
          Back to Departments
        </Button>

        {/* Department Image */}
        {department.image_url && (
          <Box
            sx={{
              width: "100%",
              height: { xs: 250, sm: 350, md: 450 },
              mb: 5,
              borderRadius: 3,
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
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
            <Box
              component="img"
              src={department.image_url}
              alt={department.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "100px",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
                pointerEvents: "none",
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
            fontSize: { xs: "32px", md: "48px" },
            fontWeight: 700,
            mb: 3,
            background:
              "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
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
          {department.name}
        </Typography>

        {/* Content Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 4,
            mb: 4,
          }}
        >
          {/* Left: Mission/Description */}
          <Box
            sx={{
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
              variant="h5"
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
                  background:
                    "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                  borderRadius: 2,
                },
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
          </Box>

          {/* Right: Members */}
          <Box
            sx={{
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontSize: { xs: "24px", md: "32px" },
                  fontWeight: 700,
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
                    background:
                      "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                    borderRadius: 2,
                  },
                }}
              >
                {t("members")}
              </Typography>
              {canAddMembers && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddMemberDialog}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  Add Member
                </Button>
              )}
            </Box>

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
                      <Card
                        key={member.id}
                        sx={{
                          mb: 2,
                          p: 2.5,
                          background:
                            "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                          border: "1px solid rgba(30, 58, 138, 0.1)",
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: "0 4px 16px rgba(30, 58, 138, 0.12)",
                            transform: "translateX(4px)",
                            borderColor: "rgba(30, 58, 138, 0.2)",
                          },
                        }}
                      >
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
                      <Card
                        key={member.id}
                        sx={{
                          mb: 2,
                          p: 2.5,
                          background:
                            "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                          border: "1px solid rgba(0, 0, 0, 0.08)",
                          borderRadius: 2,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                            transform: "translateX(4px)",
                          },
                        }}
                      >
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
          </Box>
        </Box>

        {/* Join Button */}
        {showJoinButton && (
          <Box
            sx={{
              textAlign: "center",
              mt: 6,
              mb: 4,
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
            <Button
              variant="contained"
              size="large"
              onClick={() => setJoinDialogOpen(true)}
              disabled={!user}
              sx={{
                px: 5,
                py: 1.8,
                fontSize: { xs: "16px", md: "18px" },
                minHeight: "56px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                boxShadow: "0 4px 20px rgba(30, 58, 138, 0.3)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: user ? "translateY(-2px) scale(1.02)" : "none",
                  boxShadow: user
                    ? "0 8px 30px rgba(30, 58, 138, 0.4)"
                    : "0 4px 20px rgba(30, 58, 138, 0.3)",
                  background: user
                    ? "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)"
                    : "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                },
                "&:active": {
                  transform: user ? "translateY(0) scale(0.98)" : "none",
                },
              }}
            >
              {t("joinDepartment")}
            </Button>
            {!user && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t("loginRequired") || "Please log in to join this department"}
              </Typography>
            )}
          </Box>
        )}

        {/* Join Confirmation Dialog */}
        <Dialog
          open={joinDialogOpen}
          onClose={() => !submitting && setJoinDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{t("joinDepartment")}</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {currentMember && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {t("joinConfirmation") ||
                    "Are you sure you want to request to join this department?"}
                </Typography>
                <Box
                  sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    <strong>{t("form.name")}:</strong> {currentMember.name}
                  </Typography>
                  {currentMember.email && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      <strong>{t("form.email")}:</strong> {currentMember.email}
                    </Typography>
                  )}
                  {currentMember.phone && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>{t("form.phone")}:</strong> {currentMember.phone}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setJoinDialogOpen(false)}
              disabled={submitting}
            >
              {t("form.cancel")}
            </Button>
            <Button
              onClick={handleJoinConfirm}
              variant="contained"
              disabled={submitting || !user || !currentMember}
            >
              {submitting
                ? t("form.submitting")
                : t("form.confirm") || "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog
          open={addMemberDialogOpen}
          onClose={() => !addingMember && setAddMemberDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Member to Department</DialogTitle>
          <DialogContent>
            {availableMembers.length === 0 ? (
              <Typography color="text.secondary">
                All members are already in this department.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {availableMembers.map((member) => (
                  <Chip
                    key={member.id}
                    label={member.name}
                    onClick={() => handleAddMember(member.id)}
                    clickable
                    color="primary"
                    variant="outlined"
                    disabled={addingMember}
                    sx={{
                      justifyContent: "flex-start",
                      height: "auto",
                      py: 1.5,
                      "& .MuiChip-label": {
                        display: "block",
                        whiteSpace: "normal",
                      },
                    }}
                  />
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setAddMemberDialogOpen(false)}
              disabled={addingMember}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};
