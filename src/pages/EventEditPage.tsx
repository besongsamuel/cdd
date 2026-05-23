import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  emptyEventFormValues,
  eventToFormValues,
  EventFormFields,
  formValuesToEventPayload,
} from "../components/common/EventFormFields";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { useAuth } from "../hooks/useAuth";
import { useHasPermission } from "../hooks/usePermissions";
import { departmentsService } from "../services/departmentsService";
import { eventsService } from "../services/eventsService";
import { ministriesService } from "../services/ministriesService";
import { slugify } from "../utils/slugify";
import type { Department, Event, Ministry } from "../types";

export const EventEditPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("events");
  const { loading: authLoading } = useAuth();
  const canManageEvents = useHasPermission("manage:events");

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventFormData, setEventFormData] = useState(emptyEventFormValues);
  const [slugManual, setSlugManual] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const loadData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [eventData, ministriesData, departmentsData] = await Promise.all([
        eventsService.getBySlug(slug),
        ministriesService.getActive(),
        departmentsService.getActive(),
      ]);
      setEvent(eventData);
      if (eventData) {
        setEventFormData(eventToFormValues(eventData));
      }
      setMinistries(ministriesData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error("Error loading event for edit:", error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!event) return;

    const newSlug = eventFormData.slug.trim() || slugify(eventFormData.title);
    if (!newSlug) {
      setSlugError(t("form.slugRequired"));
      return;
    }
    const available = await eventsService.isSlugAvailable(newSlug, event.id);
    if (!available) {
      setSlugError(t("form.slugTaken"));
      return;
    }
    setSlugError(null);
    setSaving(true);
    try {
      const payload = formValuesToEventPayload({
        ...eventFormData,
        slug: newSlug,
      });
      await eventsService.update(event.id, payload);
      navigate(`/events/${newSlug}`, { replace: true });
    } catch (error) {
      console.error("Error saving event:", error);
      alert(t("edit.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!canManageEvents) {
    return <Navigate to={slug ? `/events/${slug}` : "/events"} replace />;
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
      <SEO title={t("edit.title", { title: event.title })} />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          to={`/events/${slug}`}
          sx={{ mb: 2 }}
        >
          {t("edit.backToEvent")}
        </Button>

        <Typography variant="h4" component="h1" gutterBottom>
          {t("edit.title", { title: event.title })}
        </Typography>

        <Paper sx={{ p: 3, mt: 2 }}>
          <EventFormFields
            value={eventFormData}
            onChange={setEventFormData}
            ministries={ministries}
            departments={departments}
            slugError={slugError}
            slugManual={slugManual}
            onSlugManualEdit={() => setSlugManual(true)}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              mt: 3,
            }}
          >
            <Button
              component={Link}
              to={`/events/${slug}`}
              disabled={saving}
            >
              {t("edit.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t("edit.saving") : t("edit.save")}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};
