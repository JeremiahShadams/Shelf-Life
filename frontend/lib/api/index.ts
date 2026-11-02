/**
 * Fresco — API Layer (Phase 2: Live Backend Integration)
 * ========================================================
 * All API interaction goes through this layer.
 * No component should call fetch() directly.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================
// Token Management (localStorage)
// ============================================

const TOKEN_KEY = "fresco_token";
const USER_KEY = "fresco_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  // Also set a cookie so the Next.js middleware can check auth
  document.cookie = `fresco_auth=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Clear the auth cookie
  document.cookie = "fresco_auth=; path=/; max-age=0";
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ============================================
// Error Handling
// ============================================

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "An unknown error occurred" }));
    throw new ApiError(res.status, body.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// ============================================
// Auth API
// ============================================

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await handleResponse<AuthResponse>(res);
  setToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse<AuthResponse>(res);
  setToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export function logout(): void {
  clearToken();
}

// ============================================
// Scan API
// ============================================

export async function scanFruit(file: File): Promise<ScanResult> {
  const formData = new FormData();
  formData.append("image", file);

  // Abort the request if the backend hasn't responded in 30 seconds.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${API_BASE}/api/scan/`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: formData,
      signal: controller.signal,
    });
    return handleResponse<ScanResult>(res);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, "Scan timed out — the server took too long. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// Fruits API
// ============================================

export async function getFruits(page = 1, perPage = 50): Promise<FruitListResponse> {
  const res = await fetch(
    `${API_BASE}/api/fruits/?page=${page}&per_page=${perPage}`
  );
  return handleResponse<FruitListResponse>(res);
}

// ============================================
// Inventory API
// ============================================

export async function getInventory(
  sortBy: string = "expiry",
  includeExpired: boolean = true,
): Promise<InventoryListResponse> {
  const res = await fetch(
    `${API_BASE}/api/inventory/?sort_by=${sortBy}&include_expired=${includeExpired}`,
    { headers: { ...authHeaders() } },
  );
  return handleResponse<InventoryListResponse>(res);
}

export async function addToInventory(
  fruitId: number,
  freshnessScore: number,
  storageMethod: string,
): Promise<InventoryItemResponse> {
  const res = await fetch(`${API_BASE}/api/inventory/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      fruit_id: fruitId,
      freshness_score: freshnessScore,
      storage_method: storageMethod,
    }),
  });
  return handleResponse<InventoryItemResponse>(res);
}

export async function deleteInventoryItem(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Delete failed" }));
    throw new ApiError(res.status, body.detail);
  }
}

// ============================================
// Compatibility API
// ============================================

export async function checkCompatibility(fruits: string[]): Promise<CompatibilityResult> {
  const res = await fetch(
    `${API_BASE}/api/fruits/compatibility?fruits=${fruits.join(",")}`
  );
  return handleResponse<CompatibilityResult>(res);
}

// ============================================
// Types (matched to backend Pydantic schemas)
// ============================================

/** Matches backend UserPublic */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

/** Matches backend TokenResponse */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

/** Matches backend FruitResponse */
export interface FruitData {
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

/** Matches backend FruitList */
export interface FruitListResponse {
  items: FruitData[];
  total: number;
  page: number;
  per_page: number;
}

/** Matches backend ScanResponse (the 3-tier contract) */
export interface ScanResult {
  // Tier 1: Decision
  status: "FRESH" | "EAT_SOON" | "EAT_TODAY" | "SPOILED";
  confidence: number;
  days_left: number;
  recommendation: string;

  // Tier 2: Details
  fruit: FruitData;
  classification_confidence: number;
  freshness_score: number;
  freshness_label: string;
  estimated_shelf_life: Record<string, number>;
  best_storage: string;
  storage_tip: string;

  // Tier 3: Context
  ethylene_note: string | null;
  compatibility_warnings: CompatibilityPair[];

  // Metadata
  image_path: string | null;
}

/** Matches backend InventoryItemResponse */
export interface InventoryItemResponse {
  id: number;
  user_id: number;
  fruit_id: number;
  freshness_score: number;
  storage_method: string;
  estimated_days_remaining: number;
  scanned_at: string;
  estimated_expiry: string;
  is_expired: boolean;
  is_consumed: boolean;
  image_path: string | null;
  quantity: number;
  notes: string | null;
  fruit: FruitData;
}

/** Matches backend InventoryListResponse */
export interface InventoryListResponse {
  items: InventoryItemResponse[];
  total: number;
  expiring_soon: number;
  expired: number;
}

/** Matches backend CompatibilityPair */
export interface CompatibilityPair {
  producer: string;
  sensitive: string;
  warning: string;
}

/** Matches backend CompatibilityResponse */
export interface CompatibilityResult {
  compatible_groups: string[][];
  incompatible_pairs: CompatibilityPair[];
  recommendation: string;
}
