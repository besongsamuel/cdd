import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import SearchIcon from "@mui/icons-material/Search";
import {
  alpha,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  IconButton,
  InputAdornment,
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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDateGroup, setSelectedDateGroup] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [viewingMode, setViewingMode] = useState<'list' | 'photos'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoFormData, setPhotoFormData] = useState({
    image_url: "" as string | string[],
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get current photos based on context - compute from state to avoid stale closures
      let currentPhotos: GalleryPhoto[] = [];
      if (dialogOpen && selectedPhoto) {
        if (selectedEventId) {
          if (selectedEventId === 'other') {
            currentPhotos = photos.filter((p) => !p.event_id);
          } else {
            currentPhotos = photos.filter((p) => p.event_id === selectedEventId);
          }
        } else if (selectedDateGroup) {
          const [year, month] = selectedDateGroup.split("-");
          currentPhotos = photos.filter((photo) => {
            const date = photo.taken_at ? new Date(photo.taken_at) : new Date(photo.created_at);
            return date.getFullYear() === parseInt(year) && 
                   date.getMonth() + 1 === parseInt(month);
          });
        }
      }

      if (e.key === 'ArrowLeft') {
        if (dialogOpen && currentPhotos.length > 0) {
          e.preventDefault();
          const newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : currentPhotos.length - 1;
          setCurrentPhotoIndex(newIndex);
          setSelectedPhoto(currentPhotos[newIndex]);
        }
      } else if (e.key === 'ArrowRight') {
        if (dialogOpen && currentPhotos.length > 0) {
          e.preventDefault();
          const newIndex = currentPhotoIndex < currentPhotos.length - 1 ? currentPhotoIndex + 1 : 0;
          setCurrentPhotoIndex(newIndex);
          setSelectedPhoto(currentPhotos[newIndex]);
        }
      } else if (e.key === 'Escape') {
        if (dialogOpen) {
          handleCloseDialog();
        } else if (viewingMode === 'photos') {
          setViewingMode('list');
          setSelectedEventId(null);
          setSelectedDateGroup(null);
          setCurrentPhotoIndex(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, viewingMode, selectedEventId, selectedDateGroup, currentPhotoIndex, selectedPhoto, photos]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    // Reset viewing mode when switching tabs
    setViewingMode('list');
    setSelectedEventId(null);
    setSelectedDateGroup(null);
    setCurrentPhotoIndex(0);
    setSearchQuery('');
  };

  const handlePhotoClick = (photo: GalleryPhoto) => {
    // Find the index of the photo in the current context
    let photoList: GalleryPhoto[] = [];
    if (selectedEventId) {
      photoList = selectedEventId === 'other' 
        ? photosWithoutEvent 
        : (photosByEvent[selectedEventId] || []);
    } else if (selectedDateGroup) {
      photoList = photosByDate[selectedDateGroup] || [];
    }
    
    const index = photoList.findIndex(p => p.id === photo.id);
    if (index !== -1) {
      setCurrentPhotoIndex(index);
    } else {
      setCurrentPhotoIndex(0);
    }
    
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
        image_url: [],
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
      image_url: [],
      caption: "",
      event_id: undefined,
      taken_at: "",
    });
  };

  const handleSavePhoto = async () => {
    const imageUrls = Array.isArray(photoFormData.image_url)
      ? photoFormData.image_url
      : photoFormData.image_url
      ? [photoFormData.image_url]
      : [];

    if (imageUrls.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    setUploading(true);
    try {
      if (editingPhoto) {
        // Editing single photo - use first image URL
        const photoData = {
          image_url: imageUrls[0],
          caption: photoFormData.caption || undefined,
          event_id: photoFormData.event_id || undefined,
          taken_at: photoFormData.taken_at || undefined,
        };
        await galleryService.update(editingPhoto.id, photoData);
      } else {
        // Creating multiple photos - create one for each uploaded image
        const photosToCreate = imageUrls.map((imageUrl) => ({
          image_url: imageUrl,
          caption: photoFormData.caption || undefined,
          event_id: photoFormData.event_id || undefined,
          taken_at: photoFormData.taken_at || undefined,
        }));
        await galleryService.createMultiple(photosToCreate);
      }
      handleClosePhotoDialog();
      // Reload photos
      const photosData = await galleryService.getAll();
      setPhotos(photosData);
    } catch (error) {
      console.error("Error saving photo(s):", error);
      alert("Failed to save photo(s)");
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

  // Filter events based on search query
  const filteredEvents = events.filter((event) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const eventPhotos = photosByEvent[event.id] || [];
    if (eventPhotos.length === 0) return false;
    
    return (
      event.title.toLowerCase().includes(query) ||
      (event.description && event.description.toLowerCase().includes(query)) ||
      event.location?.toLowerCase().includes(query) ||
      new Date(event.event_date).toLocaleDateString().toLowerCase().includes(query) ||
      event.event_time?.toLowerCase().includes(query)
    );
  });

  // Filter date groups based on search query
  const filteredDateGroups = dateGroups.filter((yearMonth) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const [year, month] = yearMonth.split("-");
    const monthName = new Date(
      parseInt(year),
      parseInt(month) - 1
    ).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    
    return (
      monthName.toLowerCase().includes(query) ||
      yearMonth.includes(query) ||
      year.includes(query) ||
      month.includes(query)
    );
  });

  // Filter photos without event based on search query
  const filteredPhotosWithoutEvent = photosWithoutEvent.filter((photo) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      photo.caption?.toLowerCase().includes(query) ||
      photo.event_name?.toLowerCase().includes(query)
    );
  });

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
            <Tab label={t("byEvent")} />
            <Tab label={t("byDate")} />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          {viewingMode === 'list' ? (
            <>
              <TextField
                fullWidth
                placeholder="Search events by title, description, date, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              {filteredEvents.length === 0 && filteredPhotosWithoutEvent.length === 0 ? (
                <Typography color="text.secondary" textAlign="center">
                  {searchQuery ? "No events found matching your search" : t("noEventPhotos")}
                </Typography>
              ) : (
                <Box>
                  {filteredEvents.map((event) => {
                const eventPhotos = photosByEvent[event.id] || [];
                if (eventPhotos.length === 0) return null;

                    const previewPhoto = eventPhotos[0];

                return (
                      <Card
                        key={event.id}
                        sx={{
                          mb: 2,
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: 4,
                          },
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                        }}
                        onClick={() => {
                          setSelectedEventId(event.id);
                          setViewingMode('photos');
                          setCurrentPhotoIndex(0);
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={previewPhoto.image_url}
                          alt={event.title}
                          sx={{
                            width: { xs: "100%", sm: 200 },
                            height: { xs: 200, sm: "auto" },
                            objectFit: "cover",
                          }}
                        />
                        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <Box>
                    <Typography variant="h5" gutterBottom>
                      {event.title}
                    </Typography>
                            {event.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                                sx={{
                                  mb: 1,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {event.description}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              {new Date(event.event_date).toLocaleDateString()}
                              {event.event_time && ` • ${event.event_time}`}
                              {event.location && ` • ${event.location}`}
                            </Typography>
                          </Box>
                          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                            <Chip
                              label={`${eventPhotos.length} photo${eventPhotos.length !== 1 ? 's' : ''}`}
                              color="primary"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredPhotosWithoutEvent.length > 0 && (
                    <Card
                      sx={{
                        mb: 2,
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: 4,
                        },
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                      }}
                      onClick={() => {
                        setSelectedEventId('other');
                        setViewingMode('photos');
                        setCurrentPhotoIndex(0);
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={filteredPhotosWithoutEvent[0].image_url}
                        alt={t("otherPhotos")}
                        sx={{
                          width: { xs: "100%", sm: 200 },
                          height: { xs: 200, sm: "auto" },
                          objectFit: "cover",
                        }}
                      />
                      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <Typography variant="h5">
                          {t("otherPhotos")}
                        </Typography>
                        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                          <Chip
                            label={`${filteredPhotosWithoutEvent.length} photo${filteredPhotosWithoutEvent.length !== 1 ? 's' : ''}`}
                            color="primary"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}
            </>
          ) : (
            <Box>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  setViewingMode('list');
                  setSelectedEventId(null);
                  setCurrentPhotoIndex(0);
                }}
                sx={{ mb: 3 }}
              >
                Back to Events
              </Button>
              {(() => {
                const currentPhotos = selectedEventId === 'other' 
                  ? photosWithoutEvent 
                  : (selectedEventId ? photosByEvent[selectedEventId] || [] : []);
                
                if (currentPhotos.length === 0) {
                  return (
                    <Typography color="text.secondary" textAlign="center">
                      No photos found
                    </Typography>
                  );
                }

                return (
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
                    {currentPhotos.map((photo) => (
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
                );
              })()}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {viewingMode === 'list' ? (
            <>
              <TextField
                fullWidth
                placeholder="Search by year or month (e.g., 2024, December, 12/2024)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              {filteredDateGroups.length === 0 ? (
                <Typography color="text.secondary" textAlign="center">
                  {searchQuery ? "No dates found matching your search" : t("noPhotos")}
                </Typography>
              ) : (
                <Box>
                  {filteredDateGroups.map((yearMonth) => {
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
                      <Card
                        key={yearMonth}
                        sx={{
                          mb: 2,
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: 4,
                          },
                        }}
                        onClick={() => {
                          setSelectedDateGroup(yearMonth);
                          setViewingMode('photos');
                          setCurrentPhotoIndex(0);
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="h5">
                      {monthName}
                            </Typography>
                            <Chip
                              label={`${monthPhotos.length} photo${monthPhotos.length !== 1 ? 's' : ''}`}
                              color="primary"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </>
          ) : (
            <Box>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  setViewingMode('list');
                  setSelectedDateGroup(null);
                  setCurrentPhotoIndex(0);
                }}
                sx={{ mb: 3 }}
              >
                Back to Dates
              </Button>
              {(() => {
                const currentPhotos = selectedDateGroup ? photosByDate[selectedDateGroup] || [] : [];
                
                if (currentPhotos.length === 0) {
                  return (
                    <Typography color="text.secondary" textAlign="center">
                      No photos found
                    </Typography>
                  );
                }

                return (
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
                    {currentPhotos.map((photo) => (
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
                );
              })()}
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
            {selectedPhoto && (() => {
              // Get current photos based on context
              let currentPhotos: GalleryPhoto[] = [];
              if (selectedEventId) {
                currentPhotos = selectedEventId === 'other' 
                  ? photosWithoutEvent 
                  : (photosByEvent[selectedEventId] || []);
              } else if (selectedDateGroup) {
                currentPhotos = photosByDate[selectedDateGroup] || [];
              }
              const totalPhotos = currentPhotos.length;
              const canNavigate = totalPhotos > 1;

              const handlePrevious = () => {
                if (canNavigate) {
                  const newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : totalPhotos - 1;
                  setCurrentPhotoIndex(newIndex);
                  setSelectedPhoto(currentPhotos[newIndex]);
                }
              };

              const handleNext = () => {
                if (canNavigate) {
                  const newIndex = currentPhotoIndex < totalPhotos - 1 ? currentPhotoIndex + 1 : 0;
                  setCurrentPhotoIndex(newIndex);
                  setSelectedPhoto(currentPhotos[newIndex]);
                }
              };

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
                  {/* Close Button */}
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
                      zIndex: 2,
                      transition: "all 0.2s",
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </IconButton>

                  {/* Navigation Arrows */}
                  {canNavigate && (
                    <>
                      <IconButton
                        onClick={handlePrevious}
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
                        onClick={handleNext}
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

                  {/* Image */}
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

                  {/* Caption */}
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
              );
            })()}
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
            {editingPhoto ? "Edit Photo" : "Upload Photos"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <ImageUpload
                mode={editingPhoto ? "single" : "multiple"}
                bucket="event-photos"
                value={photoFormData.image_url}
                onChange={(url) =>
                  setPhotoFormData({ ...photoFormData, image_url: url })
                }
                label={editingPhoto ? "Photo" : "Photos (you can upload multiple)"}
                maxFiles={20}
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
              disabled={
                uploading ||
                (Array.isArray(photoFormData.image_url)
                  ? photoFormData.image_url.length === 0
                  : !photoFormData.image_url)
              }
            >
              {uploading
                ? "Saving..."
                : editingPhoto
                ? "Update"
                : `Upload ${Array.isArray(photoFormData.image_url) ? `(${photoFormData.image_url.length})` : ""}`}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};
