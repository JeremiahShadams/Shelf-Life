/**
 * Fresco — Notifications service
 * Wraps GET /api/notifications (user's expiry alerts).
 */

import { api } from "./api";
import type { NotificationListResponse } from "../types/api";

export function listNotifications(token: string): Promise<NotificationListResponse> {
  return api.get<NotificationListResponse>("/api/notifications", token);
}
