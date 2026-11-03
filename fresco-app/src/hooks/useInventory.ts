/**
 * Fresco — Inventory hooks (TanStack Query)
 * Server state for the Fridge screen and scan-result flow. Token comes
 * from the auth store; unauthenticated consumers simply get queries
 * disabled instead of firing 401s at the backend.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addToInventory,
  deleteInventoryItem,
  listInventory,
  updateInventoryItem,
} from "../services/inventory";
import { useAuth } from "../stores/auth";
import type { InventoryItemCreate, InventoryItemUpdate } from "../types/api";

const INVENTORY_KEY = "inventory";

export function useInventory() {
  const token = useAuth((s) => (s.status === "authed" ? s.token : null));

  return useQuery({
    queryKey: [INVENTORY_KEY],
    queryFn: () => listInventory(token as string),
    enabled: token != null,
  });
}

export function useAddToInventory() {
  const token = useAuth((s) => (s.status === "authed" ? s.token : null));
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: InventoryItemCreate) => addToInventory(token as string, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY] });
    },
  });
}

export function useUpdateInventoryItem() {
  const token = useAuth((s) => (s.status === "authed" ? s.token : null));
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, update }: { itemId: number; update: InventoryItemUpdate }) =>
      updateInventoryItem(token as string, itemId, update),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY] });
    },
  });
}

export function useDeleteInventoryItem() {
  const token = useAuth((s) => (s.status === "authed" ? s.token : null));
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => deleteInventoryItem(token as string, itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY] });
    },
  });
}
