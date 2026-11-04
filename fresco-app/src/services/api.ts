/**
 * Fresco — API client
 * Thin fetch wrapper: JSON in/out, bearer-token injection, and errors
 * normalized to ApiError (status + human message) so screens and TanStack
 * Query never see raw Response objects.
 */

import Constants from "expo-constants";

function resolveApiUrl(): string {
  const envUrl = (process.env as { EXPO_PUBLIC_API_URL?: string }).EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(":")[0];
    return `http://${hostIp}:8000`;
  }
  return "http://localhost:8000";
}

const API_URL = resolveApiUrl();

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
    });
  } catch {
    // fetch only throws on network-level failures (DNS, refused, offline)
    throw new ApiError(0, "Can't reach the server. Check your connection.");
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
  upload: <T>(path: string, formData: FormData, token?: string | null) =>
    request<T>(path, { method: "POST", formData, token }),
};

export { API_URL };
