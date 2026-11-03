/**
 * Fresco — Auth store
 * zustand holds the session; expo-secure-store persists it. `hydrate()`
 * runs once at boot (root layout) so a cold start silently restores the
 * session instead of flashing a login screen.
 */

import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { login as apiLogin, register as apiRegister } from "../services/auth";
import type { User } from "../types/api";

export type AuthStatus = "idle" | "anon" | "authed";

const TOKEN_KEY = "fresco.auth.token";
const USER_KEY = "fresco.auth.user";

type AuthState = {
  status: AuthStatus;
  token: string | null;
  user: User | null;

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

async function persist(token: string, user: User): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export const useAuth = create<AuthState>((set) => ({
  status: "idle",
  token: null,
  user: null,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      if (token && userJson) {
        set({ status: "authed", token, user: JSON.parse(userJson) as User });
      } else {
        set({ status: "anon", token: null, user: null });
      }
    } catch {
      // unreadable storage → treat as signed out, never block the app
      set({ status: "anon", token: null, user: null });
    }
  },

  login: async (email, password) => {
    const res = await apiLogin({ email, password });
    await persist(res.access_token, res.user);
    set({ status: "authed", token: res.access_token, user: res.user });
  },

  register: async (username, email, password) => {
    const res = await apiRegister({ username, email, password });
    await persist(res.access_token, res.user);
    set({ status: "authed", token: res.access_token, user: res.user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ status: "anon", token: null, user: null });
  },
}));

export function useAuthToken(): string | null {
  return useAuth((s) => (s.status === "authed" ? s.token : null));
}
