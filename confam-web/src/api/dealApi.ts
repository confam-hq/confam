import { api, resolveMediaUrl } from "./client";
import type { Bank, CreateDealPayload, Deal, User } from "../types/deal.types";

type ApiDealStatus =
  | "AWAITING_PAYMENT"
  | "FUNDED_LOCKED"
  | "DISPATCHED_IN_TRANSIT"
  | "COMPLETED_RELEASED"
  | "DISPUTE_FROZEN"
  | "REFUNDED";

interface ApiDealResponse {
  deal: {
    short_code: string;
    status: ApiDealStatus;
    item: { title: string; description: string | null };
    financials: {
      item_amount_naira: number;
      waybill_fee_naira: number;
      platform_fee_naira: number;
      platform_fee_payer: "buyer" | "vendor";
      total_payable_naira: number;
    };
    vendor: { name: string };
    buyer: { name: string; phone_masked: string; email: string };
    proof_artifact: {
      video_url: string;
      video_sha256_hash: string;
      ai_confidence_score: number | null;
    } | null;
    waybill_manifest: {
      transport_company: string | null;
      waybill_number: string | null;
      driver_phone: string | null;
      vehicle_plate: string | null;
      origin_park: string | null;
      destination_park: string | null;
      driver_ping_url: string;
      last_known_lat: number | null;
      last_known_lng: number | null;
      last_pinged_at: string | null;
    } | null;
    ledgers: { id: number; event_type: string; actor_role: string; created_at: string | null }[];
    timestamps: { created_at: string | null };
  };
}

export interface WaybillOcrResult {
  transport_company: string | null;
  waybill_number: string | null;
  driver_phone: string | null;
  vehicle_plate: string | null;
  origin_park: string | null;
  destination_park: string | null;
  is_valid_receipt: boolean;
  ai_summary_note: string;
}

export interface DispatchPayload {
  receipt_image?: File | null;
  transport_company: string;
  waybill_number: string;
  driver_phone: string;
  vehicle_plate: string;
  origin_park: string;
  destination_park: string;
  ai_summary_note: string;
}

export interface VendorProfilePayload {
  name: string;
  phone: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  avatar?: File | null;
}

export interface AuthSession {
  id: number;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

const dealStatus: Record<ApiDealStatus, Deal["status"]> = {
  AWAITING_PAYMENT: "pending",
  FUNDED_LOCKED: "escrow_locked",
  DISPATCHED_IN_TRANSIT: "in_transit",
  COMPLETED_RELEASED: "settled",
  DISPUTE_FROZEN: "disputed",
  REFUNDED: "refunded",
};

const mapApiDeal = (deal: ApiDealResponse["deal"]): Deal => {
  const manifest = deal.waybill_manifest;
  const pingPath = manifest?.driver_ping_url.split("/").filter(Boolean) ?? [];
  const pingToken = pingPath[pingPath.length - 1];

  return {
    id: deal.short_code,
    code: deal.short_code,
    title: deal.item.title,
    description: deal.item.description ?? undefined,
    amount: deal.financials.item_amount_naira,
    waybill_fee: deal.financials.waybill_fee_naira,
    platform_fee: deal.financials.platform_fee_naira,
    platform_fee_payer: deal.financials.platform_fee_payer,
    total_payable: deal.financials.total_payable_naira,
    status: dealStatus[deal.status],
    vendor_name: deal.vendor.name,
    buyer_name: deal.buyer.name,
    buyer_phone: deal.buyer.phone_masked,
    buyer_email: deal.buyer.email,
    proof_video_url: resolveMediaUrl(deal.proof_artifact?.video_url),
    ai_match: deal.proof_artifact?.ai_confidence_score ?? null,
    sha256: deal.proof_artifact?.video_sha256_hash ?? null,
    waybill: manifest
      ? {
          route:
            [manifest.origin_park, manifest.destination_park].filter(Boolean).join(" → ") ||
            manifest.transport_company ||
            manifest.waybill_number ||
            "Waybill",
          park: manifest.origin_park ?? undefined,
          plate: manifest.vehicle_plate ?? undefined,
          driver_name: manifest.transport_company ?? undefined,
          driver_phone: manifest.driver_phone ?? undefined,
          ping_token: pingToken,
          last_ping:
            manifest.last_known_lat !== null && manifest.last_known_lng !== null
              ? {
                  lat: manifest.last_known_lat,
                  lng: manifest.last_known_lng,
                  at: manifest.last_pinged_at ?? "",
                }
              : null,
        }
      : null,
    events: deal.ledgers.map((event) => ({
      id: event.id,
      label: event.event_type,
      detail: event.actor_role,
      at: event.created_at ?? "",
    })),
    created_at: deal.timestamps.created_at ?? new Date().toISOString(),
  };
};

const mapAuthUser = (user: User): User => ({
  ...user,
  avatar_url: resolveMediaUrl(user.avatar_url),
});

// NOTE: adjust the paths below if your Laravel routes differ.
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>("/auth/login", { email, password })
      .then((r) => ({ ...r.data, user: mapAuthUser(r.data.user) })),
  register: (payload: Record<string, unknown>) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value instanceof File) form.append(key, value);
      else if (value !== null && value !== undefined) form.append(key, String(value));
    });
    return api.post<{ message: string; email: string }>("/auth/register", form)
      .then((r) => r.data);
  },
  verifyEmail: (email: string, code: string) =>
    api.post<{ message: string }>("/auth/verification/verify", { email, code }).then((r) => r.data),
  resendVerification: (email: string) =>
    api.post<{ message: string }>("/auth/verification/resend", { email }).then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/password/forgot", { email }).then((r) => r.data),
  resetPassword: (email: string, code: string, password: string, password_confirmation: string) =>
    api.post<{ message: string }>("/auth/password/reset", { email, code, password, password_confirmation }).then((r) => r.data),
  sessions: () =>
    api.get<{ current_token_id: number | null; sessions: AuthSession[] }>("/auth/sessions").then((r) => r.data),
  revokeSession: (id: number) =>
    api.delete<{ message: string; current: boolean }>(`/auth/sessions/${id}`).then((r) => r.data),
  unlock: (password: string) =>
    api.post<{ message: string }>("/auth/unlock", { password }).then((r) => r.data),
  logout: () => api.post<{ message: string }>("/auth/logout").then((r) => r.data),
  me: () => api.get<{ user: User }>("/vendor/me").then((r) => mapAuthUser(r.data.user)),
  updateProfile: (payload: VendorProfilePayload) => {
    const form = new FormData();
    form.append("_method", "PATCH");
    Object.entries(payload).forEach(([key, value]) => {
      if (value instanceof File) form.append(key, value);
      else if (value !== null && value !== undefined) form.append(key, String(value));
    });
    return api.post<{ user: User }>("/vendor/profile", form)
      .then((r) => mapAuthUser(r.data.user));
  },
  banks: () =>
    api.get<unknown>("/banks").then((r) => {
      const payload = r.data;
      const response = typeof payload === "object" && payload !== null
        ? payload as { banks?: unknown; data?: unknown }
        : {};
      const raw = Array.isArray(payload)
        ? payload
        : Array.isArray(response.banks)
          ? response.banks
          : Array.isArray(response.data)
            ? response.data
            : null;
      if (!raw || raw.length === 0) throw new Error("Bank list response was empty or invalid.");

      const banks = raw.map((entry): Bank => {
        if (typeof entry !== "object" || entry === null || !("code" in entry) || !("name" in entry)) {
          throw new Error("Bank list response contained an invalid bank.");
        }
        const bank = entry as { code: unknown; name: unknown };
        if ((typeof bank.code !== "string" && typeof bank.code !== "number") || typeof bank.name !== "string") {
          throw new Error("Bank list response contained an invalid bank.");
        }
        return { code: String(bank.code), name: bank.name };
      });
      return [...new Map(banks.map((bank) => [bank.code, bank])).values()]
        .sort((a, b) => a.name.localeCompare(b.name));
    }),

  resolveBank: (account_number: string, bank_code: string) =>
    api.post<unknown>("/banks/resolve", { account_number, bank_code }).then((r) => {
      const payload = r.data;
      const response = typeof payload === "object" && payload !== null
        ? payload as { data?: unknown; account_name?: unknown; accountName?: unknown }
        : {};
      const data = typeof response.data === "object" && response.data !== null
        ? response.data as { account_name?: unknown; accountName?: unknown }
        : response;
      const account_name = data.account_name ?? data.accountName;
      if (typeof account_name !== "string" || !account_name) throw new Error("Could not resolve account");
      return { account_name };
    }),
};

export const dealApi = {
  list: (role: "vendor" | "buyer" = "vendor") =>
    api
      .get<{ deals: ApiDealResponse["deal"][] | { data: ApiDealResponse["deal"][] } }>(`/${role}/deals`)
      .then((r) => {
        const deals = Array.isArray(r.data.deals) ? r.data.deals : r.data.deals?.data ?? [];
        return deals.map(mapApiDeal);
      }),
  get: (code: string) => api.get<ApiDealResponse>(`/deals/${code}`).then((r) => mapApiDeal(r.data.deal)),
  create: (payload: CreateDealPayload) =>
    api.post<ApiDealResponse>("/deals", payload).then(({ data }) => mapApiDeal(data.deal)),

  initPayment: (code: string, email: string, callbackUrl: string) =>
    api
      .post<{
        message: string;
        checkout: {
          reference?: string;
          public_key?: string;
          mock_mode?: boolean;
        };
      }>(`/deals/${code}/pay`, { email, callback_url: callbackUrl })
      .then((r) => r.data),
  verifyPayment: (code: string, reference: string) =>
    api.post(`/deals/${code}/verify-payment`, { reference }).then((r) => r.data),

  uploadProof: (code: string, video: Blob, sha256: string, onProgress?: (p: number) => void) => {
    const fd = new FormData();
    fd.append("proof_video", video, `proof-${Date.now()}.webm`);
    fd.append("client_sha256_hash", sha256);
    return api
      .post<ApiDealResponse>(`/deals/${code}/proof`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
      .then((r) => mapApiDeal(r.data.deal));
  },

  scanWaybill: (code: string, image: File) => {
    const fd = new FormData();
    fd.append("receipt_image", image);
    return api
      .post<{ ocr: WaybillOcrResult }>(`/deals/${code}/parse-waybill`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.ocr);
  },

  dispatch: (code: string, payload: DispatchPayload) => {
    const fd = new FormData();
    if (payload.receipt_image) fd.append("receipt_image", payload.receipt_image);
    fd.append("transport_company", payload.transport_company);
    fd.append("waybill_number", payload.waybill_number ?? "");
    fd.append("driver_phone", payload.driver_phone);
    fd.append("vehicle_plate", payload.vehicle_plate ?? "");
    fd.append("origin_park", payload.origin_park ?? "");
    fd.append("destination_park", payload.destination_park);
    fd.append("ai_ocr_summary", payload.ai_summary_note.slice(0, 255));
    return api
      .post<ApiDealResponse>(`/deals/${code}/dispatch`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => mapApiDeal(r.data.deal));
  },

  release: (code: string, otp: string) =>
    api.post<ApiDealResponse>(`/deals/${code}/release`, { otp }).then((r) => mapApiDeal(r.data.deal)),
  confirmDelivery: (code: string) =>
    api.post<ApiDealResponse>(`/deals/${code}/confirm-delivery`).then((r) => mapApiDeal(r.data.deal)),
  dispute: (code: string, reason: string) =>
    api.post<ApiDealResponse>(`/deals/${code}/dispute`, { reason }).then((r) => mapApiDeal(r.data.deal)),
};

export const driverApi = {
  ping: (token: string, lat: number, lng: number) =>
    api
      .post<{ message: string; last_pinged_at: string }>(
        `/driver/${encodeURIComponent(token)}/ping`,
        { lat, lng },
      )
      .then((r) => r.data),
};

export const adminApi = {
  disputes: () =>
    api.get<{ data: ApiDealResponse["deal"][] }>("/admin/disputes")
      .then((r) => r.data.data.map(mapApiDeal)),
  revenue: () =>
    api.get<{ total: number; fees: number; settled: number }>("/admin/revenue").then((r) => r.data),
  databaseResetStatus: () =>
    api.get<{ enabled: boolean; driver: string }>("/admin/database/reset-status").then((r) => r.data),
  resolve: (code: string, outcome: "release" | "refund") =>
    api.post<ApiDealResponse>(`/admin/disputes/${code}/resolve`, { outcome })
      .then((r) => mapApiDeal(r.data.deal)),
  resetDatabase: (password: string, confirmation: string) =>
    api.post<{
      message: string;
      backup_file: string;
      deleted: { deals: number; accounts: number };
    }>("/admin/database/reset", { password, confirmation }).then((r) => r.data),
  downloadDatabaseBackup: (fileName: string) =>
    api.get<Blob>(`/admin/database/backups/${encodeURIComponent(fileName)}`, { responseType: "blob" })
      .then((r) => r.data),
};