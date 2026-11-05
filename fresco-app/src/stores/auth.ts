/**
 * Fresco — Auth store
 * zustand holds the session; expo-secure-store persists it. `hydrate()`
 * runs once at boot (root layout) so a cold start silently restores the
 * session instead of flashing a login screen.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { ApiError } from "../services/api";
import { getMe, login as apiLogin, register as apiRegister } from "../services/auth";
import type { User } from "../types/api";

export type AuthStatus = "idle" | "anon" | "authed";

const TOKEN_KEY = "fresco.auth.token";
const USER_KEY = "fresco.auth.user";

// Safe cross-platform storage: SecureStore on native (iOS/Android), localStorage on web
async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage unavailable or blocked
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Fallback if secure store fails
  }
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      return null;
    }
    return null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

export type AuthState = {
  status: AuthStatus;
  token: string | null;
  user: User | null;

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
};

async function persist(token: string, user: User): Promise<void> {
  await storageSet(TOKEN_KEY, token);
  await storageSet(USER_KEY, JSON.stringify(user));
}

async function clearPersisted(): Promise<void> {
  await storageDelete(TOKEN_KEY);
  await storageDelete(USER_KEY);
}

export const useAuth = create<AuthState>((set) => ({
  status: "idle",
  token: null,
  user: null,

  hydrate: async () => {
    let token: string | null = null;
    try {
      token = await storageGet(TOKEN_KEY);
      const cachedJson = await storageGet(USER_KEY);

      if (!token) {
        set({ status: "anon", token: null, user: null });
        return;
      }

      // Guest / Demo token: bypass network check
      if (token === "guest_demo_token") {
        const guestUser: User = cachedJson
          ? (JSON.parse(cachedJson) as User)
          : { id: 1, username: "Guest User", email: "guest@fresco.app" };
        set({ status: "authed", token, user: guestUser });
        return;
      }

      // Validate against the server so an expired/revoked token is caught
      // at boot instead of failing later on the Fridge screen.
      try {
        const user = await getMe(token);
        await storageSet(USER_KEY, JSON.stringify(user));
        set({ status: "authed", token, user });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await clearPersisted();
          set({ status: "anon", token: null, user: null });
          return;
        }
        // Offline or server down: trust the cached identity so the app
        // still opens; the next successful request re-validates.
        if (cachedJson) {
          set({ status: "authed", token, user: JSON.parse(cachedJson) as User });
        } else {
          set({ status: "anon", token: null, user: null });
        }
      }
    } catch {
      // Unreadable storage → treat as signed out, never block the app.
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

  loginAsGuest: async () => {
    const guestUser: User = {
      id: 1,
      username: "Guest User",
      email: "guest@fresco.app",
    };
    const guestToken = "guest_demo_token";
    await persist(guestToken, guestUser);
    set({ status: "authed", token: guestToken, user: guestUser });
  },

  logout: async () => {
    await clearPersisted();
    set({ status: "anon", token: null, user: null });
  },
}));

export function useAuthToken(): string | null {
  return useAuth((s) => (s.status === "authed" ? s.token : null));
}
