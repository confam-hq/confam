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

export const errMsg = (e: any, fallback = "Something went wrong") =>
  e?.response?.data?.message || e?.message || fallback;