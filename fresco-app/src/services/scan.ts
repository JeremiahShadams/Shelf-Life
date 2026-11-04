/**
 * Fresco — Scan service
 * Uploads a captured/picked image to the FastAPI model and returns the
 * unified verdict. The backend returns a clean 503 with detail
 * MODEL_NOT_DEPLOYED until fresco_model.keras is exported; ApiError carries
 * that through so the screen can explain it instead of showing a crash.
 */

import { api, ApiError } from "./api";
import type { ScanResult } from "../types/api";

export type ScanAsset = {
  uri: string;
  /** Filename sent to the server (used only for its extension). */
  name: string;
  /** Defaults to image/jpeg. */
  mimeType?: string | null;
};

export function scanImage(asset: ScanAsset): Promise<ScanResult> {
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
