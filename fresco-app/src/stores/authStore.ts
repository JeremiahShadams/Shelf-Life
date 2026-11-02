/**
 * Fresco — Auth Store (Zustand)
 * Manages JWT session and active user.
 */

import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: User) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setSession: (token, user) => set({ token, user, isAuthenticated: true }),
  clearSession: () => set({ token: null, user: null, isAuthenticated: false }),
}));

