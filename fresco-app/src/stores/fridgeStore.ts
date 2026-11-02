/**
 * Fresco — Fridge Store (Zustand)
 * Manages inventory list, active filtering, and client state.
 */

import { create } from "zustand";
import { api } from "../services/api";
import type { InventoryItem } from "../types";

export type FridgeFilter = "all" | "eat_first" | "fresh";

interface FridgeState {
  items: InventoryItem[];
  filter: FridgeFilter;
  isLoading: boolean;
  error: string | null;
  setFilter: (filter: FridgeFilter) => void;
  fetchInventory: () => Promise<void>;
  markConsumed: (id: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export const useFridgeStore = create<FridgeState>((set, get) => ({
  items: [],
  filter: "eat_first",
  isLoading: false,
  error: null,

  setFilter: (filter) => set({ filter }),

  fetchInventory: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getInventory();
      set({ items: data.items, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load inventory";
      set({ error: msg, isLoading: false });
    }
  },

  markConsumed: async (id: number) => {
    // Optimistic update
    const previous = get().items;
    set({ items: previous.filter((i) => i.id !== id) });
    try {
      await api.updateInventoryItem(id, { is_consumed: true });
    } catch {
      // Rollback on error
      set({ items: previous });
    }
  },

  removeItem: async (id: number) => {
    const previous = get().items;
    set({ items: previous.filter((i) => i.id !== id) });
    try {
      await api.deleteInventoryItem(id);
    } catch {
      set({ items: previous });
    }
  },
}));
