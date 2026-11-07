/**
 * Fresco — Auth service
 * Wraps /api/auth/register and /api/auth/login.
 */

import { api } from "./api";
import type { TokenResponse, User, UserProfileUpdate } from "../types/api";

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

/** Validate a stored token and return the fresh user record. */
export function getMe(token: string): Promise<User> {
  return api.get<User>("/api/auth/me", token);
}

/** Update profile preferences and push notification token */
export function updateProfile(token: string, body: UserProfileUpdate): Promise<User> {
  return api.patch<User>("/api/auth/profile", body, token);
}

/** Change account password */
export function changePassword(
  token: string,
  body: { old_password: string; new_password: string }
): Promise<{ message: string }> {
  return api.post<{ message: string }>("/api/auth/change-password", body, token);
}

/** Permanently delete account and all data (App Store guideline 5.1.1) */
export function deleteAccount(token: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>("/api/auth/account", token);
}
