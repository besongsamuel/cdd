import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Button, Container, Fab, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { GalleryPhotoFormDialog } from "../components/gallery/GalleryPhotoFormDialog";
import { GalleryPhotoGrid } from "../components/gallery/GalleryPhotoGrid";
import { GalleryPhotoLightbox } from "../components/gallery/GalleryPhotoLightbox";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { useCanManageEventGallery } from "../hooks/useCanManageEventGallery";
import { eventsService } from "../services/eventsService";
import { galleryService } from "../services/galleryService";
import type { Event, GalleryPhoto } from "../types";

export const EventGalleryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation("events");
  const canManage = useCanManageEventGallery();

  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);

  const loadPhotos = useCallback(async (eventId: string) => {
    const data = await galleryService.getByEvent(eventId);
    setPhotos(data);
  }, []);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      setLoading(true);
      try {
        const eventData = await eventsService.getBySlug(slug);
        setEvent(eventData);
        if (eventData) {
          await loadPhotos(eventData.id);
        }
      } catch (err) {
        console.error("Error loading event gallery:", err);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [slug, loadPhotos]);

  const handlePhotoClick = (_photo: GalleryPhoto, index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleOpenForm = (photo?: GalleryPhoto) => {
    setEditingPhoto(photo ?? null);
    setFormOpen(true);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm(t("gallery.deleteConfirm"))) return;
    if (!event) return;

    try {
      await galleryService.delete(photoId);
      await loadPhotos(event.id);
    } catch (err) {
      console.error("Error deleting photo:", err);
      alert(t("gallery.deleteFailed"));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!event || !slug) {
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
      <SEO
        title={`${event.title} — ${t("gallery.title")}`}
        description={event.description?.slice(0, 160)}
      />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          to={`/events/${slug}`}
          sx={{ mb: 2 }}
        >
          {t("gallery.backToEvent")}
        </Button>

        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontSize: { xs: "28px", md: "36px" } }}
        >
          {event.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          {new Date(event.event_date).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {event.event_time && ` • ${event.event_time}`}
          {event.location && ` • ${event.location}`}
        </Typography>
        {event.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, whiteSpace: "pre-wrap" }}
          >
            {event.description}
          </Typography>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="h2">
            {t("gallery.title")}{" "}
            <Typography component="span" variant="body2" color="text.secondary">
              ({t("gallery.photoCount", { count: photos.length })})
            </Typography>
          </Typography>
        </Box>

        <GalleryPhotoGrid
          photos={photos}
          canManage={canManage}
          onPhotoClick={handlePhotoClick}
          onEditPhoto={canManage ? handleOpenForm : undefined}
          onDeletePhoto={canManage ? handleDeletePhoto : undefined}
          emptyMessage={t("gallery.empty")}
        />

        {canManage && (
          <Fab
            color="primary"
            aria-label={t("gallery.upload")}
            sx={{ position: "fixed", bottom: 24, right: 24 }}
            onClick={() => handleOpenForm()}
          >
            <AddIcon />
          </Fab>
        )}

        <GalleryPhotoLightbox
          open={lightboxOpen}
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          showEventName={false}
        />

        <GalleryPhotoFormDialog
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingPhoto(null);
          }}
          onSaved={() => void loadPhotos(event.id)}
          editingPhoto={editingPhoto}
          lockedEventId={event.id}
        />
      </Container>
    </>
  );
};
