/**
 * Fresco — Scan service
 * Compresses & downscales camera/library images to <= 512px before uploading
 * to the FastAPI MobileNetV2 model (cutting mobile data payload from ~5MB to ~50KB),
 * and supports clean cancellation via AbortSignal.
 */

import * as ImageManipulator from "expo-image-manipulator";
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
  | "cancelled" // explicitly aborted by user
  | "offline" // server unreachable / timed out
  | "model_unavailable" // backend is up but the classifier artifact is missing
  | "not_recognized" // model ran, but the fruit isn't in the database
  | "unknown";

export function classifyScanError(err: unknown): ScanFailureKind {
  if (!(err instanceof ApiError)) return "unknown";
  if (err.cancelled) return "cancelled";
  if (err.status === 0) return "offline";
  if (err.status === 503) return "model_unavailable";
  if (err.status === 404) return "not_recognized";
  return "unknown";
}

/** True when the backend has no model deployed. */
export function isModelNotDeployed(err: unknown): boolean {
  return err instanceof ApiError && err.status === 503;
}

async function downscaleForScan(asset: ScanAsset): Promise<ScanAsset> {
  try {
    const resized = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 512 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    );
    return {
      uri: resized.uri,
      name: "produce.jpg",
      mimeType: "image/jpeg",
    };
  } catch (err) {
    // If manipulator fails on an unusual URI/web blob, gracefully send original asset
    console.warn("[scanImage] Resize skipped, sending original image:", err);
    return asset;
  }
}

export async function scanImage(asset: ScanAsset, externalSignal?: AbortSignal): Promise<ScanResult> {
  const token = useAuth.getState().token;
  const authToken = token === "guest_demo_token" ? null : token;

  // Compress & resize to 512px max width before upload (saves ~98% bandwidth)
  const optimizedAsset = await downscaleForScan(asset);

  if (externalSignal?.aborted) {
    throw new ApiError(0, "Scan cancelled.", true);
  }

  const formData = new FormData();

  try {
    const fileResponse = await fetch(optimizedAsset.uri);
    const blob = await fileResponse.blob();
    formData.append("image", blob, optimizedAsset.name || "produce.jpg");
  } catch {
    formData.append("image", {
      uri: optimizedAsset.uri,
      name: optimizedAsset.name || "produce.jpg",
      type: optimizedAsset.mimeType ?? "image/jpeg",
    } as unknown as Blob);
  }

  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    externalSignal.addEventListener("abort", onExternalAbort);
  }

  // MobileNetV2 inference on CPU + slow upload: allow 30s unless user cancels earlier.
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const result = await api.upload<ScanResult>(
      "/api/scan/",
      formData,
      authToken,
      controller.signal,
    );
    if (!result.image_path) {
      result.image_path = asset.uri;
    }
    return result;
  } catch (err) {
    // Distinguish user abort vs internal 30s timeout
    if (err instanceof ApiError && err.cancelled && !externalSignal?.aborted) {
      throw new ApiError(
        0,
        "Scan timed out — couldn't get a response in time. Check your connection and try again.",
        false,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}
