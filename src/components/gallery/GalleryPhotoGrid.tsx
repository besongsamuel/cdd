import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
} from "@mui/material";
import type { GalleryPhoto } from "../../types";

interface GalleryPhotoGridProps {
  photos: GalleryPhoto[];
  canManage?: boolean;
  onPhotoClick: (photo: GalleryPhoto, index: number) => void;
  onEditPhoto?: (photo: GalleryPhoto) => void;
  onDeletePhoto?: (photoId: string) => void;
  emptyMessage?: string;
}

export const GalleryPhotoGrid = ({
  photos,
  canManage = false,
  onPhotoClick,
  onEditPhoto,
  onDeletePhoto,
  emptyMessage = "No photos found",
}: GalleryPhotoGridProps) => {
  if (photos.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center">
        {emptyMessage}
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
      {photos.map((photo, index) => (
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
          {canManage && onEditPhoto && onDeletePhoto && (
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
                opacity: { xs: 1, sm: 0 },
                transition: "opacity 0.2s",
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPhoto(photo);
                }}
                sx={{ color: "primary.main" }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePhoto(photo.id);
                }}
                sx={{ color: "error.main" }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
          <CardActionArea onClick={() => onPhotoClick(photo, index)}>
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
                  <Typography variant="caption" color="text.secondary" noWrap>
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
};
