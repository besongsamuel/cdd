import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import {
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useCanManageEventGallery } from "../../hooks/useCanManageEventGallery";
import { galleryService } from "../../services/galleryService";
import type { GalleryPhoto } from "../../types";

interface EventGalleryPreviewProps {
  eventId: string;
  eventSlug: string;
}

const PREVIEW_COUNT = 4;

export const EventGalleryPreview = ({
  eventId,
  eventSlug,
}: EventGalleryPreviewProps) => {
  const { t } = useTranslation("events");
  const canManage = useCanManageEventGallery();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await galleryService.getByEvent(eventId);
        if (!cancelled) setPhotos(data);
      } catch (err) {
        console.error("Error loading event gallery preview:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) return null;
  if (photos.length === 0 && !canManage) return null;

  const previewPhotos = photos.slice(0, PREVIEW_COUNT);
  const galleryUrl = `/events/${eventSlug}/gallery`;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
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
        <Typography variant="h6" component="h2">
          {t("gallery.title")}
        </Typography>
        {photos.length > 0 && (
          <Button
            component={Link}
            to={galleryUrl}
            size="small"
            startIcon={<PhotoLibraryIcon />}
          >
            {t("gallery.viewAll", { count: photos.length })}
          </Button>
        )}
      </Box>

      {photos.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t("gallery.empty")}
          </Typography>
          {canManage && (
            <Button
              component={Link}
              to={galleryUrl}
              variant="outlined"
              startIcon={<PhotoLibraryIcon />}
            >
              {t("gallery.addPhotos")}
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: `repeat(${Math.min(previewPhotos.length, 4)}, 1fr)`,
              },
              gap: 1.5,
              mb: 2,
            }}
          >
            {previewPhotos.map((photo) => (
              <Box
                key={photo.id}
                component={Link}
                to={galleryUrl}
                sx={{
                  display: "block",
                  borderRadius: 2,
                  overflow: "hidden",
                  aspectRatio: "4 / 3",
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                  "&:hover img": { transform: "scale(1.03)" },
                }}
              >
                <Box
                  component="img"
                  src={photo.image_url}
                  alt={photo.caption || eventSlug}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.2s ease",
                  }}
                />
              </Box>
            ))}
          </Box>
          <Button
            component={Link}
            to={galleryUrl}
            variant="contained"
            fullWidth
            startIcon={<PhotoLibraryIcon />}
            sx={{ display: { xs: "flex", sm: photos.length <= PREVIEW_COUNT ? "none" : "flex" } }}
          >
            {t("gallery.viewAll", { count: photos.length })}
          </Button>
        </>
      )}
    </Paper>
  );
};
