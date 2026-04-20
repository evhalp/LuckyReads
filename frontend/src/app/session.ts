import { clearAuthToken, getAuthToken, storeAuthToken } from "../api/client";
import type { AuthUser } from "../api/auth";

const AUTH_USER_STORAGE_KEY = "luckyreads.authUser";

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export function getStoredUser(): AuthUser | null {
  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export function storeSession(token: string | undefined, user: AuthUser | undefined) {
  if (token) {
    storeAuthToken(token);
  }

  if (user) {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  }
}

export function clearSession() {
  clearAuthToken();
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function getUserInitials() {
  const user = getStoredUser();
  const source = user?.username?.trim() || user?.email?.trim() || "";

  if (!source) {
    return "LR";
  }

  const parts = source.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");

  return initials || source.slice(0, 2).toUpperCase();
}
