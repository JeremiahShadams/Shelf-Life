/**
 * Fresco — Scan service
 * Uploads a captured/picked image to the FastAPI model and returns the
 * unified verdict. The backend returns a clean 503 with detail
 * MODEL_NOT_DEPLOYED until fresco_model.keras is exported; ApiError carries
 * that through so the screen can explain it instead of showing a crash.
 */

import { api, ApiError } from "./api";
import { useAuth } from "../stores/auth";
import type { ScanResult } from "../types/api";

export type ScanAsset = {
  uri: string;
  /** Filename sent to the server (used only for its extension). */
  name: string;
  /** Defaults to image/jpeg. */
  mimeType?: string | null;
};

export async function scanImage(asset: ScanAsset): Promise<ScanResult> {
  const token = useAuth.getState().token;

  // Guest / Demo mode: provide realistic scan experience without blocking on deployed model
  if (token === "guest_demo_token") {
    await new Promise((r) => setTimeout(r, 650));
    return {
      status: "FRESH",
      confidence: 0.96,
      days_left: 7,
      recommendation: "Store in the crisper drawer to keep it fresh for up to 10 days.",
      fruit: {
        id: 1,
        name: "Roma Tomato",
        subcategory: "Nightshade",
        shelf_life_room_temp_days: 5,
        shelf_life_fridge_days: 10,
        shelf_life_freezer_days: 60,
        is_ethylene_producer: false,
        is_ethylene_sensitive: true,
        optimal_temp_min: 10,
        optimal_temp_max: 15,
        ripeness_indicator: "Rich red color, firm to the touch with smooth skin.",
        storage_tips: "Keep stem-down in a cool location or inside the crisper drawer.",
        image_url: null,
      },
      classification_confidence: 0.96,
      freshness_score: 0.92,
      freshness_label: "Fresh",
      estimated_shelf_life: {
        room_temp: 5,
        fridge: 10,
        freezer: 60,
      },
      best_storage: "fridge",
      storage_tip: "Keep stem-down in a cool location or inside the crisper drawer.",
      ethylene_note: "Sensitive to ethylene gas — store away from apples and bananas.",
      compatibility_warnings: [],
      image_path: asset.uri,
    };
  }

  const formData = new FormData();

  // React Native's FormData accepts the {uri, name, type} file descriptor.
  // The DOM typings don't model it, hence the cast.
  formData.append("image", {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType ?? "image/jpeg",
  } as unknown as Blob);

  return api.upload<ScanResult>("/api/scan/", formData);
}

/** True when the backend has no model deployed (HTTP 503). */
export function isModelNotDeployed(err: unknown): boolean {
  return err instanceof ApiError && err.status === 503;
}
