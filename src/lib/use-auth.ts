import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { api, setStoredToken, getStoredToken, type UserData, type UserProfile } from "./api";

export type AppRole = "seller" | "expert" | "admin";

interface AuthContextType {
  user: UserData | null;
  profile: UserProfile | null;
  roles: AppRole[];
  isAdmin: boolean;
  isExpert: boolean;
  primaryRole: AppRole;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRoleOverride, setActiveRoleOverride] = useState<AppRole | null>(null);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.auth.getMe();
      setUser(data);
    } catch (err) {
      console.warn("Auth token invalid or expired, clearing session:", err);
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signOut = useCallback(() => {
    api.auth.logout();
    setUser(null);
    setActiveRoleOverride(null);
  }, []);

  const roles = (user?.roles || []) as AppRole[];
  const isAdmin = roles.includes("admin");
  const isExpert = roles.includes("expert");
  const primaryRole: AppRole = isAdmin ? "admin" : isExpert ? "expert" : "seller";
  const activeRole: AppRole = activeRoleOverride && roles.includes(activeRoleOverride) ? activeRoleOverride : primaryRole;

  return {
    user,
    profile: user?.profile || null,
    roles,
    isAdmin,
    isExpert,
    primaryRole,
    activeRole,
    setActiveRole: setActiveRoleOverride,
    loading,
    refreshUser,
    signOut,
  };
}
