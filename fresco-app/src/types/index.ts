/**
 * Fresco — Core Types
 * Matches the FastAPI backend schemas.
 */

export type FreshnessStatus = "FRESH" | "EAT_SOON" | "EAT_TODAY" | "SPOILED";
export type StorageMethod = "room_temp" | "fridge" | "freezer";

export interface Fruit {
  id: number;
  name: string;
  subcategory: string;
  shelf_life_room_temp_days: number;
  shelf_life_fridge_days: number;
  shelf_life_freezer_days: number;
  is_ethylene_producer?: boolean;
  is_ethylene_sensitive?: boolean;
  optimal_temp_min?: number | null;
  optimal_temp_max?: number | null;
  ripeness_indicator?: string | null;
  storage_tips?: string | null;
  image_url?: string | null;
}

export interface InventoryItem {
  id: number;
  user_id?: number;
  fruit_id: number;
  freshness_score: number;
  storage_method: StorageMethod;
  estimated_days_remaining: number;
  scanned_at?: string;
  estimated_expiry: string;
  is_expired: boolean;
  is_consumed: boolean;
  image_path?: string | null;
  quantity: number;
  notes?: string | null;
  days_left: number;
  status: FreshnessStatus;
  fruit: Fruit;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  expiring_soon: number;
  expired: number;
}

export interface ScanResult {
  fruit_name: string;
  confidence: number;
  freshness_score: number;
  freshness_status: FreshnessStatus;
  estimated_days_remaining: number;
  verdict: string;
  recommendation?: string;
  storage_tips?: string;
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

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RecipeSuggestion {
  id: string;
  title: string;
  description: string;
  estimated_time_mins: number;
  ingredients: { name: string; amount: string; from_fridge: boolean }[];
  steps: string[];
  related_inventory_ids: number[];
}
