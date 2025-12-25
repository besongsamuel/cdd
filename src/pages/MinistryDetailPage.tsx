import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
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
  IconButton,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MarkdownRenderer } from "../components/common/MarkdownRenderer";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { useHasPermission } from "../hooks/usePermissions";
import { membersService } from "../services/membersService";
import { ministriesService } from "../services/ministriesService";
import { ministryJoinRequestsService } from "../services/ministryJoinRequestsService";
import { ministryMembersService } from "../services/ministryMembersService";
import { roleService } from "../services/roleService";
import type { Member, Ministry, MinistryMember } from "../types";

export const MinistryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("ministries");
  const navigate = useNavigate();
  const { user, currentMember } = useAuth();
  const canManageMinistries = useHasPermission("manage:ministries");
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [members, setMembers] = useState<MinistryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isMinistryLead, setIsMinistryLead] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    const loadMinistry = async () => {
      if (!id) return;

      try {
        const [min, minMembers] = await Promise.all([
          ministriesService.getById(id),
          ministryMembersService.getByMinistry(id),
        ]);
        setMinistry(min);
        setMembers(minMembers);
      } catch (err) {
        console.error("Error loading ministry:", err);
        navigate("/ministries");
      } finally {
        setLoading(false);
      }
    };

    loadMinistry();
  }, [id, navigate]);

  useEffect(() => {
    const checkLeadStatus = async () => {
      if (!currentMember || !id) {
        setIsMinistryLead(false);
        return;
      }
      try {
        const isLead = await roleService.isMinistryLead(id, currentMember.id);
        setIsMinistryLead(isLead);
      } catch (error) {
        console.error("Error checking ministry lead status:", error);
        setIsMinistryLead(false);
      }
    };

    checkLeadStatus();
  }, [currentMember, id]);

  const canAddMembers = canManageMinistries || isMinistryLead;

  const handleJoinConfirm = async () => {
    if (!id || !ministry || !user || !currentMember) return;

    setSubmitting(true);
    setError(null);

    try {
      await ministryJoinRequestsService.create({
        ministry_id: id,
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
      await ministryMembersService.addMember(id, memberId, false);
      // Reload members
      const minMembers = await ministryMembersService.getByMinistry(id);
      setMembers(minMembers);
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

  const handleRemoveMember = async (memberId: string) => {
    if (!id || !canAddMembers) return;
    if (!window.confirm("Are you sure you want to remove this member from the ministry?")) {
      return;
    }
    try {
      await ministryMembersService.removeMember(id, memberId);
      // Reload members
      const minMembers = await ministryMembersService.getByMinistry(id);
      setMembers(minMembers);
      // Reload all members to update available list
      const allMembersData = await membersService.getAll();
      setAllMembers(allMembersData);
    } catch (err) {
      console.error("Error removing member:", err);
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const availableMembers = allMembers.filter(
    (m) => !members.some((mm) => mm.member_id === m.id)
  );

  if (loading) {
    return (
      <>
        <SEO
          title={ministry?.name || t("title")}
          description={ministry?.description || ""}
          url={`/ministries/${id}`}
        />
        <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
          <LoadingSpinner />
        </Container>
      </>
    );
  }

  if (!ministry) {
    return null;
  }

  const leads = members.filter((m) => m.is_lead);
  const regularMembers = members.filter((m) => !m.is_lead);
  const details = ministry.details;
  const isMember = currentMember
    ? members.some((m) => m.member_id === currentMember.id)
    : false;
  const showJoinButton = !isMember;

  return (
    <>
      <SEO
        title={ministry.name}
        description={ministry.description || ""}
        url={`/ministries/${ministry.id}`}
      />
      <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/ministries")}
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
          Back to Ministries
        </Button>

        {/* Ministry Image */}
        {ministry.image_url && (
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
              src={ministry.image_url}
              alt={ministry.name}
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

        {/* Ministry Name */}
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
          {ministry.name}
        </Typography>

        {/* Overview Section */}
        <Box
          sx={{
            mb: 5,
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
                background: "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
                borderRadius: 2,
              },
            }}
          >
            {t("overview")}
          </Typography>
          {ministry.description ? (
            <MarkdownRenderer content={ministry.description} />
          ) : (
            <Typography color="text.secondary">{t("noDescription")}</Typography>
          )}
        </Box>

        {/* Who Can Join Section */}
        {details?.who_can_join && (
          <Box
            sx={{
              mb: 5,
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
              {t("whoCanJoin")}
            </Typography>
            <Card
              sx={{
                p: 3,
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                border: "1px solid rgba(30, 58, 138, 0.1)",
                borderRadius: 3,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(30, 58, 138, 0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {(details.who_can_join.age_range_min ||
                  details.who_can_join.age_range_max) && (
                  <Box>
                    <Typography variant="body1" fontWeight={500} gutterBottom>
                      {t("ageRange", {
                        min: details.who_can_join.age_range_min || "",
                        max:
                          details.who_can_join.age_range_max === null
                            ? t("ageRangeMax")
                            : details.who_can_join.age_range_max
                              ? `-${details.who_can_join.age_range_max}`
                              : "",
                      })}
                    </Typography>
                  </Box>
                )}
                {details.who_can_join.gender && (
                  <Box>
                    <Typography variant="body1" fontWeight={500} gutterBottom>
                      {details.who_can_join.gender === "mixed"
                        ? t("genderMixed")
                        : details.who_can_join.gender === "male"
                          ? t("genderMale")
                          : t("genderFemale")}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    {details.who_can_join.open_to_visitors
                      ? t("openToVisitors")
                      : t("membersOnly")}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        )}

        {/* Meeting Details Section */}
        {details &&
          (details.meeting_day ||
            details.meeting_time ||
            details.meeting_location ||
            details.meeting_frequency) && (
            <Box
              sx={{
                mb: 5,
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
                {t("meetingDetails")}
              </Typography>
              <Card
                sx={{
                  p: 3,
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  border: "1px solid rgba(30, 58, 138, 0.1)",
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(30, 58, 138, 0.12)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {details.meeting_day && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarTodayIcon color="primary" />
                      <Typography variant="body1">
                        {details.meeting_day}
                      </Typography>
                    </Box>
                  )}
                  {details.meeting_time && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AccessTimeIcon color="primary" />
                      <Typography variant="body1">
                        {details.meeting_time}
                      </Typography>
                    </Box>
                  )}
                  {details.meeting_location && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOnIcon color="primary" />
                      <Typography variant="body1">
                        {details.meeting_location}
                      </Typography>
                    </Box>
                  )}
                  {details.meeting_frequency && (
                    <Typography variant="body2" color="text.secondary">
                      Frequency: {details.meeting_frequency}
                    </Typography>
                  )}
                </Box>
              </Card>
            </Box>
          )}

        {/* Activities & Programs Section */}
        {details?.activities && details.activities.length > 0 && (
          <Box
            sx={{
              mb: 5,
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
              {t("activities")}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {details.activities.map((activity, index) => (
                <Chip
                  key={index}
                  label={activity}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Leadership Section */}
        <Box
          sx={{
            mb: 5,
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
              {t("leadership")}
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
                    {t("ministryLeads")}
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
                        {canAddMembers && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveMember(member.member_id)}
                            sx={{ color: "error.main" }}
                            title="Remove member"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
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
                        {canAddMembers && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveMember(member.member_id)}
                            sx={{ color: "error.main" }}
                            title="Remove member"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* How to Get Involved Section */}
        {showJoinButton && (
          <Box
            sx={{
              textAlign: "center",
              mt: 6,
              mb: 4,
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
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                fontSize: { xs: "24px", md: "32px" },
                fontWeight: 700,
                mb: 3,
                background:
                  "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("getInvolved")}
            </Typography>
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
              {t("joinMinistry")}
            </Button>
            {!user && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t("loginRequired") || "Please log in to join this ministry"}
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
          <DialogTitle>{t("joinMinistry")}</DialogTitle>
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
                    "Are you sure you want to request to join this ministry?"}
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
          <DialogTitle>Add Member to Ministry</DialogTitle>
          <DialogContent>
            {availableMembers.length === 0 ? (
              <Typography color="text.secondary">
                All members are already in this ministry.
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
