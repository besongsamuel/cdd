import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import {
  Box,
  Container,
  Dialog,
  DialogContent,
  Fab,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const imageListCols = isXs ? 1 : isSm ? 2 : 3;

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
            <ImageList
              variant="masonry"
              cols={imageListCols}
              gap={isXs ? 16 : isSm ? 24 : 32}
            >
              {photos.map((photo) => (
                <ImageListItem key={photo.id}>
                  <img
                    src={photo.image_url}
                    alt={photo.caption || "Gallery photo"}
                    loading="lazy"
                    style={{ cursor: "pointer", width: "100%", height: "auto" }}
                    onClick={() => handlePhotoClick(photo)}
                  />
                  {(photo.caption || photo.event_name) && (
                    <ImageListItemBar
                      title={photo.caption || photo.event_name}
                      subtitle={
                        photo.event_name && photo.caption
                          ? photo.event_name
                          : undefined
                      }
                      actionIcon={
                        <IconButton
                          sx={{ color: "rgba(255, 255, 255, 0.54)" }}
                          onClick={() => handlePhotoClick(photo)}
                          size="small"
                        >
                          <ZoomInIcon />
                        </IconButton>
                      }
                    />
                  )}
                </ImageListItem>
              ))}
            </ImageList>
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
                    <ImageList
                      variant="masonry"
                      cols={imageListCols}
                      gap={isXs ? 16 : isSm ? 24 : 32}
                    >
                      {eventPhotos.map((photo) => (
                        <ImageListItem key={photo.id}>
                          <img
                            src={photo.image_url}
                            alt={photo.caption || event.title}
                            loading="lazy"
                            style={{
                              cursor: "pointer",
                              width: "100%",
                              height: "auto",
                            }}
                            onClick={() => handlePhotoClick(photo)}
                          />
                          {photo.caption && (
                            <ImageListItemBar
                              title={photo.caption}
                              actionIcon={
                                <IconButton
                                  sx={{ color: "rgba(255, 255, 255, 0.54)" }}
                                  onClick={() => handlePhotoClick(photo)}
                                  size="small"
                                >
                                  <ZoomInIcon />
                                </IconButton>
                              }
                            />
                          )}
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Box>
                );
              })}
              {photosWithoutEvent.length > 0 && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {t("otherPhotos")}
                  </Typography>
                  <ImageList
                    variant="masonry"
                    cols={imageListCols}
                    gap={isXs ? 16 : isSm ? 24 : 32}
                  >
                    {photosWithoutEvent.map((photo) => (
                      <ImageListItem key={photo.id}>
                        <img
                          src={photo.image_url}
                          alt={photo.caption || "Gallery photo"}
                          loading="lazy"
                          style={{
                            cursor: "pointer",
                            width: "100%",
                            height: "auto",
                          }}
                          onClick={() => handlePhotoClick(photo)}
                        />
                        {photo.caption && (
                          <ImageListItemBar
                            title={photo.caption}
                            actionIcon={
                              <IconButton
                                sx={{ color: "rgba(255, 255, 255, 0.54)" }}
                                onClick={() => handlePhotoClick(photo)}
                                size="small"
                              >
                                <ZoomInIcon />
                              </IconButton>
                            }
                          />
                        )}
                      </ImageListItem>
                    ))}
                  </ImageList>
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
                    <ImageList
                      variant="masonry"
                      cols={imageListCols}
                      gap={isXs ? 16 : isSm ? 24 : 32}
                    >
                      {monthPhotos.map((photo) => (
                        <ImageListItem key={photo.id}>
                          <img
                            src={photo.image_url}
                            alt={photo.caption || "Gallery photo"}
                            loading="lazy"
                            style={{
                              cursor: "pointer",
                              width: "100%",
                              height: "auto",
                            }}
                            onClick={() => handlePhotoClick(photo)}
                          />
                          {(photo.caption || photo.event_name) && (
                            <ImageListItemBar
                              title={photo.caption || photo.event_name}
                              subtitle={
                                photo.event_name && photo.caption
                                  ? photo.event_name
                                  : undefined
                              }
                              actionIcon={
                                <IconButton
                                  sx={{ color: "rgba(255, 255, 255, 0.54)" }}
                                  onClick={() => handlePhotoClick(photo)}
                                  size="small"
                                >
                                  <ZoomInIcon />
                                </IconButton>
                              }
                            />
                          )}
                        </ImageListItem>
                      ))}
                    </ImageList>
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
            }}
          >
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                position: "absolute",
                right: { xs: 8, sm: 8 },
                top: { xs: 8, sm: 8 },
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                },
                zIndex: 1,
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </IconButton>
            {selectedPhoto && (
              <Box>
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.caption || "Gallery photo"}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    maxHeight: "90vh",
                    objectFit: "contain",
                  }}
                />
                {(selectedPhoto.caption || selectedPhoto.event_name) && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                      p: 2,
                    }}
                  >
                    {selectedPhoto.event_name && (
                      <Typography variant="subtitle1" gutterBottom>
                        {selectedPhoto.event_name}
                      </Typography>
                    )}
                    {selectedPhoto.caption && (
                      <Typography variant="body2">
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
            onClick={() => {
              // Navigate to admin gallery page for now
              window.location.href = "/admin/gallery";
            }}
          >
            <AddIcon />
          </Fab>
        )}
      </Container>
    </>
  );
};
