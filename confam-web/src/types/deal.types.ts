export type EscrowStatus =
  | 'AWAITING_PAYMENT'
  | 'FUNDED_LOCKED'
  | 'DISPATCHED_IN_TRANSIT'
  | 'COMPLETED_RELEASED'
  | 'DISPUTE_FROZEN'
  | 'REFUNDED';

export type DeliveryMode = 'LOCAL_DISPATCH' | 'INTERSTATE_WAYBILL';

export interface ProofArtifact {
  video_url: string;
  keyframe_url: string | null;
  video_sha256_hash: string;
  recorded_lat: number | null;
  recorded_lng: number | null;
  ai_confidence_score: number | null;
  ai_item_matched: boolean;
  ai_audit_summary: string | null;
  captured_at_utc: string;
}

export interface WaybillManifest {
  receipt_image_url: string | null;
  transport_company: string;
  waybill_number: string | null;
  driver_phone: string;
  vehicle_plate: string | null;
  origin_park: string | null;
  destination_park: string;
  ai_ocr_summary: string | null;
  driver_ping_url: string;
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_location_label: string | null;
  last_pinged_at: string | null;
}

export interface LedgerEntry {
  id: number;
  event_type: string;
  direction: 'CREDIT' | 'DEBIT';
  amount_naira: number;
  actor_role: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Deal {
  short_code: string;
  share_url: string;
  status: EscrowStatus;
  delivery_mode: DeliveryMode;
  item: {
    title: string;
    description: string | null;
  };
  financials: {
    item_amount_naira: number;
    waybill_fee_naira: number;
    platform_fee_naira: number;
    total_payable_naira: number;
    item_amount_kobo: number;
    waybill_fee_kobo: number;
    platform_fee_kobo: number;
    total_payable_kobo: number;
  };
  vendor: {
    name: string;
    phone_masked: string;
    bank_name: string;
    account_masked: string;
    account_name: string;
  };
  buyer: {
    name: string;
    phone_masked: string;
    email: string;
  };
  security: {
    otp_attempts: number;
    otp_remaining: number;
    is_otp_locked: boolean;
    otp_locked_until: string | null;
    dispute_reason: string | null;
  };
  proof_artifact?: ProofArtifact | null;
  waybill_manifest?: WaybillManifest | null;
  ledgers?: LedgerEntry[];
  timestamps: {
    created_at: string;
    funded_at: string | null;
    dispatched_at: string | null;
    completed_at: string | null;
    disputed_at: string | null;
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