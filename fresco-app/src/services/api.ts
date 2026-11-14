/**
 * Fresco — API client
 * Thin fetch wrapper: JSON in/out, bearer-token injection, and errors
 * normalized to ApiError (status + human message) so screens and TanStack
 * Query never see raw Response objects.
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveApiUrl(): string {
  // Explicit configuration always wins. Production builds must set this.
  const envUrl = (process.env as { EXPO_PUBLIC_API_URL?: string }).EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  // In Expo Go / dev builds, derive the host from the dev server so a physical
  // phone talks to the machine running the backend instead of itself.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
    (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(":")[0];
    return `http://${hostIp}:8000`;
  }

  // Simulator/emulator defaults. 10.0.2.2 is the host machine from the Android
  // emulator; iOS simulator and web can use localhost.
  return Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
}

const API_URL = resolveApiUrl();
console.log("[Fresco API] Connecting to:", API_URL);

export class ApiError extends Error {
  /** HTTP status, or 0 for network failures (server unreachable). */
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** FastAPI's `detail` can be a string or a validation-error array. */
function detailToMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string; loc?: unknown[] } | undefined;
    if (first?.msg) return first.msg;
  }
  return "Something went wrong. Please try again.";
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
  /** Multipart body. Mutually exclusive with `body`. */
  formData?: FormData;
  /** Optional abort signal (used by long-running scans). */
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      signal: options.signal,
    });
  } catch (err) {
    // fetch throws on network-level failures (DNS, refused, offline, blocked by firewall)
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(0, "The scan timed out. Please try again.");
    }
    const reason = err instanceof Error ? err.message : String(err);
    throw new ApiError(0, `Can't reach server at ${API_URL}: ${reason}`);
  }

  if (!res.ok) {
    let detail: unknown = null;
    try {
      const json = (await res.json()) as { detail?: unknown };
      detail = json.detail ?? null;
    } catch {
      // non-JSON error body — fall through to the generic message
    }
    throw new ApiError(res.status, detailToMessage(detail));
  }

  // 204/no-content responses (none today, but delete paths could become them)
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { method: "GET", token }),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body, token }),
  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "PATCH", body, token }),
  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),
  /**
   * Multipart upload. Let fetch set Content-Type so the boundary is correct —
   * never set it manually for FormData.
   */
  upload: <T>(path: string, formData: FormData, token?: string | null, signal?: AbortSignal) =>
    request<T>(path, { method: "POST", formData, token, signal }),
};

export { API_URL };
