import { api } from "./client";
import type { Bank, CreateDealPayload, Deal, User, Waybill } from "../types/deal.types";

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
    financials: { item_amount_naira: number };
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
    status: dealStatus[deal.status],
    vendor_name: deal.vendor.name,
    buyer_name: deal.buyer.name,
    buyer_phone: deal.buyer.phone_masked,
    buyer_email: deal.buyer.email,
    proof_video_url: deal.proof_artifact?.video_url ?? null,
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

// NOTE: adjust the paths below if your Laravel routes differ.
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>("/auth/login", { email, password }).then((r) => r.data),
  register: (payload: Record<string, any>) =>
    api.post<{ token: string; user: User }>("/auth/register", payload).then((r) => r.data),
  me: () => api.get<{ user: User }>("/auth/me").then((r) => r.data.user),
     banks: () =>
    api.get<any>("/banks").then((r) => {
      const raw: any[] = Array.isArray(r.data) ? r.data : r.data?.data ?? r.data?.banks ?? [];
      const m = new Map<string, Bank>();
      raw.forEach((b) => m.set(String(b.code), { code: String(b.code), name: b.name }));
      return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
    }),

  resolveBank: (account_number: string, bank_code: string) =>
    api.post<any>("/banks/resolve", { account_number, bank_code }).then((r) => {
      const d = r.data?.data ?? r.data;
      const account_name = d?.account_name ?? d?.accountName;
      if (!account_name) throw new Error("Could not resolve account");
      return { account_name: String(account_name) };
    }),
};

export const dealApi = {
  list: () => api.get<{ data: Deal[] }>("/deals").then((r) => r.data.data),
  get: (code: string) => api.get<ApiDealResponse>(`/deals/${code}`).then((r) => mapApiDeal(r.data.deal)),
  create: (payload: CreateDealPayload) =>
    api.post<ApiDealResponse>("/deals", payload).then(({ data }) => mapApiDeal(data.deal)),

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