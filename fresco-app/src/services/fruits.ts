/**
 * Fresco — Fruits service
 * Wraps /api/fruits (reference database). Public endpoints — no token.
 */

import { api, ApiError } from "./api";
import type { CompatibilityResponse, Fruit, FruitListResponse } from "../types/api";

const FALLBACK_FRUITS: Fruit[] = [
  {
    id: 1,
    name: "Apple",
    subcategory: "common",
    shelf_life_room_temp_days: 7,
    shelf_life_fridge_days: 30,
    shelf_life_freezer_days: 240,
    is_ethylene_producer: true,
    is_ethylene_sensitive: false,
    optimal_temp_min: 1,
    optimal_temp_max: 4,
    ripeness_indicator: "Firm with deep coloring.",
    storage_tips: "Store in the crisper drawer away from ethylene-sensitive vegetables.",
    image_url: null,
  },
  {
    id: 2,
    name: "Banana",
    subcategory: "tropical",
    shelf_life_room_temp_days: 5,
    shelf_life_fridge_days: 7,
    shelf_life_freezer_days: 30,
    is_ethylene_producer: true,
    is_ethylene_sensitive: false,
    optimal_temp_min: 13,
    optimal_temp_max: 18,
    ripeness_indicator: "Bright yellow with light speckling.",
    storage_tips: "Store at room temperature with stems wrapped in foil.",
    image_url: null,
  },
  {
    id: 3,
    name: "Roma Tomato",
    subcategory: "nightshade",
    shelf_life_room_temp_days: 5,
    shelf_life_fridge_days: 10,
    shelf_life_freezer_days: 60,
    is_ethylene_producer: false,
    is_ethylene_sensitive: true,
    optimal_temp_min: 10,
    optimal_temp_max: 15,
    ripeness_indicator: "Firm with rich red skin.",
    storage_tips: "Store stem-down in the crisper drawer or on the counter.",
    image_url: null,
  },
  {
    id: 4,
    name: "Avocado",
    subcategory: "tropical",
    shelf_life_room_temp_days: 4,
    shelf_life_fridge_days: 7,
    shelf_life_freezer_days: 90,
    is_ethylene_producer: true,
    is_ethylene_sensitive: true,
    optimal_temp_min: 7,
    optimal_temp_max: 13,
    ripeness_indicator: "Dark skin yielding to gentle pressure.",
    storage_tips: "Ripen at room temp, then move to fridge once soft.",
    image_url: null,
  },
  {
    id: 5,
    name: "Orange",
    subcategory: "citrus",
    shelf_life_room_temp_days: 7,
    shelf_life_fridge_days: 21,
    shelf_life_freezer_days: 180,
    is_ethylene_producer: false,
    is_ethylene_sensitive: false,
    optimal_temp_min: 4,
    optimal_temp_max: 8,
    ripeness_indicator: "Firm and heavy for its size.",
    storage_tips: "Store in a mesh bag in the fridge.",
    image_url: null,
  },
  {
    id: 6,
    name: "Strawberries",
    subcategory: "berries",
    shelf_life_room_temp_days: 2,
    shelf_life_fridge_days: 7,
    shelf_life_freezer_days: 180,
    is_ethylene_producer: false,
    is_ethylene_sensitive: true,
    optimal_temp_min: 0,
    optimal_temp_max: 2,
    ripeness_indicator: "Bright red without white shoulders.",
    storage_tips: "Do not wash until ready to eat. Keep dry in ventilated container.",
    image_url: null,
  },
];

export async function searchFruits(query: string, page = 1, perPage = 20): Promise<FruitListResponse> {
  const params = new URLSearchParams({
    search: query,
    page: String(page),
    per_page: String(perPage),
  });

  try {
    return await api.get<FruitListResponse>(`/api/fruits/?${params.toString()}`);
  } catch (err) {
    // Only fall back to the local list on genuine network failures (status 0
    // = offline/unreachable). Server errors (401, 500, etc.) propagate so the
    // caller can show a retry state instead of silently swallowing them.
    if (err instanceof ApiError && err.status === 0) {
      const q = query.toLowerCase().trim();
      const filtered = q
        ? FALLBACK_FRUITS.filter((f) => f.name.toLowerCase().includes(q))
        : FALLBACK_FRUITS;
      return {
        items: filtered,
        total: filtered.length,
        page: 1,
        per_page: perPage,
      };
    }
    throw err;
  }
}

export async function getFruit(fruitId: number): Promise<Fruit> {
  try {
    return await api.get<Fruit>(`/api/fruits/${fruitId}`);
  } catch (err) {
    // On genuine network failure, check local cache. Never substitute a
    // different fruit — the caller should show a retry state instead.
    if (err instanceof ApiError && err.status === 0) {
      const found = FALLBACK_FRUITS.find((f) => f.id === fruitId);
      if (found) return found;
    }
    throw err;
  }
}

export async function checkCompatibility(names: string[]): Promise<CompatibilityResponse> {
  const params = new URLSearchParams({ fruits: names.join(",") });
  // TRUST RULE: Never fabricate a "compatible" result. If the backend is
  // unreachable, let the error propagate so the UI shows an error state
  // with a retry button instead of making a false safety claim.
  return api.get<CompatibilityResponse>(`/api/fruits/compatibility?${params.toString()}`);
}
