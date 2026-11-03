/**
 * Fresco — API types
 * TypeScript mirrors of the FastAPI response schemas (backend/app/schemas).
 * Kept hand-written instead of generated on purpose: the contract is small
 * and reviewed, andGenerate markers always drift with SDK versions.
 */

export type StorageMethod = "room_temp" | "fridge" | "freezer";

/** FRESH / EAT_SOON / EAT_TODAY / SPOILED — the one status language */
export type ItemStatus = "FRESH" | "EAT_SOON" | "EAT_TODAY" | "SPOILED";

export type Subcategory = "common" | "citrus" | "berries" | "tropical" | "stone" | "melons" | "other";

export interface Fruit {
  id: number;
  name: string;
  subcategory: string;
  shelf_life_room_temp_days: number;
  shelf_life_fridge_days: number;
  shelf_life_freezer_days: number;
  is_ethylene_producer: boolean;
  is_ethylene_sensitive: boolean;
  optimal_temp_min: number | null;
  optimal_temp_max: number | null;
  ripeness_indicator: string | null;
  storage_tips: string | null;
  image_url: string | null;
}

export interface FruitListResponse {
  items: Fruit[];
  total: number;
  page: number;
  per_page: number;
}

export interface InventoryItem {
  id: number;
  user_id: number;
  fruit_id: number;
  freshness_score: number;
  storage_method: StorageMethod;
  /** At-scan snapshot — do NOT render this; render days_left. */
  estimated_days_remaining: number;
  scanned_at: string;
  estimated_expiry: string;
  is_expired: boolean;
  is_consumed: boolean;
  image_path: string | null;
  quantity: number;
  notes: string | null;
  /** Live-computed at read time — the ONLY days source the UI may use. */
  days_left: number | null;
  status: ItemStatus | null;
  fruit: Fruit;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  /** items expiring within 2 days */
  expiring_soon: number;
  expired: number;
}

export interface InventoryItemCreate {
  fruit_id: number;
  freshness_score?: number;
  storage_method?: StorageMethod;
  quantity?: number;
  notes?: string | null;
  image_path?: string | null;
}

export interface InventoryItemUpdate {
  storage_method?: StorageMethod;
  is_consumed?: boolean;
  quantity?: number;
  notes?: string | null;
}

export interface ScanResult {
  status: ItemStatus;
  confidence: number;
  days_left: number;
  recommendation: string;
  fruit: Fruit;
  classification_confidence: number;
  freshness_score: number;
  freshness_label: string;
  estimated_shelf_life: Record<StorageMethod, number>;
  best_storage: StorageMethod;
  storage_tip: string;
  ethylene_note: string | null;
  compatibility_warnings: Record<string, unknown>[];
  image_path: string | null;
}

export interface NotificationItem {
  id: number;
  inventory_id: number;
  message: string;
  notify_at: string;
  sent: boolean;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
}

export interface CompatibilityPair {
  producer: string;
  sensitive: string;
  warning: string;
}

export interface CompatibilityResponse {
  compatible_groups: string[][];
  incompatible_pairs: CompatibilityPair[];
  recommendation: string;
  unknown_names: string[];
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface HealthResponse {
  status: string;
  version: string;
  debug: boolean;
  ai_scanning: "available" | "unavailable" | "unknown";
}

export interface MessageResponse {
  message: string;
  success: boolean;
}
