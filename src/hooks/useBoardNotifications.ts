import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { messageBoardsService } from "../services/messageBoardsService";
import type { Notification } from "../types";
import { useAuth } from "./useAuth";

const POLL_INTERVAL_MS = 60_000;
const STORAGE_KEY = "board_notifications_last_seen_id";

export function useBoardNotifications() {
  const { user } = useAuth();
  const { t } = useTranslation("messageBoards");
  const navigate = useNavigate();
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const showBrowserNotification = useCallback(
    (notification: Notification) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const boardName = notification.board_name || t("notifications.board");
      const title = t("notifications.mentionedYouTitle");
      const body = t("notifications.mentionedYou", {
        name: notification.message_preview?.split(" ")[0] || "",
        board: boardName,
      });

      const browserNotif = new Notification(title, {
        body:
          notification.type === "thread_mention"
            ? `${boardName}${notification.thread_title ? ` — ${notification.thread_title}` : ""}`
            : body,
        icon: "/favicon.ico",
        tag: notification.id,
      });

      browserNotif.onclick = () => {
        window.focus();
        if (notification.board_id && notification.thread_id) {
          navigate(
            `/message-boards/${notification.board_id}/threads/${notification.thread_id}`
          );
        }
        browserNotif.close();
      };
    },
    [navigate, t]
  );

  const processNotifications = useCallback(
    (notifications: Notification[]) => {
      const mentionNotifications = notifications.filter(
        (n) => n.type === "thread_mention" && !n.is_read
      );

      if (!initializedRef.current) {
        mentionNotifications.forEach((n) => knownIdsRef.current.add(n.id));
        const lastSeen = sessionStorage.getItem(STORAGE_KEY);
        if (lastSeen) {
          knownIdsRef.current.add(lastSeen);
        }
        initializedRef.current = true;
        return;
      }

      for (const notification of mentionNotifications) {
        if (knownIdsRef.current.has(notification.id)) continue;
        knownIdsRef.current.add(notification.id);
        sessionStorage.setItem(STORAGE_KEY, notification.id);
        showBrowserNotification(notification);
      }
    },
    [showBrowserNotification]
  );

  const poll = useCallback(async () => {
    if (!user) return;
    try {
      const notifications = await messageBoardsService.getNotifications();
      processNotifications(notifications);
    } catch (error) {
      console.error("Error polling board notifications:", error);
    }
  }, [user, processNotifications]);

  useEffect(() => {
    if (!user) return;

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, poll]);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied" as NotificationPermission;
    }
    if (Notification.permission === "granted") {
      return "granted";
    }
    if (Notification.permission !== "denied") {
      return Notification.requestPermission();
    }
    return Notification.permission;
  }, []);

  return { requestBrowserPermission };
}
