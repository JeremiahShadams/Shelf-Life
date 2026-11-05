/**
 * Fresco — System service
 * Public health probe. Used by Profile to tell the user whether the scan
 * model is deployed (the one thing that changes what the app can do).
 */

import { api } from "./api";
import type { HealthResponse } from "../types/api";

export function getHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>("/health");
}
