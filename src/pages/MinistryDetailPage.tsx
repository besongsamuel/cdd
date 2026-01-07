import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import StarIcon from "@mui/icons-material/Star";
import {
  alpha,
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
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ImageUpload } from "../components/common/ImageUpload";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { MarkdownRenderer } from "../components/common/MarkdownRenderer";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { useHasPermission } from "../hooks/usePermissions";
import { membersService } from "../services/membersService";
import { ministriesService } from "../services/ministriesService";
import { ministryJoinRequestsService } from "../services/ministryJoinRequestsService";
import { ministryMembersService } from "../services/ministryMembersService";
import { outreachEventsService } from "../services/outreachEventsService";
import { outreachGalleryService } from "../services/outreachGalleryService";
import { roleService } from "../services/roleService";
import type {
  Member,
  Ministry,
  MinistryMember,
  OutreachEvent,
  OutreachGalleryPhoto,
} from "../types";

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
  const [outreachEvents, setOutreachEvents] = useState<OutreachEvent[]>([]);
  const [outreachGalleryPhotos, setOutreachGalleryPhotos] = useState<
    Record<string, OutreachGalleryPhoto[]>
  >({});
  const [outreachEventDialogOpen, setOutreachEventDialogOpen] = useState(false);
  const [outreachGalleryDialogOpen, setOutreachGalleryDialogOpen] = useState(false);
  const [editingOutreachEvent, setEditingOutreachEvent] = useState<OutreachEvent | null>(null);
  const [selectedEventForGallery, setSelectedEventForGallery] = useState<string>("");
  const [outreachEventForm, setOutreachEventForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
  });
  const [outreachGalleryForm, setOutreachGalleryForm] = useState({
    image_url: "" as string | string[],
    caption: "",
    taken_at: "",
  });
  const [editingGalleryPhoto, setEditingGalleryPhoto] = useState<OutreachGalleryPhoto | null>(null);
  const [galleryViewerOpen, setGalleryViewerOpen] = useState(false);
  const [selectedEventForViewer, setSelectedEventForViewer] = useState<string>("");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const loadMinistry = async () => {
      if (!id) return;

      try {
        const [min, minMembers, events] = await Promise.all([
          ministriesService.getById(id),
          ministryMembersService.getByMinistry(id),
          outreachEventsService.getByMinistry(id),
        ]);
        setMinistry(min);
        setMembers(minMembers);
        setOutreachEvents(events);
        
        // Load gallery photos for each event
        const photosByEvent: Record<string, OutreachGalleryPhoto[]> = {};
        for (const event of events) {
          const photos = await outreachGalleryService.getByEvent(event.id);
          photosByEvent[event.id] = photos;
        }
        setOutreachGalleryPhotos(photosByEvent);
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
  const canManageOutreach = canManageMinistries || isMinistryLead;

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

  const handleOpenOutreachEventDialog = (event?: OutreachEvent) => {
    if (!canManageOutreach) return;
    setEditingOutreachEvent(event || null);
    if (event) {
      setOutreachEventForm({
        title: event.title,
        description: event.description || "",
        event_date: event.event_date,
        event_time: event.event_time || "",
        location: event.location || "",
      });
    } else {
      setOutreachEventForm({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        location: "",
      });
    }
    setOutreachEventDialogOpen(true);
  };

  const handleCloseOutreachEventDialog = () => {
    setOutreachEventDialogOpen(false);
    setEditingOutreachEvent(null);
  };

  const handleSaveOutreachEvent = async () => {
    if (!id || !canManageOutreach) return;
    try {
      const eventData = {
        ministry_id: id,
        title: outreachEventForm.title,
        description: outreachEventForm.description || undefined,
        event_date: outreachEventForm.event_date,
        event_time: outreachEventForm.event_time || undefined,
        location: outreachEventForm.location || undefined,
      };
      if (editingOutreachEvent) {
        await outreachEventsService.update(editingOutreachEvent.id, eventData);
      } else {
        await outreachEventsService.create(eventData);
      }
      handleCloseOutreachEventDialog();
      // Reload events and photos
      const events = await outreachEventsService.getByMinistry(id);
      setOutreachEvents(events);
      const photosByEvent: Record<string, OutreachGalleryPhoto[]> = {};
      for (const event of events) {
        const photos = await outreachGalleryService.getByEvent(event.id);
        photosByEvent[event.id] = photos;
      }
      setOutreachGalleryPhotos(photosByEvent);
    } catch (error) {
      console.error("Error saving outreach event:", error);
      alert(error instanceof Error ? error.message : "Error saving outreach event");
    }
  };

  const handleDeleteOutreachEvent = async (eventId: string) => {
    if (!canManageOutreach) return;
    if (!window.confirm("Are you sure you want to delete this outreach event? All associated photos will also be deleted.")) return;
    try {
      await outreachEventsService.delete(eventId);
      // Reload events and photos
      const events = await outreachEventsService.getByMinistry(id!);
      setOutreachEvents(events);
      const photosByEvent: Record<string, OutreachGalleryPhoto[]> = {};
      for (const event of events) {
        const photos = await outreachGalleryService.getByEvent(event.id);
        photosByEvent[event.id] = photos;
      }
      setOutreachGalleryPhotos(photosByEvent);
    } catch (error) {
      console.error("Error deleting outreach event:", error);
      alert(error instanceof Error ? error.message : "Error deleting outreach event");
    }
  };

  const handleOpenGalleryDialog = (eventId: string, photo?: OutreachGalleryPhoto) => {
    if (!canManageOutreach) return;
    setSelectedEventForGallery(eventId);
    setEditingGalleryPhoto(photo || null);
    if (photo) {
      setOutreachGalleryForm({
        image_url: photo.image_url,
        caption: photo.caption || "",
        taken_at: photo.taken_at ? new Date(photo.taken_at).toISOString().split("T")[0] : "",
      });
    } else {
      setOutreachGalleryForm({
        image_url: [],
        caption: "",
        taken_at: "",
      });
    }
    setOutreachGalleryDialogOpen(true);
  };

  const handleCloseGalleryDialog = () => {
    setOutreachGalleryDialogOpen(false);
    setEditingGalleryPhoto(null);
    setSelectedEventForGallery("");
  };

  const handleSaveGalleryPhoto = async () => {
    if (!selectedEventForGallery || !canManageOutreach) return;
    try {
      const photoData = {
        outreach_event_id: selectedEventForGallery,
        image_url: typeof outreachGalleryForm.image_url === "string" ? outreachGalleryForm.image_url : "",
        caption: outreachGalleryForm.caption || undefined,
        taken_at: outreachGalleryForm.taken_at || undefined,
      };
      if (editingGalleryPhoto) {
        await outreachGalleryService.update(editingGalleryPhoto.id, photoData);
      } else {
        await outreachGalleryService.create(photoData);
      }
      handleCloseGalleryDialog();
      // Reload photos for this event
      const photos = await outreachGalleryService.getByEvent(selectedEventForGallery);
      setOutreachGalleryPhotos((prev) => ({
        ...prev,
        [selectedEventForGallery]: photos,
      }));
    } catch (error) {
      console.error("Error saving gallery photo:", error);
      alert(error instanceof Error ? error.message : "Error saving gallery photo");
    }
  };

  const handleBulkUploadGallery = async (urls: string[]) => {
    if (!selectedEventForGallery || !canManageOutreach) return;
    try {
      const photos = urls.map((url) => ({
        outreach_event_id: selectedEventForGallery,
        image_url: url,
        caption: outreachGalleryForm.caption || undefined,
        taken_at: outreachGalleryForm.taken_at || undefined,
      }));
      await outreachGalleryService.createMultiple(photos);
      // Reload photos for this event
      const photosData = await outreachGalleryService.getByEvent(selectedEventForGallery);
      setOutreachGalleryPhotos((prev) => ({
        ...prev,
        [selectedEventForGallery]: photosData,
      }));
      alert(`Successfully uploaded ${urls.length} photos`);
    } catch (error) {
      console.error("Error bulk uploading photos:", error);
      alert("Failed to upload some photos");
    }
  };

  const handleDeleteGalleryPhoto = async (photoId: string, eventId: string) => {
    if (!canManageOutreach) return;
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      const isViewing = selectedEventForViewer === eventId;
      const currentIndex = isViewing ? currentPhotoIndex : 0;
      const photos = outreachGalleryPhotos[eventId] || [];
      const isLastPhoto = photos.length === 1;
      
      await outreachGalleryService.delete(photoId);
      
      // Reload photos for this event
      const updatedPhotos = await outreachGalleryService.getByEvent(eventId);
      setOutreachGalleryPhotos((prev) => ({
        ...prev,
        [eventId]: updatedPhotos,
      }));
      
      // If we're viewing this event's gallery, update the viewer
      if (isViewing) {
        if (updatedPhotos.length === 0) {
          // No photos left, close the viewer
          handleCloseGalleryViewer();
        } else {
          // Navigate to the next photo, or previous if we deleted the last one
          const newIndex = currentIndex >= updatedPhotos.length 
            ? updatedPhotos.length - 1 
            : currentIndex;
          setCurrentPhotoIndex(Math.max(0, newIndex));
        }
      }
    } catch (error) {
      console.error("Error deleting gallery photo:", error);
      alert(error instanceof Error ? error.message : "Error deleting gallery photo");
    }
  };

  const handleSetCoverPhoto = async (photoId: string, eventId: string) => {
    if (!canManageOutreach) return;
    try {
      await outreachGalleryService.setCoverPhoto(photoId, eventId);
      // Reload photos for this event
      const photos = await outreachGalleryService.getByEvent(eventId);
      setOutreachGalleryPhotos((prev) => ({
        ...prev,
        [eventId]: photos,
      }));
      // Update current photo index if viewing this event (cover photo will be first)
      if (selectedEventForViewer === eventId) {
        const coverIndex = photos.findIndex((p) => p.id === photoId);
        if (coverIndex !== -1) {
          setCurrentPhotoIndex(coverIndex);
        } else {
          // Cover photo should be first, so set index to 0
          setCurrentPhotoIndex(0);
        }
      }
    } catch (error) {
      console.error("Error setting cover photo:", error);
      alert(error instanceof Error ? error.message : "Error setting cover photo");
    }
  };

  const handleOpenGalleryViewer = (eventId: string, photoIndex: number = 0) => {
    setSelectedEventForViewer(eventId);
    setCurrentPhotoIndex(photoIndex);
    setGalleryViewerOpen(true);
  };

  const handleCloseGalleryViewer = () => {
    setGalleryViewerOpen(false);
    setSelectedEventForViewer("");
    setCurrentPhotoIndex(0);
  };

  const handlePreviousPhoto = () => {
    const photos = outreachGalleryPhotos[selectedEventForViewer] || [];
    if (photos.length > 1) {
      const newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : photos.length - 1;
      setCurrentPhotoIndex(newIndex);
    }
  };

  const handleNextPhoto = () => {
    const photos = outreachGalleryPhotos[selectedEventForViewer] || [];
    if (photos.length > 1) {
      const newIndex = currentPhotoIndex < photos.length - 1 ? currentPhotoIndex + 1 : 0;
      setCurrentPhotoIndex(newIndex);
    }
  };

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

        {/* Outreach Events Section */}
        <Box
          sx={{
            mb: 5,
            opacity: 0,
            animation: "fadeInUp 0.8s ease-out 1.3s forwards",
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
              Outreach Events
            </Typography>
            {canManageOutreach && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenOutreachEventDialog()}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                Add Event
              </Button>
            )}
          </Box>

          {outreachEvents.length === 0 ? (
            <Typography color="text.secondary">
              {canManageOutreach
                ? "No outreach events yet. Create your first event!"
                : "No outreach events yet."}
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {outreachEvents.map((event) => (
                <Card
                  key={event.id}
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
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        gutterBottom
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        {event.title}
                      </Typography>
                      {event.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {event.description}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        {event.event_date && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <CalendarTodayIcon
                              fontSize="small"
                              color="primary"
                            />
                            <Typography variant="body2">
                              {new Date(event.event_date).toLocaleDateString()}
                              {event.event_time && ` ${event.event_time}`}
                            </Typography>
                          </Box>
                        )}
                        {event.location && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <LocationOnIcon fontSize="small" color="primary" />
                            <Typography variant="body2">{event.location}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    {canManageOutreach && (
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenOutreachEventDialog(event)}
                          sx={{ color: "primary.main" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteOutreachEvent(event.id)}
                          sx={{ color: "error.main" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  {/* Gallery for this event */}
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PhotoLibraryIcon fontSize="small" />
                        Gallery ({outreachGalleryPhotos[event.id]?.length || 0} photos)
                      </Typography>
                      {canManageOutreach && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenGalleryDialog(event.id)}
                          sx={{ textTransform: "none" }}
                        >
                          Add Photos
                        </Button>
                      )}
                    </Box>

                    {outreachGalleryPhotos[event.id] &&
                    outreachGalleryPhotos[event.id].length > 0 ? (
                      (() => {
                        const photos = outreachGalleryPhotos[event.id];
                        const coverPhoto = photos.find((p) => p.is_cover) || photos[0];
                        const coverPhotoIndex = photos.findIndex((p) => p.id === coverPhoto.id);
                        return (
                          <Box
                            sx={{
                              position: "relative",
                              width: "100%",
                              paddingTop: "56.25%", // 16:9 aspect ratio
                              bgcolor: "grey.100",
                              borderRadius: 2,
                              overflow: "hidden",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "translateY(-4px)",
                                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                                "& .cover-overlay": {
                                  opacity: 1,
                                },
                              },
                            }}
                            onClick={() => handleOpenGalleryViewer(event.id, coverPhotoIndex >= 0 ? coverPhotoIndex : 0)}
                          >
                            <Box
                              component="img"
                              src={coverPhoto.image_url}
                              alt={
                                coverPhoto.caption ||
                                "Gallery cover photo"
                              }
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "top",
                              }}
                            />
                        <Box
                          className="cover-overlay"
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background:
                              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                            p: 2,
                            opacity: 0.8,
                            transition: "opacity 0.3s ease",
                          }}
                        >
                            <Typography
                              variant="body2"
                              sx={{
                                color: "white",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <PhotoLibraryIcon fontSize="small" />
                              {photos.length} photo
                              {photos.length !== 1 ? "s" : ""} - Click to
                              view
                            </Typography>
                          </Box>
                        </Box>
                        );
                      })()
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        {canManageOutreach
                          ? "No photos yet. Add your first photo!"
                          : "No photos yet."}
                      </Typography>
                    )}
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </Box>

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

        {/* Outreach Event Dialog */}
        <Dialog
          open={outreachEventDialogOpen}
          onClose={handleCloseOutreachEventDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingOutreachEvent ? "Edit Outreach Event" : "Add Outreach Event"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Title"
                value={outreachEventForm.title}
                onChange={(e) =>
                  setOutreachEventForm({
                    ...outreachEventForm,
                    title: e.target.value,
                  })
                }
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={outreachEventForm.description}
                onChange={(e) =>
                  setOutreachEventForm({
                    ...outreachEventForm,
                    description: e.target.value,
                  })
                }
                margin="normal"
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Event Date"
                type="date"
                value={outreachEventForm.event_date}
                onChange={(e) =>
                  setOutreachEventForm({
                    ...outreachEventForm,
                    event_date: e.target.value,
                  })
                }
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                label="Event Time"
                type="time"
                value={outreachEventForm.event_time}
                onChange={(e) =>
                  setOutreachEventForm({
                    ...outreachEventForm,
                    event_time: e.target.value,
                  })
                }
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Location"
                value={outreachEventForm.location}
                onChange={(e) =>
                  setOutreachEventForm({
                    ...outreachEventForm,
                    location: e.target.value,
                  })
                }
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseOutreachEventDialog}>Cancel</Button>
            <Button onClick={handleSaveOutreachEvent} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Outreach Gallery Dialog */}
        <Dialog
          open={outreachGalleryDialogOpen}
          onClose={handleCloseGalleryDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingGalleryPhoto ? "Edit Photo" : "Add Photo"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <ImageUpload
                mode="single"
                bucket="ministry-images"
                value={
                  typeof outreachGalleryForm.image_url === "string"
                    ? outreachGalleryForm.image_url
                    : ""
                }
                onChange={(url) =>
                  setOutreachGalleryForm({
                    ...outreachGalleryForm,
                    image_url: url as string,
                  })
                }
                label="Photo"
              />
              <TextField
                fullWidth
                label="Caption"
                value={outreachGalleryForm.caption}
                onChange={(e) =>
                  setOutreachGalleryForm({
                    ...outreachGalleryForm,
                    caption: e.target.value,
                  })
                }
                margin="normal"
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                label="Date Taken"
                type="date"
                value={outreachGalleryForm.taken_at}
                onChange={(e) =>
                  setOutreachGalleryForm({
                    ...outreachGalleryForm,
                    taken_at: e.target.value,
                  })
                }
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              {!editingGalleryPhoto && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Or upload multiple photos at once:
                  </Typography>
                  <ImageUpload
                    mode="multiple"
                    bucket="ministry-images"
                    value={[]}
                    onChange={(urls) => {
                      if (Array.isArray(urls) && urls.length > 0) {
                        handleBulkUploadGallery(urls);
                      }
                    }}
                    label="Upload Multiple Photos"
                    maxFiles={20}
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseGalleryDialog}>Cancel</Button>
            <Button onClick={handleSaveGalleryPhoto} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Gallery Viewer Dialog */}
        <Dialog
          open={galleryViewerOpen}
          onClose={handleCloseGalleryViewer}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: "transparent",
              boxShadow: "none",
              m: { xs: 0, sm: 2 },
            },
          }}
        >
          <DialogContent
            sx={{
              p: 0,
              position: "relative",
              maxHeight: { xs: "100vh", sm: "90vh" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selectedEventForViewer &&
            outreachGalleryPhotos[selectedEventForViewer] &&
            outreachGalleryPhotos[selectedEventForViewer].length > 0 ? (
              (() => {
                const photos =
                  outreachGalleryPhotos[selectedEventForViewer];
                const currentPhoto = photos[currentPhotoIndex];
                const totalPhotos = photos.length;
                const canNavigate = totalPhotos > 1;

                return (
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxHeight: { xs: "100vh", sm: "90vh" },
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Action Buttons */}
                    <Box
                      sx={{
                        position: "absolute",
                        right: { xs: 8, sm: 16 },
                        top: { xs: 8, sm: 16 },
                        display: "flex",
                        gap: 1,
                        zIndex: 2,
                      }}
                    >
                      {canManageOutreach && (
                        <>
                          {!currentPhoto.is_cover && (
                            <IconButton
                              onClick={() =>
                                handleSetCoverPhoto(
                                  currentPhoto.id,
                                  selectedEventForViewer
                                )
                              }
                              sx={{
                                color: "white",
                                backgroundColor: alpha("#000", 0.6),
                                width: { xs: 40, sm: 48 },
                                height: { xs: 40, sm: 48 },
                                backdropFilter: "blur(10px)",
                                "&:hover": {
                                  backgroundColor: alpha("#000", 0.8),
                                },
                                transition: "all 0.2s",
                              }}
                              title="Set as cover photo"
                            >
                              <StarIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            </IconButton>
                          )}
                          <IconButton
                            onClick={() =>
                              handleDeleteGalleryPhoto(
                                currentPhoto.id,
                                selectedEventForViewer
                              )
                            }
                            sx={{
                              color: "white",
                              backgroundColor: alpha("#000", 0.6),
                              width: { xs: 40, sm: 48 },
                              height: { xs: 40, sm: 48 },
                              backdropFilter: "blur(10px)",
                              "&:hover": {
                                backgroundColor: alpha("#d32f2f", 0.8),
                              },
                              transition: "all 0.2s",
                            }}
                            title="Delete photo"
                          >
                            <DeleteIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        onClick={handleCloseGalleryViewer}
                        sx={{
                          color: "white",
                          backgroundColor: alpha("#000", 0.6),
                          width: { xs: 40, sm: 48 },
                          height: { xs: 40, sm: 48 },
                          backdropFilter: "blur(10px)",
                          "&:hover": {
                            backgroundColor: alpha("#000", 0.8),
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        <CloseIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                      </IconButton>
                    </Box>

                    {/* Navigation Arrows */}
                    {canNavigate && (
                      <>
                        <IconButton
                          onClick={handlePreviousPhoto}
                          sx={{
                            position: "absolute",
                            left: { xs: 8, sm: 16 },
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "white",
                            backgroundColor: alpha("#000", 0.6),
                            width: { xs: 40, sm: 48 },
                            height: { xs: 40, sm: 48 },
                            backdropFilter: "blur(10px)",
                            "&:hover": {
                              backgroundColor: alpha("#000", 0.8),
                            },
                            zIndex: 2,
                            transition: "all 0.2s",
                          }}
                        >
                          <ArrowLeftIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                        </IconButton>
                        <IconButton
                          onClick={handleNextPhoto}
                          sx={{
                            position: "absolute",
                            right: { xs: 8, sm: 16 },
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "white",
                            backgroundColor: alpha("#000", 0.6),
                            width: { xs: 40, sm: 48 },
                            height: { xs: 40, sm: 48 },
                            backdropFilter: "blur(10px)",
                            "&:hover": {
                              backgroundColor: alpha("#000", 0.8),
                            },
                            zIndex: 2,
                            transition: "all 0.2s",
                          }}
                        >
                          <ArrowRightIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                        </IconButton>
                      </>
                    )}

                    {/* Photo Counter */}
                    {canNavigate && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: { xs: 8, sm: 16 },
                          left: { xs: 8, sm: 16 },
                          color: "white",
                          backgroundColor: alpha("#000", 0.6),
                          backdropFilter: "blur(10px)",
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          zIndex: 2,
                        }}
                      >
                        <Typography variant="body2">
                          {currentPhotoIndex + 1} / {totalPhotos}
                        </Typography>
                      </Box>
                    )}

                    {/* Photo */}
                    <Box
                      sx={{
                        width: "100%",
                        maxHeight: { xs: "100vh", sm: "90vh" },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        component="img"
                        src={currentPhoto.image_url}
                        alt={currentPhoto.caption || "Gallery photo"}
                        sx={{
                          maxWidth: "100%",
                          maxHeight: { xs: "100vh", sm: "90vh" },
                          objectFit: "contain",
                        }}
                      />
                    </Box>

                    {/* Caption and Cover Badge */}
                    {(currentPhoto.caption || currentPhoto.is_cover) && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                          p: 3,
                          zIndex: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            mb: currentPhoto.caption ? 1 : 0,
                          }}
                        >
                          {currentPhoto.is_cover && (
                            <Chip
                              icon={<StarIcon sx={{ color: "white !important" }} />}
                              label="Cover Photo"
                              size="small"
                              sx={{
                                backgroundColor: alpha("#ffc107", 0.9),
                                color: "white",
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                        {currentPhoto.caption && (
                          <Typography
                            variant="body1"
                            sx={{
                              color: "white",
                              textAlign: "center",
                              fontWeight: 500,
                            }}
                          >
                            {currentPhoto.caption}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })()
            ) : null}
          </DialogContent>
        </Dialog>
      </Container>
    </>
  );
};
