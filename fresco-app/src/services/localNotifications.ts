/**
 * Fresco — Local Device Expiry Notifications
 * Schedules real on-device reminders using expo-notifications so households
 * get alerted before produce spoils — zero backend push-server dependency.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from "expo-notifications";
import { Platform } from "react-native";
import type { InventoryItem, NotificationItem } from "../types/api";

const SCHEDULE_MAP_KEY = "fresco.local.notifications.v1";
const CHANNEL_ID = "fresco-expiry";

try {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Web or unsupported environment
}

async function readScheduleMap(): Promise<Record<string, string[]>> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULE_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

async function writeScheduleMap(map: Record<string, string[]>): Promise<void> {
  try {
    await AsyncStorage.setItem(SCHEDULE_MAP_KEY, JSON.stringify(map));
  } catch {
    // ignore persistence errors
  }
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await setNotificationChannelAsync(CHANNEL_ID, {
      name: "Produce Expiry Alerts",
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 150, 200],
      lightColor: "#D98327",
    });
  } catch {
    // ignore
  }
}

export async function requestLocalNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    await ensureNotificationChannel();
    const existing = await getPermissionsAsync();
    if (existing.granted) return true;
    const req = await requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

export async function cancelItemExpiryReminder(itemId: number): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const map = await readScheduleMap();
    const ids = map[String(itemId)];
    if (ids && ids.length > 0) {
      await Promise.all(
        ids.map((id) => cancelScheduledNotificationAsync(id).catch(() => undefined)),
      );
      delete map[String(itemId)];
      await writeScheduleMap(map);
    }
  } catch {
    // ignore
  }
}

export async function scheduleItemExpiryReminder(item: InventoryItem): Promise<void> {
  if (Platform.OS === "web" || item.is_consumed) return;

  try {
    await cancelItemExpiryReminder(item.id);

    const granted = await requestLocalNotificationPermission();
    if (!granted) return;

    const expiryMs = new Date(item.estimated_expiry).getTime();
    if (!Number.isFinite(expiryMs)) return;

    const now = Date.now();
    const DAY_MS = 86_400_000;
    const scheduledIds: string[] = [];

    const oneDayBefore = expiryMs - DAY_MS;
    if (oneDayBefore > now + 30_000) {
      const id = await scheduleNotificationAsync({
        content: {
          title: `Use your ${item.fruit.name} soon`,
          body: `${item.fruit.name} has about 1 day left before losing freshness.`,
          data: { itemId: item.id },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: new Date(oneDayBefore),
          channelId: CHANNEL_ID,
        },
      });
      scheduledIds.push(id);
    }

    const fourHoursBefore = expiryMs - 4 * 3_600_000;
    if (fourHoursBefore > now + 30_000) {
      const id = await scheduleNotificationAsync({
        content: {
          title: `Eat today: ${item.fruit.name}`,
          body: `Your ${item.fruit.name} reaches the end of its estimated shelf life today.`,
          data: { itemId: item.id },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: new Date(fourHoursBefore),
          channelId: CHANNEL_ID,
        },
      });
      scheduledIds.push(id);
    }

    if (scheduledIds.length > 0) {
      const map = await readScheduleMap();
      map[String(item.id)] = scheduledIds;
      await writeScheduleMap(map);
    }
  } catch {
    // Graceful no-op on restricted/unsupported builds
  }
}

export function buildLocalAlertItems(items: InventoryItem[]): NotificationItem[] {
  const alerts: NotificationItem[] = [];
  for (const item of items) {
    if (item.is_consumed) continue;
    const days = item.days_left ?? item.estimated_days_remaining;
    if (days <= 0) {
      alerts.push({
        id: item.id * 10 + 1,
        inventory_id: item.id,
        message: `${item.fruit.name} has passed its estimated shelf life. Check carefully before eating.`,
        notify_at: item.estimated_expiry,
        sent: false,
      });
    } else if (days <= 2) {
      alerts.push({
        id: item.id * 10 + 2,
        inventory_id: item.id,
        message: `${item.fruit.name} has ${Math.max(1, Math.ceil(days))} ${Math.ceil(days) === 1 ? "day" : "days"} left — plan to use it soon.`,
        notify_at: item.estimated_expiry,
        sent: false,
      });
    }
  }
  return alerts;
}
