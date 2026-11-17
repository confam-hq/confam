import { api } from "./client";
import type { Bank, CreateDealPayload, Deal, User, Waybill } from "../types/deal.types";

// NOTE: adjust the paths below if your Laravel routes differ.
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>("/auth/login", { email, password }).then((r) => r.data),
  register: (payload: Record<string, any>) =>
    api.post<{ token: string; user: User }>("/auth/register", payload).then((r) => r.data),
  me: () => api.get<{ user: User }>("/auth/me").then((r) => r.data.user),
  banks: () => api.get<{ data: Bank[] }>("/banks").then((r) => r.data.data),
  resolveBank: (account_number: string, bank_code: string) =>
    api
      .post<{ account_name: string }>("/banks/resolve", { account_number, bank_code })
      .then((r) => r.data),
};

export const dealApi = {
  list: () => api.get<{ data: Deal[] }>("/deals").then((r) => r.data.data),
  get: (code: string) => api.get<{ data: Deal }>(`/deals/${code}`).then((r) => r.data.data),
  create: (p: CreateDealPayload) => api.post<{ data: Deal }>("/deals", p).then((r) => r.data.data),

  initPayment: (code: string, email: string) =>
    api
      .post<{ reference: string; access_code?: string; amount?: number }>(`/deals/${code}/pay`, { email })
      .then((r) => r.data),
  verifyPayment: (code: string, reference: string) =>
    api.post(`/deals/${code}/pay/verify`, { reference }).then((r) => r.data),

  uploadProof: (code: string, video: Blob, sha256: string, onProgress?: (p: number) => void) => {
    const fd = new FormData();
    fd.append("proof_video", video, `proof-${Date.now()}.webm`);
    fd.append("sha256", sha256);
    return api
      .post<{ data: Deal }>(`/deals/${code}/proof`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
      .then((r) => r.data.data);
  },

  scanWaybill: (code: string, image: File) => {
    const fd = new FormData();
    fd.append("waybill_image", image);
    return api
      .post<{ data: Deal }>(`/deals/${code}/waybill/scan`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  },

  release: (code: string, otp: string) =>
    api.post<{ data: Deal }>(`/deals/${code}/release`, { otp }).then((r) => r.data.data),
  payout: (code: string) => api.post<{ data: Deal }>(`/deals/${code}/payout`).then((r) => r.data.data),
  dispute: (code: string, reason: string) => api.post(`/deals/${code}/dispute`, { reason }).then((r) => r.data),
};

export const driverApi = {
  ping: (token: string, lat: number, lng: number) =>
    api.post<{ waybill: Waybill }>(`/ping/${token}`, { lat, lng }).then((r) => r.data),
};

export const adminApi = {
  disputes: () => api.get<{ data: Deal[] }>("/admin/disputes").then((r) => r.data.data),
  revenue: () =>
    api.get<{ total: number; fees: number; settled: number }>("/admin/revenue").then((r) => r.data),
  resolve: (code: string, outcome: "release" | "refund") =>
    api.post(`/admin/disputes/${code}/resolve`, { outcome }).then((r) => r.data),
};