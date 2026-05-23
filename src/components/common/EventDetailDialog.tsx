import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import type { Event } from "../../types";

interface EventDetailDialogProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  canManage?: boolean;
}

export const EventDetailDialog = ({
  open,
  event,
  onClose,
  onEdit,
  onDelete,
  canManage = false,
}: EventDetailDialogProps) => {
  const { t } = useTranslation("events");

  if (!event) return null;

  const handleDelete = () => {
    if (onDelete && window.confirm("Are you sure you want to delete this event?")) {
      onDelete(event.id);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" component="div">
          {event.title}
        </Typography>
        {canManage && (
          <Box>
            {onEdit && (
              <IconButton
                onClick={() => {
                  onEdit(event);
                  onClose();
                }}
                color="primary"
                size="small"
              >
                <EditIcon />
              </IconButton>
            )}
            {onDelete && (
              <IconButton onClick={handleDelete} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {event.image_url && (
            <Box
              component="img"
              src={event.image_url}
              alt={event.title}
              sx={{
                width: "100%",
                maxHeight: 200,
                objectFit: "cover",
                borderRadius: 1,
              }}
            />
          )}

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t("date")}
            </Typography>
            <Typography variant="body1">{formatDate(event.event_date)}</Typography>
          </Box>

          {event.event_time && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("time")}
                </Typography>
                <Typography variant="body1">{event.event_time}</Typography>
              </Box>
            </>
          )}

          {event.location && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("location")}
                </Typography>
                <Typography variant="body1">{event.location}</Typography>
              </Box>
            </>
          )}

          {event.description && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("description")}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {event.description}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 2, pb: 2 }}>
        {event.slug && (
          <Button
            component={RouterLink}
            to={`/events/${event.slug}`}
            variant="contained"
            startIcon={<OpenInNewIcon />}
            onClick={onClose}
          >
            {t("viewEventPage")}
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
