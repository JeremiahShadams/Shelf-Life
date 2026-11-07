/**
 * Fresco — Scan service
 * Uploads a captured/picked image to the FastAPI model and returns the
 * unified verdict. The backend returns a clean 503 with detail
 * MODEL_NOT_DEPLOYED until fresco_model.keras is exported; ApiError carries
 * that through so the screen can explain it instead of showing a crash.
 *
 * TRUST RULE: No fabricated scan results. If the model is not deployed or
 * the user is a guest, throw a 503 so the UI routes to the manual add flow
 * instead of presenting fake AI output as real.
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
  // If guest, don't send the demo token as a bearer auth header
  const authToken = token === "guest_demo_token" ? null : token;

  const formData = new FormData();

  // Modern React Native 0.88 / Expo SDK 58 uses WinterCG-compliant fetch.
  // Passing legacy { uri, name, type } objects throws "Unsupported FormDataPart implementation".
  // Fetching the local file URI to a standard Blob solves this across Android, iOS, and Web.
  try {
    const fileResponse = await fetch(asset.uri);
    const blob = await fileResponse.blob();
    formData.append("image", blob, asset.name || "produce.jpg");
  } catch {
    // Fallback for environments where URI fetching to blob isn't needed
    formData.append("image", {
      uri: asset.uri,
      name: asset.name || "produce.jpg",
      type: asset.mimeType ?? "image/jpeg",
    } as unknown as Blob);
  }

  return api.upload<ScanResult>("/api/scan/", formData, authToken);
}

/** True when the backend has no model deployed (HTTP 503). */
export function isModelNotDeployed(err: unknown): boolean {
  return err instanceof ApiError && err.status === 503;
}
