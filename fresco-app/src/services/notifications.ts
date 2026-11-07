/**
 * Fresco — Notifications service
 * Wraps GET /api/notifications (user's expiry alerts).
 */

import { api } from "./api";
import type { NotificationItem, NotificationListResponse } from "../types/api";

export function listNotifications(token: string): Promise<NotificationListResponse> {
  return api.get<NotificationListResponse>("/api/notifications", token);
}

export function markNotificationRead(
  token: string,
  notificationId: number
): Promise<NotificationItem> {
  return api.patch<NotificationItem>(`/api/notifications/${notificationId}/read`, {}, token);
}

export function markAllNotificationsRead(
  token: string
): Promise<{ message: string; count: number }> {
  return api.post<{ message: string; count: number }>("/api/notifications/mark-all-read", {}, token);
}
