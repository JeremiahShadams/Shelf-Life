/**
 * Fresco — Notification hooks (TanStack Query)
 * The backend creates an expiry alert whenever an item is added, so this is
 * the read side of that flow. Guest sessions have no server rows and must
 * not fire a 401, so they resolve to an empty list locally.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notifications";
import { useAuth } from "../stores/auth";
import type { NotificationListResponse } from "../types/api";

const NOTIFICATIONS_KEY = "notifications";

const EMPTY_NOTIFICATIONS: NotificationListResponse = { items: [], total: 0 };

export function useNotifications() {
  const token = useAuth((s) => (s.status === "authed" ? s.token : null));

  return useQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: () =>
      token === "guest_demo_token"
        ? Promise.resolve(EMPTY_NOTIFICATIONS)
        : listNotifications(token as string),
    enabled: token != null,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const token = useAuth((s) => (s.status === "authed" ? s.token : null));

  return useMutation({
    mutationFn: (id: number) => {
      if (!token || token === "guest_demo_token") return Promise.resolve(null);
      return markNotificationRead(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const token = useAuth((s) => (s.status === "authed" ? s.token : null));

  return useMutation({
    mutationFn: () => {
      if (!token || token === "guest_demo_token") return Promise.resolve(null);
      return markAllNotificationsRead(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
}
