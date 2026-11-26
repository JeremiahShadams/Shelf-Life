/**
 * Fresco — Notification hooks (TanStack Query)
 * For signed-in accounts, fetches backend alerts; for guest or offline sessions,
 * dynamically generates real in-app alert entries from persisted local inventory.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getGuestItemsSnapshot } from "../services/inventory";
import { buildLocalAlertItems } from "../services/localNotifications";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications";
import { useAuth } from "../stores/auth";
import type { NotificationListResponse } from "../types/api";

const NOTIFICATIONS_KEY = "notifications";

export function useNotifications() {
  const token = useAuth((s) => (s.status === "authed" ? s.token : null));

  return useQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: async (): Promise<NotificationListResponse> => {
      if (token === "guest_demo_token") {
        const items = await getGuestItemsSnapshot();
        const alerts = buildLocalAlertItems(items);
        return { items: alerts, total: alerts.length };
      }
      return listNotifications(token as string);
    },
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
      void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
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
      void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
}
