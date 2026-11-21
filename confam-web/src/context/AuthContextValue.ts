import { createContext } from "react";
import type { User } from "../types/deal.types";
import type { VendorProfilePayload } from "../api/dealApi";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  updateProfile: (payload: VendorProfilePayload) => Promise<User>;
  logout: (revokeServerSession?: boolean) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
