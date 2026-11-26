/**
 * Fresco — API client
 * Thin fetch wrapper: JSON/multipart in & out, bearer-token injection, and errors
 * normalized to plain-language ApiError objects (never leaking raw LAN IPs or
 * low-level runtime strings to end users).
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveApiUrl(): string {
  const envUrl = (process.env as { EXPO_PUBLIC_API_URL?: string }).EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
    (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(":")[0];
    return `http://${hostIp}:8000`;
  }

  return Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
}

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  /** HTTP status, or 0 for network/cancellation failures (server unreachable). */
  status: number;
  /** True when explicitly cancelled by user via AbortController. */
  cancelled: boolean;

  constructor(status: number, message: string, cancelled = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.cancelled = cancelled;
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
  const headers: Record<string, string> = {
    "bypass-tunnel-reminder": "true",
  };
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
    // Log raw networking details internally; present clean plain language to users.
    const rawReason = err instanceof Error ? err.message : String(err);
    const isAborted =
      (err instanceof Error && err.name === "AbortError") ||
      Boolean(options.signal?.aborted);

    if (isAborted) {
      throw new ApiError(0, "Scan cancelled.", true);
    }

    console.warn(`[Fresco API] Request failed (${API_URL}${path}): ${rawReason}`);
    throw new ApiError(0, "Couldn't reach Fresco — check your connection and try again.");
  }

  if (!res.ok) {
    let detail: unknown = null;
    try {
      const json = (await res.json()) as { detail?: unknown };
      detail = json.detail ?? null;
    } catch {
      // non-JSON error body — fall through to generic message
    }
    throw new ApiError(res.status, detailToMessage(detail));
  }

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
  upload: <T>(path: string, formData: FormData, token?: string | null, signal?: AbortSignal) =>
    request<T>(path, { method: "POST", formData, token, signal }),
};

export { API_URL };
