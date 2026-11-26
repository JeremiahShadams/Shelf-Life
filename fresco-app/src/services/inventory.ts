/**
 * Fresco — Inventory service
 * Wraps /api/inventory for signed-in accounts, and persists guest-mode inventory
 * locally via AsyncStorage so closing the app never wipes tracked produce.
 * Automatically schedules/cancels local expiry notifications on item changes.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, ApiError } from "./api";
import { getFruit } from "./fruits";
import {
  cancelItemExpiryReminder,
  scheduleItemExpiryReminder,
} from "./localNotifications";
import type {
  InventoryItem,
  InventoryItemCreate,
  InventoryItemUpdate,
  InventoryListResponse,
  ItemStatus,
  MessageResponse,
  StorageMethod,
} from "../types/api";

const GUEST_TOKEN = "guest_demo_token";
const GUEST_STORAGE_KEY = "fresco.guest.inventory.v1";
const DAY_MS = 86_400_000;

let guestItems: InventoryItem[] = [];
let guestNextId = 1;
let guestHydrated = false;

async function ensureGuestHydrated(): Promise<void> {
  if (guestHydrated) return;
  try {
    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { items?: InventoryItem[]; nextId?: number };
      if (Array.isArray(parsed.items)) {
        guestItems = parsed.items;
        const maxId = guestItems.reduce((acc, it) => Math.max(acc, it.id), 0);
        guestNextId = Math.max(parsed.nextId ?? 1, maxId + 1);
      }
    }
  } catch {
    // ignore corrupted local cache
  } finally {
    guestHydrated = true;
  }
}

async function persistGuestState(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify({ items: guestItems, nextId: guestNextId }),
    );
  } catch {
    // ignore write failures
  }
}

export async function getGuestItemsSnapshot(): Promise<InventoryItem[]> {
  await ensureGuestHydrated();
  return guestItems.filter((i) => !i.is_consumed).map(withLiveState);
}

function computeDaysLeft(estimatedExpiry: string): number {
  return (new Date(estimatedExpiry).getTime() - Date.now()) / DAY_MS;
}

function computeStatus(daysLeft: number): ItemStatus {
  if (daysLeft <= 0) return "SPOILED";
  if (daysLeft < 2) return "EAT_TODAY";
  if (daysLeft <= 4) return "EAT_SOON";
  return "FRESH";
}

function withLiveState(item: InventoryItem): InventoryItem {
  const daysLeft = computeDaysLeft(item.estimated_expiry);
  return {
    ...item,
    days_left: daysLeft,
    status: computeStatus(daysLeft),
    is_expired: daysLeft <= 0,
  };
}

function shelfLifeDays(fruit: InventoryItem["fruit"], storage: StorageMethod): number {
  if (storage === "room_temp") return fruit.shelf_life_room_temp_days;
  if (storage === "freezer") return fruit.shelf_life_freezer_days;
  return fruit.shelf_life_fridge_days;
}

function guestList(): InventoryListResponse {
  const items = guestItems.filter((item) => !item.is_consumed).map(withLiveState);
  return {
    items,
    total: items.length,
    expiring_soon: items.filter((i) => (i.days_left ?? 0) > 0 && (i.days_left ?? 0) <= 2).length,
    expired: items.filter((i) => (i.days_left ?? 0) <= 0).length,
  };
}

export async function listInventory(token: string): Promise<InventoryListResponse> {
  await ensureGuestHydrated();
  if (token === GUEST_TOKEN) return guestList();

  try {
    return await api.get<InventoryListResponse>("/api/inventory/", token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) {
      return guestList();
    }
    throw err;
  }
}

export async function getInventoryItem(token: string, itemId: number): Promise<InventoryItem> {
  await ensureGuestHydrated();
  if (token === GUEST_TOKEN) {
    const item = guestItems.find((i) => i.id === itemId);
    if (item == null) throw new Error("Inventory item not found");
    return withLiveState(item);
  }

  try {
    return await api.get<InventoryItem>(`/api/inventory/${itemId}`, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) {
      const item = guestItems.find((i) => i.id === itemId);
      if (item != null) return withLiveState(item);
    }
    throw err;
  }
}

async function addGuestItem(body: InventoryItemCreate): Promise<InventoryItem> {
  await ensureGuestHydrated();
  const fruit = await getFruit(body.fruit_id);
  const storage = body.storage_method ?? "fridge";
  const days = shelfLifeDays(fruit, storage);
  const now = Date.now();

  const item: InventoryItem = {
    id: guestNextId++,
    user_id: 1,
    fruit_id: fruit.id,
    freshness_score: body.freshness_score ?? 1,
    storage_method: storage,
    estimated_days_remaining: days,
    scanned_at: new Date(now).toISOString(),
    estimated_expiry: new Date(now + days * DAY_MS).toISOString(),
    is_expired: false,
    is_consumed: false,
    image_path: body.image_path ?? null,
    quantity: body.quantity ?? 1,
    notes: body.notes ?? null,
    days_left: days,
    status: computeStatus(days),
    fruit,
  };

  guestItems = [item, ...guestItems];
  await persistGuestState();
  const live = withLiveState(item);
  void scheduleItemExpiryReminder(live);
  return live;
}

export async function addToInventory(
  token: string,
  body: InventoryItemCreate,
): Promise<InventoryItem> {
  if (token !== GUEST_TOKEN) {
    try {
      const created = await api.post<InventoryItem>("/api/inventory/", body, token);
      void scheduleItemExpiryReminder(created);
      return created;
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        return addGuestItem(body);
      }
      throw err;
    }
  }

  return addGuestItem(body);
}

export async function updateInventoryItem(
  token: string,
  itemId: number,
  body: InventoryItemUpdate,
): Promise<InventoryItem> {
  await ensureGuestHydrated();
  if (token !== GUEST_TOKEN) {
    try {
      const synced = await api.patch<InventoryItem>(`/api/inventory/${itemId}`, body, token);
      if (body.is_consumed) {
        void cancelItemExpiryReminder(itemId);
      } else if (body.storage_method != null) {
        void scheduleItemExpiryReminder(synced);
      }
      return synced;
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 0)) {
        throw err;
      }
      // Fall through to local cache update if offline
    }
  }

  const index = guestItems.findIndex((i) => i.id === itemId);
  if (index === -1) throw new Error("Inventory item not found");
  const current = guestItems[index];

  let updated: InventoryItem = {
    ...current,
    quantity: body.quantity ?? current.quantity,
    notes: body.notes ?? current.notes,
    is_consumed: body.is_consumed ?? current.is_consumed,
  };

  if (body.storage_method != null && body.storage_method !== current.storage_method) {
    const now = Date.now();
    const expiry = new Date(current.estimated_expiry).getTime();
    const scanned = new Date(current.scanned_at).getTime();
    const total = Math.max(expiry - scanned, 60_000);
    const fractionLeft = Math.min(Math.max((expiry - now) / total, 0), 1);
    const fullLife = shelfLifeDays(current.fruit, body.storage_method);
    const newDays = fullLife * fractionLeft;

    updated = {
      ...updated,
      storage_method: body.storage_method,
      estimated_days_remaining: newDays,
      estimated_expiry: new Date(now + newDays * DAY_MS).toISOString(),
    };
  }

  guestItems[index] = updated;
  await persistGuestState();

  const live = withLiveState(updated);
  if (live.is_consumed) {
    void cancelItemExpiryReminder(itemId);
  } else if (body.storage_method != null) {
    void scheduleItemExpiryReminder(live);
  }
  return live;
}

export async function deleteInventoryItem(token: string, itemId: number): Promise<MessageResponse> {
  await ensureGuestHydrated();
  void cancelItemExpiryReminder(itemId);

  if (token !== GUEST_TOKEN) {
    try {
      return await api.delete<MessageResponse>(`/api/inventory/${itemId}`, token);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 0)) {
        throw err;
      }
    }
  }

  guestItems = guestItems.filter((i) => i.id !== itemId);
  await persistGuestState();
  return { message: "Removed", success: true };
}

export async function clearGuestInventory(): Promise<void> {
  const prev = guestItems;
  guestItems = [];
  guestNextId = 1;
  guestHydrated = true;
  for (const item of prev) {
    void cancelItemExpiryReminder(item.id);
  }
  try {
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // ignore
  }
}
