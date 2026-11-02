/**
 * Fresco — API Service
 * Central typed communication layer between native app and FastAPI backend.
 */

import { useAuthStore } from "../stores/authStore";
import type {
  AuthResponse,
  InventoryItem,
  InventoryListResponse,
  NotificationListResponse,
  ScanResult,
  StorageMethod,
} from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isFormData = false,
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.statusText}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.detail || errJson.message || errorMsg;
    } catch {
      // ignore
    }
    throw new ApiError(errorMsg, response.status);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  },

  // Inventory / Fridge
  async getInventory(sortBy = "expiry"): Promise<InventoryListResponse> {
    return request<InventoryListResponse>(`/api/inventory/?sort_by=${sortBy}`);
  },

  async addInventoryItem(data: {
    fruit_id: number;
    freshness_score: number;
    storage_method: StorageMethod;
    quantity?: number;
    notes?: string;
  }): Promise<InventoryItem> {
    return request<InventoryItem>("/api/inventory/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateInventoryItem(
    id: number,
    data: {
      storage_method?: StorageMethod;
      quantity?: number;
      notes?: string;
      is_consumed?: boolean;
    },
  ): Promise<InventoryItem> {
    return request<InventoryItem>(`/api/inventory/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteInventoryItem(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/inventory/${id}`, {
      method: "DELETE",
    });
  },

  // Notifications
  async getNotifications(): Promise<NotificationListResponse> {
    return request<NotificationListResponse>("/api/notifications");
  },

  // AI Scan
  async scanImage(fileUri: string, filename = "scan.jpg"): Promise<ScanResult> {
    const formData = new FormData();
    formData.append("image", {
      uri: fileUri,
      name: filename,
      type: "image/jpeg",
    } as unknown as Blob);

    return request<ScanResult>("/api/scan/", {
      method: "POST",
      body: formData,
    }, true);
  },
};

