import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { galleryService } from "../../services/galleryService";
import type { Event, GalleryPhoto } from "../../types";
import { ImageUpload } from "../common/ImageUpload";

interface GalleryPhotoFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingPhoto?: GalleryPhoto | null;
  /** When set, event_id is locked and the event selector is hidden */
  lockedEventId?: string;
  events?: Event[];
}

export const GalleryPhotoFormDialog = ({
  open,
  onClose,
  onSaved,
  editingPhoto = null,
  lockedEventId,
  events = [],
}: GalleryPhotoFormDialogProps) => {
  const { t } = useTranslation("events");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    image_url: "" as string | string[],
    caption: "",
    event_id: "" as string | undefined,
    taken_at: "",
  });

  useEffect(() => {
    if (!open) return;

    if (editingPhoto) {
      setFormData({
        image_url: editingPhoto.image_url,
        caption: editingPhoto.caption || "",
        event_id: lockedEventId || editingPhoto.event_id || undefined,
        taken_at: editingPhoto.taken_at
          ? editingPhoto.taken_at.slice(0, 10)
          : "",
      });
    } else {
      setFormData({
        image_url: [],
        caption: "",
        event_id: lockedEventId || undefined,
        taken_at: "",
      });
    }
  }, [open, editingPhoto, lockedEventId]);

  const handleClose = () => {
    if (uploading) return;
    onClose();
  };

  const handleSave = async () => {
    const imageUrls = Array.isArray(formData.image_url)
      ? formData.image_url
      : formData.image_url
        ? [formData.image_url]
        : [];

    if (imageUrls.length === 0) {
      alert(t("gallery.uploadRequired"));
      return;
    }

    setUploading(true);
    try {
      const eventId = lockedEventId || formData.event_id || undefined;

      if (editingPhoto) {
        await galleryService.update(editingPhoto.id, {
          image_url: imageUrls[0],
          caption: formData.caption || undefined,
          event_id: eventId,
          taken_at: formData.taken_at || undefined,
        });
      } else {
        await galleryService.createMultiple(
          imageUrls.map((imageUrl) => ({
            image_url: imageUrl,
            caption: formData.caption || undefined,
            event_id: eventId,
            taken_at: formData.taken_at || undefined,
          }))
        );
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving photo(s):", error);
      alert(t("gallery.saveFailed"));
    } finally {
      setUploading(false);
    }
  };

  const hasImages = Array.isArray(formData.image_url)
    ? formData.image_url.length > 0
    : !!formData.image_url;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingPhoto ? t("gallery.editPhoto") : t("gallery.upload")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <ImageUpload
            mode={editingPhoto ? "single" : "multiple"}
            bucket="event-photos"
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
            label={
              editingPhoto ? t("gallery.photo") : t("gallery.photosMultiple")
            }
            maxFiles={20}
          />
          <TextField
            fullWidth
            label={t("gallery.caption")}
            value={formData.caption}
            onChange={(e) =>
              setFormData({ ...formData, caption: e.target.value })
            }
            margin="normal"
            multiline
            rows={2}
          />
          {!lockedEventId && events.length > 0 && (
            <FormControl fullWidth margin="normal">
              <InputLabel>{t("gallery.eventOptional")}</InputLabel>
              <Select
                value={formData.event_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    event_id: e.target.value || undefined,
                  })
                }
                label={t("gallery.eventOptional")}
              >
                <MenuItem value="">
                  <em>{t("form.none")}</em>
                </MenuItem>
                {events.map((event) => (
                  <MenuItem key={event.id} value={event.id}>
                    {event.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            fullWidth
            label={t("gallery.takenDate")}
            type="date"
            value={formData.taken_at}
            onChange={(e) =>
              setFormData({ ...formData, taken_at: e.target.value })
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 2, pb: 2 }}>
        <Button onClick={handleClose} disabled={uploading}>
          {t("rsvp.cancel")}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={uploading || !hasImages}
        >
          {uploading
            ? t("edit.saving")
            : editingPhoto
              ? t("gallery.update")
              : t("gallery.uploadCount", {
                  count: Array.isArray(formData.image_url)
                    ? formData.image_url.length
                    : 1,
                })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
