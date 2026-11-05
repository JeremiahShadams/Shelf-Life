/**
 * Fresco — Fruit reference hooks (TanStack Query)
 * Backs the manual "add to inventory" search. /api/fruits is public, so
 * this works for guests too (the scan flow still needs the model, but a
 * user can always add an item by name).
 */

import { useQuery } from "@tanstack/react-query";
import { searchFruits } from "../services/fruits";

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
