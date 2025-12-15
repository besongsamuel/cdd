import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { ImageUpload } from "../common/ImageUpload";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { eventsService } from "../../services/eventsService";
import { galleryService } from "../../services/galleryService";
import type { GalleryPhoto, Event } from "../../types";

export const GalleryManager = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [formData, setFormData] = useState({
    image_url: "",
    event_id: "",
    caption: "",
    taken_at: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPhotos(), loadEvents()]);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const data = await galleryService.getAll();
      setPhotos(data);
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await eventsService.getAll();
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const handleOpenDialog = (photo?: GalleryPhoto) => {
    if (photo) {
      setEditingPhoto(photo);
      setFormData({
        image_url: photo.image_url,
        event_id: photo.event_id || "",
        caption: photo.caption || "",
        taken_at: photo.taken_at
          ? new Date(photo.taken_at).toISOString().split("T")[0]
          : "",
      });
    } else {
      setEditingPhoto(null);
      setFormData({
        image_url: "",
        event_id: "",
        caption: "",
        taken_at: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPhoto(null);
  };

  const handleSubmit = async () => {
    try {
      const photoData = {
        image_url: formData.image_url,
        event_id: formData.event_id || undefined,
        caption: formData.caption || undefined,
        taken_at: formData.taken_at || undefined,
      };

      if (editingPhoto) {
        await galleryService.update(editingPhoto.id, photoData);
      } else {
        await galleryService.create(photoData);
      }
      handleCloseDialog();
      loadPhotos();
    } catch (error) {
      console.error("Error saving photo:", error);
      alert("Failed to save photo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    try {
      await galleryService.delete(id);
      loadPhotos();
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo");
    }
  };

  const handleBulkUpload = async (urls: string[]) => {
    try {
      const promises = urls.map((url) =>
        galleryService.create({
          image_url: url,
          event_id: formData.event_id || undefined,
          caption: formData.caption || undefined,
          taken_at: formData.taken_at || undefined,
        })
      );
      await Promise.all(promises);
      loadPhotos();
      alert(`Successfully uploaded ${urls.length} photos`);
    } catch (error) {
      console.error("Error bulk uploading photos:", error);
      alert("Failed to upload some photos");
    }
  };

  const filteredPhotos =
    filterEvent === "all"
      ? photos
      : photos.filter((p) => p.event_id === filterEvent);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Gallery Management</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Event</InputLabel>
            <Select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              label="Filter by Event"
            >
              <MenuItem value="all">All Photos</MenuItem>
              <MenuItem value="">No Event</MenuItem>
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Photo
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {filteredPhotos.map((photo) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
            <Paper
              sx={{
                p: 1,
                position: "relative",
                "&:hover .photo-actions": {
                  opacity: 1,
                },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  paddingTop: "75%", // 4:3 aspect ratio
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  overflow: "hidden",
                  mb: 1,
                }}
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption || "Gallery photo"}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Box
                  className="photo-actions"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    opacity: 0,
                    transition: "opacity 0.2s",
                    display: "flex",
                    gap: 0.5,
                    bgcolor: "rgba(0,0,0,0.5)",
                    borderRadius: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(photo)}
                    sx={{ color: "white" }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(photo.id)}
                    sx={{ color: "white" }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {photo.caption && (
                <Typography variant="caption" noWrap>
                  {photo.caption}
                </Typography>
              )}
              {photo.event_name && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {photo.event_name}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {filteredPhotos.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">
            No photos found. Add your first photo!
          </Typography>
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPhoto ? "Edit Photo" : "Add Photo"}
        </DialogTitle>
        <DialogContent>
          <ImageUpload
            mode="single"
            bucket="gallery-photos"
            value={formData.image_url}
            onChange={(url) =>
              setFormData({ ...formData, image_url: url as string })
            }
            label="Photo"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Event (Optional)</InputLabel>
            <Select
              value={formData.event_id}
              onChange={(e) =>
                setFormData({ ...formData, event_id: e.target.value })
              }
              label="Event (Optional)"
            >
              <MenuItem value="">None</MenuItem>
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Caption"
            value={formData.caption}
            onChange={(e) =>
              setFormData({ ...formData, caption: e.target.value })
            }
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Date Taken"
            type="date"
            value={formData.taken_at}
            onChange={(e) =>
              setFormData({ ...formData, taken_at: e.target.value })
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          {!editingPhoto && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Or upload multiple photos at once:
              </Typography>
              <ImageUpload
                mode="multiple"
                bucket="gallery-photos"
                value={[]}
                onChange={(urls) => {
                  if (Array.isArray(urls) && urls.length > 0) {
                    handleBulkUpload(urls);
                  }
                }}
                label="Upload Multiple Photos"
                maxFiles={20}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

