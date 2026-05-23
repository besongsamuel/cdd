import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { useHasPermission } from "../hooks/usePermissions";
import { eventRsvpsService } from "../services/eventRsvpsService";
import { eventsService } from "../services/eventsService";
import type { Event, EventRsvpCounts, EventRsvpStatus } from "../types";

const formatEventTime = (time: string) => {
  const parts = time.split(":").map(Number);
  const hours = parts[0];
  const minutes = parts[1];
  if (hours === undefined || minutes === undefined || Number.isNaN(hours)) {
    return time;
  }
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const EventInfoItem = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 2,
      p: 2,
      borderRadius: 2,
      bgcolor: "background.paper",
      border: "1px solid",
      borderColor: "divider",
      height: "100%",
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        borderRadius: 2,
        flexShrink: 0,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
        color: "primary.main",
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="overline"
        sx={{
          display: "block",
          lineHeight: 1.4,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "primary.main",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        component="div"
        sx={{ fontWeight: 600, fontSize: "1.05rem", lineHeight: 1.5 }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

export const EventDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation("events");
  const { user, currentMember } = useAuth();
  const canManageEvents = useHasPermission("manage:events");

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<EventRsvpCounts>({
    attending: 0,
    maybe: 0,
    not_attending: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<EventRsvpStatus | null>(
    null
  );
  const [guestName, setGuestName] = useState("");
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<EventRsvpStatus | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadEvent = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const data = await eventsService.getBySlug(slug);
      setEvent(data);
      if (data) {
        const [countData, existingRsvp] = await Promise.all([
          eventRsvpsService.getCounts(data.id),
          eventRsvpsService.getForVisitor(data.id),
        ]);
        setCounts(countData);
        if (existingRsvp) {
          setSelectedStatus(existingRsvp.status);
          if (existingRsvp.guest_name) {
            setGuestName(existingRsvp.guest_name);
          }
        }
      }
    } catch (err) {
      console.error("Error loading event:", err);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (currentMember?.name && !guestName) {
      setGuestName(currentMember.name);
    }
  }, [currentMember, guestName]);

  const refreshCounts = async (eventId: string) => {
    const countData = await eventRsvpsService.getCounts(eventId);
    setCounts(countData);
  };

  const submitRsvp = async (
    status: EventRsvpStatus,
    nameOverride?: string
  ) => {
    if (!event) return;

    const name = nameOverride ?? guestName;
    if (!user && (!name || !name.trim())) {
      setPendingStatus(status);
      setNameDialogOpen(true);
      return;
    }

    setSubmitting(true);
    setRsvpMessage(null);
    try {
      const result = await eventRsvpsService.upsert({
        eventId: event.id,
        status,
        guestName: user ? currentMember?.name || name : name.trim(),
        memberId: currentMember?.id,
      });
      setSelectedStatus(result.rsvp.status);
      await refreshCounts(event.id);
      setRsvpMessage({ type: "success", text: t("rsvp.saved") });
    } catch (err) {
      console.error("RSVP error:", err);
      setRsvpMessage({ type: "error", text: t("rsvp.error") });
    } finally {
      setSubmitting(false);
      setNameDialogOpen(false);
      setPendingStatus(null);
    }
  };

  const handleStatusClick = (status: EventRsvpStatus) => {
    submitRsvp(status);
  };

  const handleNameDialogSubmit = () => {
    if (!guestName.trim()) {
      setRsvpMessage({ type: "error", text: t("rsvp.guestNameRequired") });
      return;
    }
    if (pendingStatus) {
      submitRsvp(pendingStatus, guestName.trim());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!event) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h5" gutterBottom>
          {t("notFound")}
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/events"
          sx={{ mt: 2 }}
        >
          {t("backToEvents")}
        </Button>
      </Container>
    );
  }

  return (
    <>
      <SEO title={event.title} description={event.description?.slice(0, 160)} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mb: 2,
          }}
        >
          <Button startIcon={<ArrowBackIcon />} component={Link} to="/events">
            {t("backToEvents")}
          </Button>
          {canManageEvents && slug && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              component={Link}
              to={`/events/${slug}/edit`}
            >
              {t("edit.action")}
            </Button>
          )}
        </Box>

        {event.image_url && (
          <Box
            component="img"
            src={event.image_url}
            alt={event.title}
            sx={{
              display: "block",
              width: "100%",
              height: "auto",
              objectFit: "contain",
              borderRadius: 2,
              mb: 3,
            }}
          />
        )}

        <Typography variant="h3" component="h1" gutterBottom>
          {event.title}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {event.ministry_id && event.ministry_name && (
            <Chip
              label={`${t("ministry")}: ${event.ministry_name}`}
              component={Link}
              to={`/ministries/${event.ministry_id}`}
              clickable
              color="primary"
              variant="outlined"
            />
          )}
          {event.department_id && event.department_name && (
            <Chip
              label={`${t("department")}: ${event.department_name}`}
              component={Link}
              to={`/departments/${event.department_id}`}
              clickable
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fit, minmax(220px, 1fr))",
              },
              gap: 2,
            }}
          >
            <EventInfoItem
              icon={<CalendarTodayIcon />}
              label={t("date")}
              value={formatDate(event.event_date)}
            />
            {event.event_time && (
              <EventInfoItem
                icon={<AccessTimeIcon />}
                label={t("time")}
                value={formatEventTime(event.event_time)}
              />
            )}
            {event.location && (
              <EventInfoItem
                icon={<LocationOnIcon />}
                label={t("location")}
                value={
                  <MuiLink
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    color="inherit"
                    sx={{ fontWeight: 600 }}
                  >
                    {event.location}
                  </MuiLink>
                }
              />
            )}
          </Box>
        </Paper>

        {event.description && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t("description")}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {event.description}
            </Typography>
          </Paper>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("rsvp.title")}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            <Chip
              label={t("rsvp.countsAttending", { count: counts.attending })}
              color="success"
              variant="outlined"
              size="small"
            />
            <Chip
              label={t("rsvp.countsMaybe", { count: counts.maybe })}
              color="warning"
              variant="outlined"
              size="small"
            />
            <Chip
              label={t("rsvp.countsNotAttending", {
                count: counts.not_attending,
              })}
              color="default"
              variant="outlined"
              size="small"
            />
          </Box>

          {selectedStatus && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("rsvp.yourResponse")}:{" "}
              {selectedStatus === "attending"
                ? t("rsvp.attending")
                : selectedStatus === "maybe"
                  ? t("rsvp.maybe")
                  : t("rsvp.notAttending")}
            </Typography>
          )}

          {rsvpMessage && (
            <Alert severity={rsvpMessage.type} sx={{ mb: 2 }}>
              {rsvpMessage.text}
            </Alert>
          )}

          <ButtonGroup fullWidth variant="outlined" disabled={submitting}>
            <Button
              variant={selectedStatus === "attending" ? "contained" : "outlined"}
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleStatusClick("attending")}
            >
              {t("rsvp.attending")}
            </Button>
            <Button
              variant={selectedStatus === "maybe" ? "contained" : "outlined"}
              color="warning"
              startIcon={<HelpOutlineIcon />}
              onClick={() => handleStatusClick("maybe")}
            >
              {t("rsvp.maybe")}
            </Button>
            <Button
              variant={
                selectedStatus === "not_attending" ? "contained" : "outlined"
              }
              color="inherit"
              startIcon={<CancelIcon />}
              onClick={() => handleStatusClick("not_attending")}
            >
              {t("rsvp.notAttending")}
            </Button>
          </ButtonGroup>

          {!user && (
            <Typography variant="caption" display="block" sx={{ mt: 2 }}>
              {t("rsvp.guestNameLabel")}: {guestName || "—"}
              <MuiLink
                component="button"
                type="button"
                sx={{ ml: 1 }}
                onClick={() => setNameDialogOpen(true)}
              >
                {guestName ? t("rsvp.editName") : t("rsvp.addName")}
              </MuiLink>
            </Typography>
          )}
        </Paper>
      </Container>

      <Dialog
        open={nameDialogOpen}
        onClose={() => !submitting && setNameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("rsvp.guestNameLabel")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("rsvp.guestNameLabel")}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNameDialogOpen(false)}
            disabled={submitting}
          >
            {t("rsvp.cancel")}
          </Button>
          <Button
            onClick={handleNameDialogSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? t("rsvp.submitting") : t("rsvp.ok")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
