import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { authApi, type VendorProfilePayload } from "../api/dealApi";
import { getStoredToken, TOKEN_KEY } from "../api/client";
import type { User } from "../types/deal.types";
import { AuthContext } from "./AuthContextValue";

const UNLOCKED_SESSION_KEY = "confam_unlocked_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getStoredToken());
  const [locked, setLocked] = useState(
    () => !!localStorage.getItem(TOKEN_KEY) && !sessionStorage.getItem(UNLOCKED_SESSION_KEY),
  );

  useEffect(() => {
    if (!getStoredToken()) return;
    authApi.me().then((currentUser) => {
      setUser(currentUser);
      setLocked(!!localStorage.getItem(TOKEN_KEY) && !sessionStorage.getItem(UNLOCKED_SESSION_KEY));
    }).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(UNLOCKED_SESSION_KEY);
      setLocked(false);
    }).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    sessionStorage.setItem(UNLOCKED_SESSION_KEY, "1");
    setUser(user);
    setLocked(false);
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

  const unlock = useCallback(async (password: string) => {
    await authApi.unlock(password);
    sessionStorage.setItem(UNLOCKED_SESSION_KEY, "1");
    setLocked(false);
  }, []);

  const logout = useCallback(async (revokeServerSession = true) => {
    try {
      if (revokeServerSession && getStoredToken()) await authApi.logout();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(UNLOCKED_SESSION_KEY);
      setUser(null);
      setLocked(false);
    }
  }, []);

  return <AuthContext.Provider value={{ user, loading, locked, login, unlock, register, updateProfile, logout }}>{children}</AuthContext.Provider>;
}