/**
 * Fresco — Inventory service
 * Wraps /api/inventory. All calls need a bearer token (user-scoped data).
 *
 * Guest mode ("Explore as Guest") has no server account, so it keeps a
 * small in-memory inventory instead of firing 401s. The item shape and the
 * live days/status math mirror the backend so screens behave identically.
 */

import { api } from "./api";
import { getFruit } from "./fruits";
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
const DAY_MS = 86_400_000;

let guestItems: InventoryItem[] = [];
let guestNextId = 1;

function computeDaysLeft(estimatedExpiry: string): number {
  return (new Date(estimatedExpiry).getTime() - Date.now()) / DAY_MS;
}

function computeStatus(daysLeft: number): ItemStatus {
  if (daysLeft <= 0) return "SPOILED";
  if (daysLeft < 2) return "EAT_TODAY";
  if (daysLeft <= 4) return "EAT_SOON";
  return "FRESH";
}

/** Recompute the live fields the same way the API does at read time. */
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

export function listInventory(token: string): Promise<InventoryListResponse> {
  if (token === GUEST_TOKEN) return Promise.resolve(guestList());
  return api.get<InventoryListResponse>("/api/inventory/", token);
}

export function getInventoryItem(token: string, itemId: number): Promise<InventoryItem> {
  if (token === GUEST_TOKEN) {
    const item = guestItems.find((i) => i.id === itemId);
    if (item == null) return Promise.reject(new Error("Inventory item not found"));
    return Promise.resolve(withLiveState(item));
  }
  return api.get<InventoryItem>(`/api/inventory/${itemId}`, token);
}

export async function addToInventory(
  token: string,
  body: InventoryItemCreate,
): Promise<InventoryItem> {
  if (token !== GUEST_TOKEN) {
    return api.post<InventoryItem>("/api/inventory/", body, token);
  }

  // Guest add: the fruit reference table is public, so fetch the real row
  // and store a local copy with the same deadline math.
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
  return withLiveState(item);
}

export async function updateInventoryItem(
  token: string,
  itemId: number,
  body: InventoryItemUpdate,
): Promise<InventoryItem> {
  if (token !== GUEST_TOKEN) {
    return api.patch<InventoryItem>(`/api/inventory/${itemId}`, body, token);
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

  // Storage switch preserves elapsed time, matching the backend rule.
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
  return withLiveState(updated);
}

export function deleteInventoryItem(token: string, itemId: number): Promise<MessageResponse> {
  if (token === GUEST_TOKEN) {
    guestItems = guestItems.filter((i) => i.id !== itemId);
    return Promise.resolve({ message: "Inventory item deleted", success: true });
  }
  return api.delete<MessageResponse>(`/api/inventory/${itemId}`, token);
}
