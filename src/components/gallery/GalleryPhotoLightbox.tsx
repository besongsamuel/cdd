import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  alpha,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { GalleryPhoto } from "../../types";

interface GalleryPhotoLightboxProps {
  open: boolean;
  photos: GalleryPhoto[];
  initialIndex?: number;
  onClose: () => void;
  showEventName?: boolean;
}

export const GalleryPhotoLightbox = ({
  open,
  photos,
  initialIndex = 0,
  onClose,
  showEventName = true,
}: GalleryPhotoLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 600);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || photos.length === 0) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, photos.length, onClose]);

  const selectedPhoto = photos[currentIndex];
  const canNavigate = photos.length > 1;

  const handlePrevious = () => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
            <IconButton
              onClick={onClose}
              sx={{
                position: "absolute",
                right: { xs: 8, sm: 16 },
                top: { xs: 8, sm: 16 },
                color: "white",
                backgroundColor: alpha("#000", 0.6),
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                backdropFilter: "blur(10px)",
                "&:hover": { backgroundColor: alpha("#000", 0.8) },
                zIndex: 2,
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </IconButton>

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
                    "&:hover": { backgroundColor: alpha("#000", 0.8) },
                    zIndex: 2,
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
                    "&:hover": { backgroundColor: alpha("#000", 0.8) },
                    zIndex: 2,
                  }}
                >
                  <ArrowRightIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                </IconButton>
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
                    {currentIndex + 1} / {photos.length}
                  </Typography>
                </Box>
              </>
            )}

            <Box
              sx={{
                width: "100%",
                maxHeight: {
                  xs: "calc(100vh - 120px)",
                  sm: "calc(90vh - 120px)",
                },
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
                  maxHeight: isMobile
                    ? "calc(100vh - 120px)"
                    : "calc(90vh - 120px)",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </Box>

            {(selectedPhoto.caption ||
              (showEventName && selectedPhoto.event_name)) && (
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
                {showEventName && selectedPhoto.event_name && (
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {selectedPhoto.event_name}
                  </Typography>
                )}
                {selectedPhoto.caption && (
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    {selectedPhoto.caption}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
