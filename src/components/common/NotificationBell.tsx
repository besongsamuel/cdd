import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useBoardNotifications } from "../../hooks/useBoardNotifications";
import { useAuth } from "../../hooks/useAuth";
import { messageBoardsService } from "../../services/messageBoardsService";
import type { Notification } from "../../types";

export const NotificationBell = () => {
  const { user } = useAuth();
  const { t } = useTranslation("messageBoards");
  const navigate = useNavigate();
  const { requestBrowserPermission } = useBoardNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEnablePrompt, setShowEnablePrompt] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await messageBoardsService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 60_000);
    return () => clearInterval(interval);
  }, [user, loadNotifications]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      setShowEnablePrompt(true);
    }
  }, []);

  if (!user) return null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    loadNotifications();
  };

  const handleClose = () => setAnchorEl(null);

  const getNotificationLabel = (notification: Notification) => {
    if (notification.type === "thread_mention") {
      return t("notifications.mentionedOnBoard", {
        board: notification.board_name || t("notifications.board"),
      });
    }
    if (notification.type === "unseen_replies") {
      return t("notifications.unseenReplies", {
        board: notification.board_name || t("notifications.board"),
      });
    }
    if (notification.thread_title) {
      return notification.thread_title;
    }
    return notification.board_name || t("notifications.activity");
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await messageBoardsService.markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
    }
    handleClose();
    if (notification.board_id && notification.thread_id) {
      navigate(
        `/message-boards/${notification.board_id}/threads/${notification.thread_id}`
      );
    } else if (notification.board_id) {
      navigate(`/message-boards/${notification.board_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    await messageBoardsService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleEnableBrowser = async () => {
    const result = await requestBrowserPermission();
    if (result === "granted" || result === "denied") {
      setShowEnablePrompt(false);
    }
  };

  return (
    <>
      <Tooltip title={t("notifications.title")}>
        <IconButton
          onClick={handleOpen}
          sx={{
            minWidth: 44,
            minHeight: 44,
            color: "text.primary",
          }}
          aria-label={t("notifications.title")}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {unreadCount > 0 ? (
              <NotificationsIcon fontSize="small" />
            ) : (
              <NotificationsNoneIcon fontSize="small" />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxHeight: 480,
              borderRadius: 2,
              mt: 1,
            },
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {t("notifications.title")}
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              {t("notifications.markAllRead")}
            </Button>
          )}
        </Box>

        {showEnablePrompt && (
          <Box
            sx={{
              mx: 2,
              mb: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t("notifications.enableBrowser")}
            </Typography>
            <Button size="small" variant="outlined" onClick={handleEnableBrowser}>
              {t("notifications.enable")}
            </Button>
          </Box>
        )}

        <Divider />

        {loading && notifications.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t("notifications.loading")}
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t("notifications.empty")}
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 360, overflow: "auto" }}>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.is_read
                    ? "transparent"
                    : (theme) => alpha(theme.palette.primary.main, 0.04),
                }}
              >
                <ListItemText
                  primary={getNotificationLabel(notification)}
                  secondary={new Date(notification.created_at).toLocaleString()}
                  primaryTypographyProps={{
                    fontWeight: notification.is_read ? 400 : 600,
                    fontSize: "0.875rem",
                  }}
                  secondaryTypographyProps={{ fontSize: "0.75rem" }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};
