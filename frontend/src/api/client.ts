import axios, { AxiosError } from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "luckyreads.authToken";

export type ApiFieldErrors = Record<string, string[]>;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  headers: { Accept: "application/json" },
  timeout: 10_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Token ${token}`;
    }
  }

  return config;
});

function extractMessages(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value] : [];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractMessages(item));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.detail === "string" && record.detail.trim()) {
      return [record.detail];
    }

    if (typeof record.attr === "string" && typeof record.detail === "string") {
      return [`${record.attr}: ${record.detail}`];
    }

    if (typeof record.code === "string" && Object.keys(record).length === 1) {
      return [record.code];
    }

    return Object.values(record).flatMap((item) => extractMessages(item));
  }

  return [];
}

function normalizeFieldErrors(payload: unknown): ApiFieldErrors | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }

  const entries = Object.entries(payload as Record<string, unknown>)
    .map(([key, value]) => {
      const messages = extractMessages(value);
      if (messages.length > 0) {
        return [key, messages] as const;
      }

      return null;
    })
    .filter((entry): entry is readonly [string, string[]] => entry !== null);

  return entries.length ? Object.fromEntries(entries) : undefined;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;

    if (typeof payload === "string" && payload.trim()) {
      return payload;
    }

    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;

      if (typeof record.detail === "string") {
        return record.detail;
      }

      if (Array.isArray(record.errors)) {
        const errorMessages = extractMessages(record.errors);
        if (errorMessages.length > 0) {
          return errorMessages.join(" ");
        }
      }

      const fieldErrors = normalizeFieldErrors(payload);
      if (fieldErrors) {
        return Object.values(fieldErrors).flat().join(" ");
      }
    }

    return error.message || "Something went wrong. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function getApiFieldErrors(error: unknown): ApiFieldErrors | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  return normalizeFieldErrors(error.response?.data);
}

export function isAxiosApiError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function storeAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
