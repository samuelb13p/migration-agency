"use client";

const ACCESS_TOKEN_KEY = "migration_access_token";
const REFRESH_TOKEN_KEY = "migration_refresh_token";
const USER_KEY = "migration_user";

export type SessionUser = {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
};

export function saveTokens(input: { accessToken: string; refreshToken: string }) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, input.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, input.refreshToken);
}

export function saveSession(input: { accessToken: string; refreshToken: string; user: SessionUser }) {
  if (typeof window === "undefined") return;

  saveTokens(input);
  localStorage.setItem(USER_KEY, JSON.stringify(input.user));
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getSessionUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (!parsed.email || !parsed.id || !parsed.roleId || !parsed.roleName) {
      localStorage.removeItem(USER_KEY);
      return null;
    }

    return parsed as SessionUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
