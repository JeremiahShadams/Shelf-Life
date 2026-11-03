/**
 * Fresco — Auth service
 * Wraps /api/auth/register and /api/auth/login.
 */

import { api } from "./api";
import type { TokenResponse } from "../types/api";

export function register(body: {
  username: string;
  email: string;
  password: string;
}): Promise<TokenResponse> {
  return api.post<TokenResponse>("/api/auth/register", body);
}

export function login(body: { email: string; password: string }): Promise<TokenResponse> {
  return api.post<TokenResponse>("/api/auth/login", body);
}
