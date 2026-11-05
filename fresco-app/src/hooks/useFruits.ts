/**
 * Fresco — Fruit reference hooks (TanStack Query)
 * Backs the manual "add to inventory" search. /api/fruits is public, so
 * this works for guests too (the scan flow still needs the model, but a
 * user can always add an item by name).
 */

import { useQuery } from "@tanstack/react-query";
import { checkCompatibility, searchFruits } from "../services/fruits";

const FRUITS_KEY = "fruits";

export function useFruitSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: [FRUITS_KEY, trimmed],
    queryFn: () => searchFruits(trimmed, 1, 30),
    // The reference table changes rarely; keep results warm between screens.
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Ethylene compatibility for the distinct fruits currently in the fridge.
 * Order is normalized so "Apple,Banana" and "Banana,Apple" share a cache.
 */
export function useCompatibility(names: string[]) {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort();

  return useQuery({
    queryKey: [FRUITS_KEY, "compatibility", unique],
    queryFn: () => checkCompatibility(unique),
    enabled: unique.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
