import DeleteIcon from "@mui/icons-material/Delete";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import * as React from "react";

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onImageSelected: (file: File) => void;
  onImageRemove?: () => void;
  uploading?: boolean;
  label?: string;
  size?: "small" | "medium" | "large";
  aspectRatio?: "square" | "landscape";
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  onImageSelected,
  onImageRemove,
  uploading = false,
  label = "Profile Picture",
  size = "medium",
  aspectRatio = "square",
}) => {
  const [preview, setPreview] = React.useState<string | undefined>(
    currentImageUrl
  );

  React.useEffect(() => {
    setPreview(currentImageUrl);
  }, [currentImageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelected(file);
  };

  const handleRemove = () => {
    setPreview(undefined);
    if (onImageRemove) {
      onImageRemove();
    }
  };

  const sizeMap = {
    small: { avatar: 80, container: 120 },
    medium: { avatar: 150, container: 200 },
    large: { avatar: 200, container: 280 },
  };

  const dimensions = sizeMap[size];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        p: 3,
        border: "2px dashed",
        borderColor: "grey.300",
        borderRadius: 3,
        backgroundColor: "grey.50",
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: "primary.main",
          backgroundColor: "grey.100",
        },
      }}
    >
      <Typography variant="subtitle1" fontWeight={600}>
        {label}
      </Typography>

      <Box
        sx={{
          position: "relative",
          width: dimensions.container,
          height:
            aspectRatio === "landscape"
              ? dimensions.container * 0.6
              : dimensions.container,
        }}
      >
        {preview ? (
          <>
            <Box
              component="img"
              src={preview}
              alt="Preview"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 2,
                boxShadow: 2,
              }}
            />
            {uploading && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  borderRadius: 2,
                }}
              >
                <CircularProgress sx={{ color: "white" }} />
              </Box>
            )}
            {onImageRemove && !uploading && (
              <IconButton
                onClick={handleRemove}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "error.main",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "error.dark",
                  },
                }}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed",
              borderColor: "grey.400",
              borderRadius: 2,
              backgroundColor: "white",
            }}
          >
            <Avatar
              sx={{
                width: dimensions.avatar,
                height: dimensions.avatar,
                bgcolor: "grey.300",
                mb: 1,
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: dimensions.avatar * 0.5 }} />
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              No image selected
            </Typography>
          </Box>
        )}
      </Box>

      <Button
        variant="outlined"
        component="label"
        startIcon={<PhotoCameraIcon />}
        disabled={uploading}
        sx={{
          textTransform: "none",
        }}
      >
        {preview ? "Change Picture" : "Upload Picture"}
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </Button>

      <Typography variant="caption" color="text.secondary" textAlign="center">
        Recommended: JPG or PNG, max 5MB
      </Typography>
    </Box>
  );
};
