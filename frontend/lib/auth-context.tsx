"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getToken,
  getStoredUser,
  type AuthUser,
  type AuthResponse,
  ApiError,
} from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (username: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{
    user: AuthUser | null;
    token: string | null;
  }>(() => {
    const storedToken = getToken();
    const storedUser = getStoredUser();
    return {
      token: storedToken && storedUser ? storedToken : null,
      user: storedToken && storedUser ? storedUser : null,
    };
  });
  const [isLoading] = useState(false);

  const setAuthSession = useCallback((token: string | null, user: AuthUser | null) => {
    setSession({ token, user });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setAuthSession(data.access_token, data.user);
    return data;
  }, [setAuthSession]);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const data = await apiRegister(username, email, password);
      setAuthSession(data.access_token, data.user);
      return data;
    },
    [setAuthSession],
  );

  const logout = useCallback(() => {
    apiLogout();
    setAuthSession(null, null);
  }, [setAuthSession]);

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        token: session.token,
        isAuthenticated: !!session.token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { ApiError };
