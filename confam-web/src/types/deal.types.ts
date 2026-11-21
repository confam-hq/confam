export type Role = "vendor" | "buyer" | "admin";
export type DeliveryMode = "LOCAL_DISPATCH" | "INTERSTATE_WAYBILL";
export type DealStatus = "pending" | "escrow_locked" | "in_transit" | "settled" | "disputed" | "refunded";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  bank_code?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  avatar_url?: string | null;
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
  waybill_fee?: number;
  platform_fee?: number;
  platform_fee_payer?: "buyer" | "vendor";
  total_payable?: number;
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
  vendor_name: string;
  vendor_phone: string;
  vendor_email: string;
  vendor_bank_code: string;
  vendor_bank_name?: string;
  vendor_account_number: string;
  vendor_account_name: string;
  buyer_name?: string;
  buyer_phone: string;
  buyer_email: string;
  item_title: string;
  item_description?: string;
  item_amount_naira: number;
  waybill_fee_naira?: number;
  delivery_mode: DeliveryMode;
}

export interface Bank { code: string; name: string }