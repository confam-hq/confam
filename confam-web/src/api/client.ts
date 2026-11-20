import axios from "axios";

export const TOKEN_KEY = "confam_token";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const normalizedBaseUrl = configuredBaseUrl?.replace(/\/+$/, "");
const apiBaseUrl = normalizedBaseUrl
  ? /\/api\/v1$/i.test(normalizedBaseUrl)
    ? normalizedBaseUrl
    : /\/api$/i.test(normalizedBaseUrl)
      ? `${normalizedBaseUrl}/v1`
      : `${normalizedBaseUrl}/api/v1`
  : "/api/v1";

const isLoopbackHost = (hostname: string) =>
  hostname === "localhost" || hostname === "::1" || hostname === "[::1]" ||
  hostname === "0.0.0.0" || /^127(?:\.\d{1,3}){3}$/.test(hostname);

export const resolveMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  const apiOrigin = new URL(apiBaseUrl, window.location.origin);
  const mediaUrl = new URL(url, apiOrigin.origin);
  if (isLoopbackHost(mediaUrl.hostname)) {
    if (isLoopbackHost(apiOrigin.hostname) && !isLoopbackHost(window.location.hostname)) {
      throw new Error("Configure VITE_API_BASE_URL with the public API host to load deal media.");
    }

    mediaUrl.hostname = apiOrigin.hostname;
    mediaUrl.port = apiOrigin.port;
    mediaUrl.protocol = window.location.protocol === "https:" ? "https:" : apiOrigin.protocol;
  }

  return mediaUrl.toString();
};

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const errMsg = (error: unknown, fallback = "Something went wrong") => {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};