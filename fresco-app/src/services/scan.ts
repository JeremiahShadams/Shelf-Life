/**
 * Fresco — Scan service
 *
 * Uploads a captured/picked image to the backend classifier and returns the
 * server's verdict. Failures are surfaced to the caller as ApiError — they are
 * never replaced with a fabricated result. If the scan cannot be completed,
 * the user is told why.
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

/** Why a scan failed, so the UI can show an actionable message. */
export type ScanFailureKind =
  | "offline" // server unreachable / timed out
  | "model_unavailable" // backend is up but the classifier artifact is missing
  | "not_recognized" // model ran, but the fruit isn't in the database
  | "unknown";

export function classifyScanError(err: unknown): ScanFailureKind {
  if (!(err instanceof ApiError)) return "unknown";
  if (err.status === 0) return "offline";
  if (err.status === 503) return "model_unavailable";
  if (err.status === 404) return "not_recognized";
  return "unknown";
}

/** True when the backend has no model deployed. */
export function isModelNotDeployed(err: unknown): boolean {
  return err instanceof ApiError && err.status === 503;
}

export async function scanImage(asset: ScanAsset): Promise<ScanResult> {
  const token = useAuth.getState().token;
  const authToken = token === "guest_demo_token" ? null : token;

  const formData = new FormData();

  try {
    const fileResponse = await fetch(asset.uri);
    const blob = await fileResponse.blob();
    formData.append("image", blob, asset.name || "produce.jpg");
  } catch {
    // React Native's FormData accepts a file descriptor instead of a Blob.
    formData.append("image", {
      uri: asset.uri,
      name: asset.name || "produce.jpg",
      type: asset.mimeType ?? "image/jpeg",
    } as unknown as Blob);
  }

  const controller = new AbortController();
  // MobileNetV2 inference on CPU can take several seconds; allow 30s total.
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const result = await api.upload<ScanResult>(
      "/api/scan/",
      formData,
      authToken,
      controller.signal,
    );
    // Ensure image_path points to the captured photo if the backend didn't supply one.
    if (!result.image_path) {
      result.image_path = asset.uri;
    }
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
