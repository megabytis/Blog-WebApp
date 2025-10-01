"use client";

import type { AuthResponse } from "./types";

export function qs(params: Record<string, any>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    search.set(k, String(v));
  });
  const s = search.toString();
  return s ? `?${s}` : "";
}

const TOKEN_KEY = "blog_jwt_token";
const USER_KEY = "blog_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

type ApiOptions = RequestInit & { json?: any };

export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {}
) {
  // Hit the Vercel proxy route instead of Render directly
  const url = `/api/proxy${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.json ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    ...options,
    headers,
    // include credentials if you want cookies to flow
    credentials: "include",
    body: options.json ? JSON.stringify(options.json) : options.body,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = isJson
      ? (data as any)?.message || "Request failed"
      : String(data);
    throw new Error(message);
  }
  return data as T;
}

// For SWR or other fetchers
export const swrFetcher = (path: string) => apiFetch(path);
