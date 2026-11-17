export type Role = "vendor" | "buyer" | "admin";
export type DealStatus = "pending" | "escrow_locked" | "in_transit" | "settled" | "disputed" | "refunded";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
}

export interface LedgerEvent {
  id: number | string;
  label: string;
  detail?: string;
  at: string;
}

export interface Waybill {
  id?: number | string;
  route: string;
  park?: string;
  plate?: string;
  driver_name?: string;
  driver_phone?: string;
  ping_token?: string;
  last_ping?: { lat: number; lng: number; at: string } | null;
}

export interface Deal {
  id: number | string;
  code: string;
  title: string;
  description?: string;
  amount: number;
  status: DealStatus;
  vendor_name?: string;
  buyer_name?: string;
  buyer_phone?: string;
  buyer_email?: string;
  release_otp?: string;
  proof_video_url?: string | null;
  ai_match?: number | null;
  sha256?: string | null;
  waybill?: Waybill | null;
  events?: LedgerEvent[];
  created_at: string;
}

export interface CreateDealPayload {
  title: string;
  description?: string;
  amount: number;
  buyer_phone?: string;
}

export interface Bank { code: string; name: string }