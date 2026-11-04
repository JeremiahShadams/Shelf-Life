/**
 * Fresco — Inventory service
 * Wraps /api/inventory. All calls need a bearer token (user-scoped data).
 */

import { api } from "./api";
import type {
  InventoryItem,
  InventoryItemCreate,
  InventoryItemUpdate,
  InventoryListResponse,
  MessageResponse,
} from "../types/api";

export function listInventory(token: string): Promise<InventoryListResponse> {
  if (token === "guest_demo_token") {
    return Promise.resolve({
      items: [],
      total: 0,
      expiring_soon: 1,
      expired: 1,
    });
  }
  return api.get<InventoryListResponse>("/api/inventory/", token);
}

export function getInventoryItem(token: string, itemId: number): Promise<InventoryItem> {
  return api.get<InventoryItem>(`/api/inventory/${itemId}`, token);
}

export function addToInventory(token: string, body: InventoryItemCreate): Promise<InventoryItem> {
  return api.post<InventoryItem>("/api/inventory/", body, token);
}

export function updateInventoryItem(
  token: string,
  itemId: number,
  body: InventoryItemUpdate,
): Promise<InventoryItem> {
  return api.patch<InventoryItem>(`/api/inventory/${itemId}`, body, token);
}

export function deleteInventoryItem(token: string, itemId: number): Promise<MessageResponse> {
  return api.delete<MessageResponse>(`/api/inventory/${itemId}`, token);
}
