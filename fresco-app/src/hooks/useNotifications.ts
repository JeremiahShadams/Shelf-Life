/**
 * Fresco — Notification hooks (TanStack Query)
 * The backend creates an expiry alert whenever an item is added, so this is
 * the read side of that flow. Guest sessions have no server rows and must
 * not fire a 401, so they resolve to an empty list locally.
 */

import { useQuery } from "@tanstack/react-query";
import { listNotifications } from "../services/notifications";
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
