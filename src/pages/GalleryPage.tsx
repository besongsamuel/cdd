import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  alpha,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageUpload } from "../components/common/ImageUpload";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SEO } from "../components/SEO";
import { useHasPermission } from "../hooks/usePermissions";
import { eventsService } from "../services/eventsService";
import { galleryService } from "../services/galleryService";
import type { Event, GalleryPhoto } from "../types";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gallery-tabpanel-${index}`}
      aria-labelledby={`gallery-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const GalleryPage = () => {
  const { t } = useTranslation("gallery");
  const canManageGallery = useHasPermission("manage:gallery");

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoFormData, setPhotoFormData] = useState({
    image_url: "",
    caption: "",
    event_id: "" as string | undefined,
    taken_at: "",
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 600);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [photosData, eventsData] = await Promise.all([
          galleryService.getAll(),
          eventsService.getAll(),
        ]);
        setPhotos(photosData);
        setEvents(eventsData);
      } catch (error) {
        console.error("Error loading gallery:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handlePhotoClick = (photo: GalleryPhoto) => {
    setSelectedPhoto(photo);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPhoto(null);
  };

  const handleOpenPhotoDialog = (photo?: GalleryPhoto) => {
    if (photo) {
      setEditingPhoto(photo);
      setPhotoFormData({
        image_url: photo.image_url,
        caption: photo.caption || "",
        event_id: photo.event_id || undefined,
        taken_at: photo.taken_at || "",
      });
    } else {
      setEditingPhoto(null);
      setPhotoFormData({
        image_url: "",
        caption: "",
        event_id: undefined,
        taken_at: "",
      });
    }
    setPhotoDialogOpen(true);
  };

  const handleClosePhotoDialog = () => {
    setPhotoDialogOpen(false);
    setEditingPhoto(null);
    setPhotoFormData({
      image_url: "",
      caption: "",
      event_id: undefined,
      taken_at: "",
    });
  };

  const handleSavePhoto = async () => {
    if (!photoFormData.image_url) {
      alert("Please upload an image");
      return;
    }
    setUploading(true);
    try {
      const photoData = {
        image_url: photoFormData.image_url,
        caption: photoFormData.caption || undefined,
        event_id: photoFormData.event_id || undefined,
        taken_at: photoFormData.taken_at || undefined,
      };
      if (editingPhoto) {
        await galleryService.update(editingPhoto.id, photoData);
      } else {
        await galleryService.create(photoData);
      }
      handleClosePhotoDialog();
      // Reload photos
      const photosData = await galleryService.getAll();
      setPhotos(photosData);
    } catch (error) {
      console.error("Error saving photo:", error);
      alert("Failed to save photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }
    try {
      await galleryService.delete(photoId);
      // Reload photos
      const photosData = await galleryService.getAll();
      setPhotos(photosData);
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo");
    }
  };

  // Group photos by event
  const photosByEvent = events.reduce((acc, event) => {
    acc[event.id] = photos.filter((p) => p.event_id === event.id);
    return acc;
  }, {} as Record<string, GalleryPhoto[]>);

  // Photos without event
  const photosWithoutEvent = photos.filter((p) => !p.event_id);

  // Group photos by year/month
  const photosByDate = photos.reduce((acc, photo) => {
    if (!photo.taken_at) {
      const date = new Date(photo.created_at);
      const yearMonth = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!acc[yearMonth]) acc[yearMonth] = [];
      acc[yearMonth].push(photo);
    } else {
      const date = new Date(photo.taken_at);
      const yearMonth = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!acc[yearMonth]) acc[yearMonth] = [];
      acc[yearMonth].push(photo);
    }
    return acc;
  }, {} as Record<string, GalleryPhoto[]>);

  const dateGroups = Object.keys(photosByDate).sort().reverse();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <SEO title={t("title")} description={t("subtitle")} url="/gallery" />
      <Container sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          textAlign="center"
          sx={{ fontSize: { xs: "32px", md: "40px" } }}
        >
          {t("title")}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 4, fontSize: { xs: "15px", md: "16px" } }}
        >
          {t("subtitle")}
        </Typography>

        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            mb: 3,
            overflowX: "auto",
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            centered
            sx={{
              minHeight: { xs: 48, sm: 48 },
              "& .MuiTab-root": {
                fontSize: { xs: "0.875rem", sm: "1rem" },
                minHeight: { xs: 48, sm: 48 },
                padding: { xs: "12px 8px", sm: "12px 16px" },
              },
            }}
          >
            <Tab label={t("allPhotos")} />
            <Tab label={t("byEvent")} />
            <Tab label={t("byDate")} />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          {photos.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">
              {t("noPhotos")}
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {photos.map((photo) => (
                <Card
                  key={photo.id}
                  sx={{
                    position: "relative",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                      "& .photo-actions": {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  {canManageGallery && (
                    <Box
                      className="photo-actions"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        display: "flex",
                        gap: 0.5,
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: 1,
                        p: 0.5,
                        opacity: 0,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPhotoDialog(photo);
                        }}
                        sx={{ color: "primary.main" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                        sx={{ color: "error.main" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  <CardActionArea onClick={() => handlePhotoClick(photo)}>
                    <CardMedia
                      component="img"
                      image={photo.image_url}
                      alt={photo.caption || "Gallery photo"}
                      sx={{
                        height: 280,
                        objectFit: "cover",
                      }}
                    />
                    {(photo.caption || photo.event_name) && (
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          noWrap
                          title={photo.caption || photo.event_name}
                        >
                          {photo.caption || photo.event_name}
                        </Typography>
                        {photo.event_name && photo.caption && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            {photo.event_name}
                          </Typography>
                        )}
                      </CardContent>
                    )}
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {events.length === 0 && photosWithoutEvent.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">
              {t("noEventPhotos")}
            </Typography>
          ) : (
            <Box>
              {events.map((event) => {
                const eventPhotos = photosByEvent[event.id] || [];
                if (eventPhotos.length === 0) return null;

                return (
                  <Box key={event.id} sx={{ mb: 6 }}>
                    <Typography variant="h5" gutterBottom>
                      {event.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      sx={{ mb: 2 }}
                    >
                      {new Date(event.event_date).toLocaleDateString()}
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, 1fr)",
                          md: "repeat(3, 1fr)",
                        },
                        gap: 3,
                      }}
                    >
                      {eventPhotos.map((photo) => (
                        <Card
                          key={photo.id}
                          sx={{
                            position: "relative",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: 4,
                              "& .photo-actions": {
                                opacity: 1,
                              },
                            },
                          }}
                        >
                          {canManageGallery && (
                            <Box
                              className="photo-actions"
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                zIndex: 10,
                                display: "flex",
                                gap: 0.5,
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                borderRadius: 1,
                                p: 0.5,
                                opacity: 0,
                                transition: "opacity 0.2s",
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPhotoDialog(photo);
                                }}
                                sx={{ color: "primary.main" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhoto(photo.id);
                                }}
                                sx={{ color: "error.main" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                          <CardActionArea onClick={() => handlePhotoClick(photo)}>
                            <CardMedia
                              component="img"
                              image={photo.image_url}
                              alt={photo.caption || event.title}
                              sx={{
                                height: 280,
                                objectFit: "cover",
                              }}
                            />
                            {photo.caption && (
                              <CardContent sx={{ p: 1.5 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={500}
                                  noWrap
                                  title={photo.caption}
                                >
                                  {photo.caption}
                                </Typography>
                              </CardContent>
                            )}
                          </CardActionArea>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                );
              })}
              {photosWithoutEvent.length > 0 && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {t("otherPhotos")}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                      },
                      gap: 3,
                    }}
                  >
                    {photosWithoutEvent.map((photo) => (
                      <Card
                        key={photo.id}
                        sx={{
                          position: "relative",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: 4,
                            "& .photo-actions": {
                              opacity: 1,
                            },
                          },
                        }}
                      >
                        {canManageGallery && (
                          <Box
                            className="photo-actions"
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              zIndex: 10,
                              display: "flex",
                              gap: 0.5,
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              borderRadius: 1,
                              p: 0.5,
                              opacity: 0,
                              transition: "opacity 0.2s",
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPhotoDialog(photo);
                              }}
                              sx={{ color: "primary.main" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(photo.id);
                              }}
                              sx={{ color: "error.main" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                        <CardActionArea onClick={() => handlePhotoClick(photo)}>
                          <CardMedia
                            component="img"
                            image={photo.image_url}
                            alt={photo.caption || "Gallery photo"}
                            sx={{
                              height: 280,
                              objectFit: "cover",
                            }}
                          />
                          {photo.caption && (
                            <CardContent sx={{ p: 1.5 }}>
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                noWrap
                                title={photo.caption}
                              >
                                {photo.caption}
                              </Typography>
                            </CardContent>
                          )}
                        </CardActionArea>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          {dateGroups.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">
              {t("noPhotos")}
            </Typography>
          ) : (
            <Box>
              {dateGroups.map((yearMonth) => {
                const [year, month] = yearMonth.split("-");
                const monthName = new Date(
                  parseInt(year),
                  parseInt(month) - 1
                ).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                });
                const monthPhotos = photosByDate[yearMonth];

                return (
                  <Box key={yearMonth} sx={{ mb: 6 }}>
                    <Typography variant="h5" gutterBottom>
                      {monthName}
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, 1fr)",
                          md: "repeat(3, 1fr)",
                        },
                        gap: 3,
                      }}
                    >
                      {monthPhotos.map((photo) => (
                        <Card
                          key={photo.id}
                          sx={{
                            position: "relative",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: 4,
                              "& .photo-actions": {
                                opacity: 1,
                              },
                            },
                          }}
                        >
                          {canManageGallery && (
                            <Box
                              className="photo-actions"
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                zIndex: 10,
                                display: "flex",
                                gap: 0.5,
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                borderRadius: 1,
                                p: 0.5,
                                opacity: 0,
                                transition: "opacity 0.2s",
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPhotoDialog(photo);
                                }}
                                sx={{ color: "primary.main" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhoto(photo.id);
                                }}
                                sx={{ color: "error.main" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                          <CardActionArea onClick={() => handlePhotoClick(photo)}>
                            <CardMedia
                              component="img"
                              image={photo.image_url}
                              alt={photo.caption || "Gallery photo"}
                              sx={{
                                height: 280,
                                objectFit: "cover",
                              }}
                            />
                            {(photo.caption || photo.event_name) && (
                              <CardContent sx={{ p: 1.5 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={500}
                                  noWrap
                                  title={photo.caption || photo.event_name}
                                >
                                  {photo.caption || photo.event_name}
                                </Typography>
                                {photo.event_name && photo.caption && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                  >
                                    {photo.event_name}
                                  </Typography>
                                )}
                              </CardContent>
                            )}
                          </CardActionArea>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </TabPanel>

        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
          fullScreen={isMobile}
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
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                position: "absolute",
                right: { xs: 8, sm: 16 },
                top: { xs: 8, sm: 16 },
                color: "white",
                backgroundColor: alpha("#000", 0.6),
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                backdropFilter: "blur(10px)",
                "&:hover": {
                  backgroundColor: alpha("#000", 0.8),
                },
                zIndex: 1,
                transition: "all 0.2s",
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </IconButton>
            {selectedPhoto && (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxHeight: { xs: "100vh", sm: "90vh" },
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxHeight: { xs: "calc(100vh - 120px)", sm: "calc(90vh - 120px)" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha("#000", 0.3),
                    backdropFilter: "blur(10px)",
                    borderRadius: { xs: 0, sm: 2 },
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={selectedPhoto.image_url}
                    alt={selectedPhoto.caption || "Gallery photo"}
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: isMobile ? "calc(100vh - 120px)" : "calc(90vh - 120px)",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </Box>
                {(selectedPhoto.caption || selectedPhoto.event_name) && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: `linear-gradient(to top, ${alpha("#000", 0.9)} 0%, ${alpha("#000", 0.7)} 50%, transparent 100%)`,
                      color: "white",
                      p: 3,
                      pt: 4,
                    }}
                  >
                    {selectedPhoto.event_name && (
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                        }}
                      >
                        {selectedPhoto.event_name}
                      </Typography>
                    )}
                    {selectedPhoto.caption && (
                      <Typography
                        variant="body1"
                        sx={{
                          lineHeight: 1.6,
                        }}
                      >
                        {selectedPhoto.caption}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Upload Photo FAB */}
        {canManageGallery && (
          <Fab
            color="primary"
            aria-label="upload photo"
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
            }}
            onClick={() => handleOpenPhotoDialog()}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Photo Upload/Edit Dialog */}
        <Dialog
          open={photoDialogOpen}
          onClose={handleClosePhotoDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingPhoto ? "Edit Photo" : "Upload Photo"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <ImageUpload
                mode="single"
                bucket="event-photos"
                value={photoFormData.image_url}
                onChange={(url) =>
                  setPhotoFormData({ ...photoFormData, image_url: url as string })
                }
                label="Photo"
              />
              <TextField
                fullWidth
                label="Caption"
                value={photoFormData.caption}
                onChange={(e) =>
                  setPhotoFormData({ ...photoFormData, caption: e.target.value })
                }
                margin="normal"
                multiline
                rows={2}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Event (Optional)</InputLabel>
                <Select
                  value={photoFormData.event_id || ""}
                  onChange={(e) =>
                    setPhotoFormData({
                      ...photoFormData,
                      event_id: e.target.value || undefined,
                    })
                  }
                  label="Event (Optional)"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {events.map((event) => (
                    <MenuItem key={event.id} value={event.id}>
                      {event.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Taken Date"
                type="date"
                value={photoFormData.taken_at}
                onChange={(e) =>
                  setPhotoFormData({ ...photoFormData, taken_at: e.target.value })
                }
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePhotoDialog} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePhoto}
              variant="contained"
              disabled={uploading || !photoFormData.image_url}
            >
              {uploading ? "Saving..." : editingPhoto ? "Update" : "Upload"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};
