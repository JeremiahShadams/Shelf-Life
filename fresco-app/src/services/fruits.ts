/**
 * Fresco — Fruits service
 * Wraps /api/fruits (reference database). Public endpoints — no token.
 */

import { api } from "./api";
import type { CompatibilityResponse, Fruit, FruitListResponse } from "../types/api";

export function searchFruits(query: string, page = 1, perPage = 20): Promise<FruitListResponse> {
  const params = new URLSearchParams({
    search: query,
    page: String(page),
    per_page: String(perPage),
  });
  return api.get<FruitListResponse>(`/api/fruits/?${params.toString()}`);
}

export function getFruit(fruitId: number): Promise<Fruit> {
  return api.get<Fruit>(`/api/fruits/${fruitId}`);
}

export function checkCompatibility(names: string[]): Promise<CompatibilityResponse> {
  const params = new URLSearchParams({ fruits: names.join(",") });
  return api.get<CompatibilityResponse>(`/api/fruits/compatibility?${params.toString()}`);
}
