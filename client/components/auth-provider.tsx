"use client";

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, clearAuth, setAuth, getStoredUser } from "@/lib/api";
import type { User, AuthResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const u = getStoredUser();
    const t =
      typeof window !== "undefined"
        ? localStorage.getItem("blog_jwt_token")
        : null;
    if (u) setUser(u);
    if (t) setToken(t);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      json: { email, password },
      credentials: "include",
    });
    setAuth(data);
    setUser(data.user);
    setToken(data.token);
    toast({
      title: "Logged in",
      description: `Welcome back, ${data.user.username}`,
    });
  };

  const signup = async (username: string, email: string, password: string) => {
    const data = await apiFetch<AuthResponse>("/auth/signup", {
      method: "POST",
      json: { username, email, password },
      // credentials: "include",
    });
    setAuth(data);
    setUser(data.user);
    setToken(data.token);
    toast({
      title: "Account created",
      description: `Welcome, ${data.user.username}`,
    });
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore API failure, still clear locally
    } finally {
      clearAuth();
      setUser(null);
      setToken(null);
      toast({ title: "Logged out" });
    }
  };

  const value = useMemo(
    () => ({ user, token, login, signup, logout }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
