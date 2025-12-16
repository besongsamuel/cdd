import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";

interface DraggableProfileImageProps {
  imageUrl: string;
  alt: string;
  position: { x: number; y: number };
  isEditable: boolean;
  onPositionChange: (position: { x: number; y: number }) => void;
  height?: number | string;
}

export const DraggableProfileImage = ({
  imageUrl,
  alt,
  position,
  isEditable,
  onPositionChange,
  height = 250,
}: DraggableProfileImageProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState(position);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Update local position when prop changes
  useEffect(() => {
    setLocalPosition(position);
  }, [position]);

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isEditable) return;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStart || !containerRef.current || !imageRef.current)
      return;

    const container = containerRef.current;
    const image = imageRef.current;

    // Calculate the drag delta
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    // Get dimensions
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    // Calculate scale factor (how the image is scaled to fit the container)
    const imageAspect = imageWidth / imageHeight;
    const containerAspect = containerWidth / containerHeight;

    let scaledImageWidth: number;
    let scaledImageHeight: number;

    if (imageAspect > containerAspect) {
      // Image is wider - scale by height
      scaledImageHeight = containerHeight;
      scaledImageWidth = scaledImageHeight * imageAspect;
    } else {
      // Image is taller - scale by width
      scaledImageWidth = containerWidth;
      scaledImageHeight = scaledImageWidth / imageAspect;
    }

    // Convert pixel delta to percentage delta
    const percentDeltaX = (deltaX / scaledImageWidth) * 100;
    const percentDeltaY = (deltaY / scaledImageHeight) * 100;

    // Calculate new position with constraints
    const newX = Math.max(-50, Math.min(150, localPosition.x + percentDeltaX));
    const newY = Math.max(-50, Math.min(150, localPosition.y + percentDeltaY));

    setLocalPosition({ x: newX, y: newY });
    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStart(null);
    // Only call onPositionChange if position actually changed
    if (
      localPosition.x !== position.x ||
      localPosition.y !== position.y
    ) {
      onPositionChange(localPosition);
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, dragStart, localPosition]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        height,
        overflow: "hidden",
        cursor: isEditable ? (isDragging ? "grabbing" : "grab") : "default",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onMouseDown={isEditable ? handleMouseDown : undefined}
      onTouchStart={isEditable ? handleTouchStart : undefined}
    >
      {/* Edit indicator overlay */}
      {isEditable && !isDragging && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "white",
            borderRadius: 1,
            px: 1,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            fontSize: "12px",
            pointerEvents: "none",
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 16 }} />
          Drag to reposition
        </Box>
      )}

      {/* Dragging overlay */}
      {isDragging && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Image */}
      <Box
        component="img"
        ref={imageRef}
        src={imageUrl}
        alt={alt}
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${localPosition.x}% ${localPosition.y}%`,
          transition: isDragging ? "none" : "object-position 0.2s ease-out",
        }}
        draggable={false}
      />
    </Box>
  );
};

