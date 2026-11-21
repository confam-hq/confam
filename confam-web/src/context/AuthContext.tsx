import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { authApi, type VendorProfilePayload } from "../api/dealApi";
import { getStoredToken, TOKEN_KEY } from "../api/client";
import type { User } from "../types/deal.types";
import { AuthContext } from "./AuthContextValue";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getStoredToken());

  useEffect(() => {
    if (!getStoredToken()) return;
    authApi.me().then(setUser).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (payload: Record<string, unknown>) => {
    await authApi.register(payload);
  }, []);

  const updateProfile = useCallback(async (payload: VendorProfilePayload) => {
    const user = await authApi.updateProfile(payload);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async (revokeServerSession = true) => {
    try {
      if (revokeServerSession && getStoredToken()) await authApi.logout();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, updateProfile, logout }}>{children}</AuthContext.Provider>;
}