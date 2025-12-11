import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import { galleryService } from '../services/galleryService';
import { eventsService } from '../services/eventsService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { GalleryPhoto, Event } from '../types';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

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
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
        console.error('Error loading gallery:', error);
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
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[yearMonth]) acc[yearMonth] = [];
      acc[yearMonth].push(photo);
    } else {
      const date = new Date(photo.taken_at);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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
    <Container sx={{ py: 6 }}>
      <Typography variant="h3" component="h1" gutterBottom textAlign="center">
        Gallery
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Memories from our events and gatherings
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} centered>
          <Tab label="All Photos" />
          <Tab label="By Event" />
          <Tab label="By Date" />
        </Tabs>
      </Box>

      <TabPanel value={selectedTab} index={0}>
        {photos.length === 0 ? (
          <Typography color="text.secondary" textAlign="center">
            No photos available yet.
          </Typography>
        ) : (
          <ImageList variant="masonry" cols={3} gap={8}>
            {photos.map((photo) => (
              <ImageListItem key={photo.id}>
                <img
                  src={photo.image_url}
                  alt={photo.caption || 'Gallery photo'}
                  loading="lazy"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handlePhotoClick(photo)}
                />
                {(photo.caption || photo.event_name) && (
                  <ImageListItemBar
                    title={photo.caption || photo.event_name}
                    subtitle={photo.event_name && photo.caption ? photo.event_name : undefined}
                    actionIcon={
                      <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                        onClick={() => handlePhotoClick(photo)}
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
            No event photos available yet.
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
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    {new Date(event.event_date).toLocaleDateString()}
                  </Typography>
                  <ImageList variant="masonry" cols={3} gap={8}>
                    {eventPhotos.map((photo) => (
                      <ImageListItem key={photo.id}>
                        <img
                          src={photo.image_url}
                          alt={photo.caption || event.title}
                          loading="lazy"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handlePhotoClick(photo)}
                        />
                        {photo.caption && (
                          <ImageListItemBar
                            title={photo.caption}
                            actionIcon={
                              <IconButton
                                sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                onClick={() => handlePhotoClick(photo)}
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
                  Other Photos
                </Typography>
                <ImageList variant="masonry" cols={3} gap={8}>
                  {photosWithoutEvent.map((photo) => (
                    <ImageListItem key={photo.id}>
                      <img
                        src={photo.image_url}
                        alt={photo.caption || 'Gallery photo'}
                        loading="lazy"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handlePhotoClick(photo)}
                      />
                      {photo.caption && (
                        <ImageListItemBar
                          title={photo.caption}
                          actionIcon={
                            <IconButton
                              sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                              onClick={() => handlePhotoClick(photo)}
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
            No photos available yet.
          </Typography>
        ) : (
          <Box>
            {dateGroups.map((yearMonth) => {
              const [year, month] = yearMonth.split('-');
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              });
              const monthPhotos = photosByDate[yearMonth];

              return (
                <Box key={yearMonth} sx={{ mb: 6 }}>
                  <Typography variant="h5" gutterBottom>
                    {monthName}
                  </Typography>
                  <ImageList variant="masonry" cols={3} gap={8}>
                    {monthPhotos.map((photo) => (
                      <ImageListItem key={photo.id}>
                        <img
                          src={photo.image_url}
                          alt={photo.caption || 'Gallery photo'}
                          loading="lazy"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handlePhotoClick(photo)}
                        />
                        {(photo.caption || photo.event_name) && (
                          <ImageListItemBar
                            title={photo.caption || photo.event_name}
                            subtitle={photo.event_name && photo.caption ? photo.event_name : undefined}
                            actionIcon={
                              <IconButton
                                sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                onClick={() => handlePhotoClick(photo)}
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
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedPhoto && (
            <Box>
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.caption || 'Gallery photo'}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                }}
              />
              {(selectedPhoto.caption || selectedPhoto.event_name) && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    p: 2,
                  }}
                >
                  {selectedPhoto.event_name && (
                    <Typography variant="subtitle1" gutterBottom>
                      {selectedPhoto.event_name}
                    </Typography>
                  )}
                  {selectedPhoto.caption && (
                    <Typography variant="body2">{selectedPhoto.caption}</Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

