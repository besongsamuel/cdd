import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { eventRsvpsService } from "../../services/eventRsvpsService";
import type { EventRsvpCounts, EventRsvpStatus } from "../../types";

interface EventRsvpSectionProps {
  eventId: string;
}

const RSVP_OPTIONS: {
  status: EventRsvpStatus;
  labelKey: "rsvp.attending" | "rsvp.maybe" | "rsvp.notAttending";
  icon: React.ReactNode;
  color: "success" | "warning" | "inherit";
}[] = [
  {
    status: "attending",
    labelKey: "rsvp.attending",
    icon: <CheckCircleIcon />,
    color: "success",
  },
  {
    status: "maybe",
    labelKey: "rsvp.maybe",
    icon: <HelpOutlineIcon />,
    color: "warning",
  },
  {
    status: "not_attending",
    labelKey: "rsvp.notAttending",
    icon: <CancelIcon />,
    color: "inherit",
  },
];

const emptyCounts = (): EventRsvpCounts => ({
  attending: 0,
  maybe: 0,
  not_attending: 0,
});

export const EventRsvpSection = ({ eventId }: EventRsvpSectionProps) => {
  const { t } = useTranslation("events");
  const { user, currentMember } = useAuth();

  const [counts, setCounts] = useState<EventRsvpCounts>(emptyCounts);
  const [selectedStatus, setSelectedStatus] = useState<EventRsvpStatus | null>(
    null
  );
  const [guestName, setGuestName] = useState("");
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<EventRsvpStatus | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [loadingRsvp, setLoadingRsvp] = useState(true);
  const [rsvpMessage, setRsvpMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const refreshCounts = useCallback(async () => {
    const countData = await eventRsvpsService.getCounts(eventId);
    setCounts(countData);
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;

    const loadRsvp = async () => {
      setLoadingRsvp(true);
      try {
        const [countData, existingRsvp] = await Promise.all([
          eventRsvpsService.getCounts(eventId),
          eventRsvpsService.getForVisitor(eventId),
        ]);
        if (cancelled) return;
        setCounts(countData);
        if (existingRsvp) {
          setSelectedStatus(existingRsvp.status);
          if (existingRsvp.guest_name) {
            setGuestName(existingRsvp.guest_name);
          }
        }
      } catch (err) {
        console.error("Error loading RSVP:", err);
      } finally {
        if (!cancelled) {
          setLoadingRsvp(false);
        }
      }
    };

    void loadRsvp();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (currentMember?.name && !guestName) {
      setGuestName(currentMember.name);
    }
  }, [currentMember, guestName]);

  const submitRsvp = async (
    status: EventRsvpStatus,
    nameOverride?: string
  ) => {
    const name = nameOverride ?? guestName;
    if (!user && (!name || !name.trim())) {
      setPendingStatus(status);
      setNameDialogOpen(true);
      return;
    }

    setSubmitting(true);
    setRsvpMessage(null);
    try {
      const result = await eventRsvpsService.upsert({
        eventId,
        status,
        guestName: user ? currentMember?.name || name : name.trim(),
        memberId: currentMember?.id,
      });
      setSelectedStatus(result.rsvp.status);
      await refreshCounts();
      setRsvpMessage({ type: "success", text: t("rsvp.saved") });
    } catch (err) {
      console.error("RSVP error:", err);
      setRsvpMessage({ type: "error", text: t("rsvp.error") });
    } finally {
      setSubmitting(false);
      setNameDialogOpen(false);
      setPendingStatus(null);
    }
  };

  const handleNameDialogSubmit = () => {
    if (!guestName.trim()) {
      setRsvpMessage({ type: "error", text: t("rsvp.guestNameRequired") });
      return;
    }
    if (pendingStatus) {
      void submitRsvp(pendingStatus, guestName.trim());
    }
  };

  const statusLabel = (status: EventRsvpStatus) => {
    const option = RSVP_OPTIONS.find((o) => o.status === status);
    return option ? t(option.labelKey) : status;
  };

  const countItems: {
    key: string;
    label: string;
    color: string;
    bgcolor: (theme: Theme) => string;
  }[] = [
    {
      key: "attending",
      label: t("rsvp.countsAttending", { count: counts.attending }),
      color: "success.main",
      bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
    },
    {
      key: "maybe",
      label: t("rsvp.countsMaybe", { count: counts.maybe }),
      color: "warning.main",
      bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
    },
    {
      key: "not_attending",
      label: t("rsvp.countsNotAttending", { count: counts.not_attending }),
      color: "text.secondary",
      bgcolor: (theme) => alpha(theme.palette.grey[500], 0.1),
    },
  ];

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
          {t("rsvp.title")}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 1.5,
            mb: 2.5,
          }}
        >
          {countItems.map((item) => (
            <Box
              key={item.key}
              sx={{
                p: 1.5,
                borderRadius: 2,
                textAlign: { xs: "left", sm: "center" },
                bgcolor: item.bgcolor,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: item.color,
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {selectedStatus && !loadingRsvp && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, wordBreak: "break-word" }}
          >
            {t("rsvp.yourResponse")}: {statusLabel(selectedStatus)}
          </Typography>
        )}

        {rsvpMessage && (
          <Alert severity={rsvpMessage.type} sx={{ mb: 2 }}>
            {rsvpMessage.text}
          </Alert>
        )}

        <Stack
          spacing={1.5}
          direction={{ xs: "column", md: "row" }}
          sx={{ width: "100%" }}
        >
          {RSVP_OPTIONS.map(({ status, labelKey, icon, color }) => (
            <Button
              key={status}
              fullWidth
              variant={selectedStatus === status ? "contained" : "outlined"}
              color={color}
              startIcon={icon}
              disabled={submitting || loadingRsvp}
              onClick={() => void submitRsvp(status)}
              sx={{
                minHeight: 48,
                py: 1.25,
                px: 2,
                justifyContent: { xs: "flex-start", md: "center" },
                textAlign: "left",
                whiteSpace: "normal",
                lineHeight: 1.35,
                flex: { md: 1 },
              }}
            >
              {t(labelKey)}
            </Button>
          ))}
        </Stack>

        {!user && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, wordBreak: "break-word" }}
          >
            {t("rsvp.guestNameLabel")}: {guestName || "—"}
            <MuiLink
              component="button"
              type="button"
              sx={{ ml: 0.5, verticalAlign: "baseline" }}
              onClick={() => setNameDialogOpen(true)}
            >
              {guestName ? t("rsvp.editName") : t("rsvp.addName")}
            </MuiLink>
          </Typography>
        )}
      </Paper>

      <Dialog
        open={nameDialogOpen}
        onClose={() => !submitting && setNameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("rsvp.guestNameLabel")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("rsvp.guestNameLabel")}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 2, pb: 2 }}>
          <Button
            onClick={() => setNameDialogOpen(false)}
            disabled={submitting}
            fullWidth
            sx={{ flex: { xs: "1 1 100%", sm: "0 1 auto" } }}
          >
            {t("rsvp.cancel")}
          </Button>
          <Button
            onClick={handleNameDialogSubmit}
            variant="contained"
            disabled={submitting}
            fullWidth
            sx={{ flex: { xs: "1 1 100%", sm: "0 1 auto" } }}
          >
            {submitting ? t("rsvp.submitting") : t("rsvp.ok")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
