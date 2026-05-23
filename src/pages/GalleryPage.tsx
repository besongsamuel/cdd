import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Fab,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { GalleryPhotoFormDialog } from "../components/gallery/GalleryPhotoFormDialog";
import { GalleryPhotoGrid } from "../components/gallery/GalleryPhotoGrid";
import { GalleryPhotoLightbox } from "../components/gallery/GalleryPhotoLightbox";
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
  const navigate = useNavigate();
  const canManageGallery = useHasPermission("manage:gallery");

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingMode, setViewingMode] = useState<"list" | "photos">("list");
  const [selectedDateGroup, setSelectedDateGroup] = useState<string | null>(
    null
  );
  const [showOtherPhotos, setShowOtherPhotos] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);

  const reloadPhotos = useCallback(async () => {
    const photosData = await galleryService.getAll();
    setPhotos(photosData);
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
    void loadData();
  }, []);

  const photosByEvent = useMemo(
    () =>
      events.reduce(
        (acc, event) => {
          acc[event.id] = photos.filter((p) => p.event_id === event.id);
          return acc;
        },
        {} as Record<string, GalleryPhoto[]>
      ),
    [events, photos]
  );

  const photosWithoutEvent = useMemo(
    () => photos.filter((p) => !p.event_id),
    [photos]
  );

  const photosByDate = useMemo(() => {
    return photos.reduce(
      (acc, photo) => {
        const date = photo.taken_at
          ? new Date(photo.taken_at)
          : new Date(photo.created_at);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!acc[yearMonth]) acc[yearMonth] = [];
        acc[yearMonth].push(photo);
        return acc;
      },
      {} as Record<string, GalleryPhoto[]>
    );
  }, [photos]);

  const dateGroups = useMemo(
    () => Object.keys(photosByDate).sort().reverse(),
    [photosByDate]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventPhotos = photosByEvent[event.id] || [];
      if (eventPhotos.length === 0) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        (event.description &&
          event.description.toLowerCase().includes(query)) ||
        event.location?.toLowerCase().includes(query) ||
        new Date(event.event_date)
          .toLocaleDateString()
          .toLowerCase()
          .includes(query) ||
        event.event_time?.toLowerCase().includes(query)
      );
    });
  }, [events, photosByEvent, searchQuery]);

  const filteredDateGroups = useMemo(() => {
    return dateGroups.filter((yearMonth) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const [year, month] = yearMonth.split("-");
      const monthName = new Date(
        parseInt(year),
        parseInt(month) - 1
      ).toLocaleString("default", { month: "long", year: "numeric" });
      return (
        monthName.toLowerCase().includes(query) ||
        yearMonth.includes(query) ||
        year.includes(query) ||
        month.includes(query)
      );
    });
  }, [dateGroups, searchQuery]);

  const filteredPhotosWithoutEvent = useMemo(() => {
    if (!searchQuery.trim()) return photosWithoutEvent;
    const query = searchQuery.toLowerCase();
    return photosWithoutEvent.filter(
      (photo) =>
        photo.caption?.toLowerCase().includes(query) ||
        photo.event_name?.toLowerCase().includes(query)
    );
  }, [photosWithoutEvent, searchQuery]);

  const inlinePhotos = useMemo(() => {
    if (showOtherPhotos) return photosWithoutEvent;
    if (selectedDateGroup) return photosByDate[selectedDateGroup] || [];
    return [];
  }, [showOtherPhotos, photosWithoutEvent, selectedDateGroup, photosByDate]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setViewingMode("list");
    setSelectedDateGroup(null);
    setShowOtherPhotos(false);
    setSearchQuery("");
  };

  const handlePhotoClick = (_photo: GalleryPhoto, index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleOpenForm = (photo?: GalleryPhoto) => {
    setEditingPhoto(photo ?? null);
    setFormOpen(true);
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      await galleryService.delete(photoId);
      await reloadPhotos();
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo");
    }
  };

  const handleEventCardClick = (event: Event) => {
    if (event.slug) {
      navigate(`/events/${event.slug}/gallery`);
    }
  };

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
          {viewingMode === "list" ? (
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
              {filteredEvents.length === 0 &&
              filteredPhotosWithoutEvent.length === 0 ? (
                <Typography color="text.secondary" textAlign="center">
                  {searchQuery
                    ? "No events found matching your search"
                    : t("noEventPhotos")}
                </Typography>
              ) : (
                <Box>
                  {filteredEvents.map((event) => {
                    const eventPhotos = photosByEvent[event.id] || [];
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
                        onClick={() => handleEventCardClick(event)}
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
                        <CardContent
                          sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
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
                          <Box
                            sx={{
                              mt: 2,
                              display: "flex",
                              justifyContent: "flex-end",
                            }}
                          >
                            <Chip
                              label={`${eventPhotos.length} photo${eventPhotos.length !== 1 ? "s" : ""}`}
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
                        setShowOtherPhotos(true);
                        setViewingMode("photos");
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
                      <CardContent
                        sx={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="h5">{t("otherPhotos")}</Typography>
                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <Chip
                            label={`${filteredPhotosWithoutEvent.length} photo${filteredPhotosWithoutEvent.length !== 1 ? "s" : ""}`}
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
                  setViewingMode("list");
                  setShowOtherPhotos(false);
                }}
                sx={{ mb: 3 }}
              >
                Back to Events
              </Button>
              <GalleryPhotoGrid
                photos={inlinePhotos}
                canManage={canManageGallery}
                onPhotoClick={handlePhotoClick}
                onEditPhoto={canManageGallery ? handleOpenForm : undefined}
                onDeletePhoto={canManageGallery ? handleDeletePhoto : undefined}
              />
            </Box>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {viewingMode === "list" ? (
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
                  {searchQuery
                    ? "No dates found matching your search"
                    : t("noPhotos")}
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
                          setViewingMode("photos");
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography variant="h5">{monthName}</Typography>
                            <Chip
                              label={`${monthPhotos.length} photo${monthPhotos.length !== 1 ? "s" : ""}`}
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
                  setViewingMode("list");
                  setSelectedDateGroup(null);
                }}
                sx={{ mb: 3 }}
              >
                Back to Dates
              </Button>
              <GalleryPhotoGrid
                photos={inlinePhotos}
                canManage={canManageGallery}
                onPhotoClick={handlePhotoClick}
                onEditPhoto={canManageGallery ? handleOpenForm : undefined}
                onDeletePhoto={canManageGallery ? handleDeletePhoto : undefined}
              />
            </Box>
          )}
        </TabPanel>

        {canManageGallery && (
          <Fab
            color="primary"
            aria-label="upload photo"
            sx={{ position: "fixed", bottom: 24, right: 24 }}
            onClick={() => handleOpenForm()}
          >
            <AddIcon />
          </Fab>
        )}

        <GalleryPhotoLightbox
          open={lightboxOpen}
          photos={inlinePhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />

        <GalleryPhotoFormDialog
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingPhoto(null);
          }}
          onSaved={() => void reloadPhotos()}
          editingPhoto={editingPhoto}
          events={events}
        />
      </Container>
    </>
  );
};
