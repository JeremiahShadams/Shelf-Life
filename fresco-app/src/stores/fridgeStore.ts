/**
 * Fresco — Fridge store (client state only)
 * Holds filter selection and other non-server UI state.
 * Inventory DATA lives in TanStack Query (see hooks/useInventory.ts) —
 * keeping them apart avoids duplicated caches and stale-state bugs.
 */

import { create } from "zustand";

export type FridgeFilter = "all" | "eat_first" | "fresh" | "expired";

type FridgeState = {
  filter: FridgeFilter;
  setFilter: (filter: FridgeFilter) => void;
};

export const useFridgeStore = create<FridgeState>((set) => ({
  filter: "eat_first",
  setFilter: (filter) => set({ filter }),
}));
