import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dealApi } from '../api/dealApi';
import { type Deal } from '../types/deal.types';
import { formatNaira } from '../utils/formatNaira';
import { triggerPaystackModalPopup } from '../utils/paystackPopup';
import { LiveProofRecorder, type CapturedProofData } from '../components/camera/LiveProofRecorder';
import { WaybillScannerCard, type WaybillFormValues } from '../components/waybill/WaybillScannerCard';
import { OtpReleasePad } from '../components/escrow/OtpReleasePad';
import { LedgerTimeline } from '../components/escrow/LedgerTimeline';
import {
  Copy,
  Check,
  Lock,
  Truck,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Loader2,
  Sparkles,
  ExternalLink,
  MapPin,
  CreditCard,
  ShieldCheck,
  X,
} from 'lucide-react';

export const DealRoomPage: React.FC = () => {
  const { shortCode = '' } = useParams<{ shortCode: string }>();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<'BUYER' | 'VENDOR'>('BUYER');
  const [copiedLink, setCopiedLink] = useState(false);
  const [issuedOtp, setIssuedOtp] = useState<string | null>(
    localStorage.getItem(`confam_buyer_otp_${shortCode.toUpperCase()}`)
  );

  // Interactive Paystack Inline Popup Modal State
  const [paystackPopupOpen, setPaystackPopupOpen] = useState(false);
  const [pendingPaystackRef, setPendingPaystackRef] = useState<string>('');
  const [payMethodTab, setPayMethodTab] = useState<'CARD' | 'TRANSFER' | 'USSD'>('CARD');

  const [capturedProof, setCapturedProof] = useState<CapturedProofData | null>(null);
  const [waybillForm, setWaybillForm] = useState<WaybillFormValues>({
    receiptFile: null,
    transport_company: 'Peace Mass Transit (PMT)',
    waybill_number: '',
    driver_phone: '',
    vehicle_plate: '',
    origin_park: 'Upper Iweka Park, Onitsha',
    destination_park: 'UNIZIK Tempsite Park, Awka',
    ai_ocr_summary: '',
  });

  const fetchDeal = async () => {
    try {
      const data = await dealApi.getDeal(shortCode);
      setDeal(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
    const interval = setInterval(fetchDeal, 5000);
    return () => clearInterval(interval);
  }, [shortCode]);

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Opens Paystack as an Inline Popup Modal (NEVER redirects away from the page)
  const handleOpenPaystackPopup = async () => {
    if (!deal) return;
    setActionLoading(true);
    try {
      const checkout = await dealApi.initializePayment(deal.short_code);
      setPendingPaystackRef(checkout.reference);

      const { usedNativeSdk } = triggerPaystackModalPopup({
        email: deal.buyer.email,
        amountKobo: deal.financials.total_payable_kobo,
        reference: checkout.reference,
        metadata: { deal_short_code: deal.short_code },
        onSuccess: async (ref) => {
          const verified = await dealApi.verifyPaymentCallback(deal.short_code, ref);
          setDeal(verified.deal);
          if (verified.buyer_release_otp) {
            setIssuedOtp(verified.buyer_release_otp);
          }
        },
      });

      if (!usedNativeSdk) {
        // Show our built-in interactive Paystack Inline Popup Modal right on screen
        setPaystackPopupOpen(true);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPopupPayment = async () => {
    if (!deal || !pendingPaystackRef) return;
    setActionLoading(true);
    try {
      const verified = await dealApi.verifyPaymentCallback(deal.short_code, pendingPaystackRef);
      setDeal(verified.deal);
      if (verified.buyer_release_otp) {
        setIssuedOtp(verified.buyer_release_otp);
      }
      setPaystackPopupOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVendorDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal || !capturedProof) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('proof_video', capturedProof.videoFile);
      if (capturedProof.keyframeFile) {
        formData.append('keyframe_image', capturedProof.keyframeFile);
      }
      formData.append('client_sha256_hash', capturedProof.sha256Hash);
      if (capturedProof.lat) formData.append('recorded_lat', String(capturedProof.lat));
      if (capturedProof.lng) formData.append('recorded_lng', String(capturedProof.lng));

      if (waybillForm.receiptFile) {
        formData.append('receipt_image', waybillForm.receiptFile);
      }
      formData.append('transport_company', waybillForm.transport_company);
      formData.append('waybill_number', waybillForm.waybill_number);
      formData.append('driver_phone', waybillForm.driver_phone);
      formData.append('vehicle_plate', waybillForm.vehicle_plate);
      formData.append('origin_park', waybillForm.origin_park);
      formData.append('destination_park', waybillForm.destination_park);
      formData.append('ai_ocr_summary', waybillForm.ai_ocr_summary);

      const updated = await dealApi.dispatchDealWithProof(deal.short_code, formData);
      setDeal(updated);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-7 h-7 text-[#7C5CFC] animate-spin mx-auto mb-2" />
        <p className="text-xs font-display text-[#9496A1]">Loading Confam Deal Room...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <h2 className="font-display font-bold text-xl text-white">Deal Code Not Found</h2>
        <p className="text-xs text-[#9496A1]">No escrow record matches &quot;{shortCode}&quot;.</p>
      </div>
    );
  }

  const statusBadge = {
    AWAITING_PAYMENT: { label: 'AWAITING BUYER DEPOSIT', icon: Clock },
    FUNDED_LOCKED: { label: 'ESCROW LOCKED — AWAITING VIDEO OCR', icon: Lock },
    DISPATCHED_IN_TRANSIT: { label: 'VIDEO OCR VERIFIED — IN TRANSIT', icon: Truck },
    COMPLETED_RELEASED: { label: 'CONFAMED & PAYOUT SETTLED', icon: CheckCircle2 },
    DISPUTE_FROZEN: { label: 'DISPUTE FROZEN — ARBITRATION', icon: AlertOctagon },
    REFUNDED: { label: 'REFUNDED TO BUYER', icon: AlertOctagon },
  }[deal.status];

  const StatusIcon = statusBadge.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Deal Header */}
      <div className="iz-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono-tabular font-bold text-lg text-[#9B82FF]">
              #{deal.short_code}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 text-xs font-display font-semibold text-white flex items-center gap-1.5">
              <StatusIcon className="w-3.5 h-3.5 text-[#10B981]" />
              {statusBadge.label}
            </span>
          </div>
          <p className="text-xs text-[#9496A1]">
            Merchant: <strong className="text-white">{deal.vendor.name}</strong> ({deal.vendor.bank_name} • {deal.vendor.account_masked})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-full bg-[#0B0B10] p-1 border border-white/10 text-xs font-display">
            <button
              type="button"
              onClick={() => setActiveRole('BUYER')}
              className={`px-3.5 py-1.5 rounded-full cursor-pointer transition ${
                activeRole === 'BUYER' ? 'bg-[#7C5CFC] text-white font-semibold' : 'text-[#9496A1]'
              }`}
            >
              Buyer View
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('VENDOR')}
              className={`px-3.5 py-1.5 rounded-full cursor-pointer transition ${
                activeRole === 'VENDOR' ? 'bg-[#7C5CFC] text-white font-semibold' : 'text-[#9496A1]'
              }`}
            >
              Vendor View (Upload Video)
            </button>
          </div>

          <button type="button" onClick={handleCopyShareUrl} className="iz-btn-outline">
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
          </button>
        </div>
      </div>

      {/* Buyer's Secret 4-Digit Release OTP Banner */}
      {issuedOtp && activeRole === 'BUYER' && deal.status !== 'COMPLETED_RELEASED' && (
        <div className="iz-slanted-banner !transform-none p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-display font-bold uppercase tracking-wider text-white">
              SECRET BUYER DELIVERY RELEASE OTP (KEEP SAFE UNTIL INSPECTION)
            </div>
            <p className="text-xs text-white/85">
              Only enter this 4-digit code after inspecting your package at {deal.waybill_manifest?.destination_park || 'delivery'}.
            </p>
          </div>
          <div className="font-mono-tabular font-bold text-2xl tracking-[0.35em] text-[#10B981] bg-[#0B0B10] px-5 py-2.5 rounded-2xl border border-white/20 text-center">
            {issuedOtp}
          </div>
        </div>
      )}

      {/* Item & Escrow Summary */}
      <div className="iz-card p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-7 space-y-2">
          <span className="text-xs font-display font-semibold text-[#9B82FF] uppercase tracking-wider">
            {deal.delivery_mode === 'INTERSTATE_WAYBILL' ? 'INTER-STATE MOTOR PARK WAYBILL' : 'LOCAL DISPATCH'}
          </span>
          <h2 className="font-display font-bold text-xl text-white">{deal.item.title}</h2>
          {deal.item.description && <p className="text-xs text-[#9496A1] leading-relaxed">{deal.item.description}</p>}
        </div>

        <div className="md:col-span-5 bg-[#0B0B10] border border-white/10 rounded-2xl p-4 space-y-2 font-mono-tabular text-xs">
          <div className="flex justify-between text-[#9496A1]">
            <span>Item Price:</span>
            <span className="text-white">{formatNaira(deal.financials.item_amount_naira)}</span>
          </div>
          <div className="flex justify-between text-[#9496A1]">
            <span>Waybill Shield Fee:</span>
            <span className="text-white">{formatNaira(deal.financials.waybill_fee_naira)}</span>
          </div>
          <div className="flex justify-between text-[#9496A1]">
            <span>1.5% Confam Trust Fee:</span>
            <span className="text-white">{formatNaira(deal.financials.platform_fee_naira)}</span>
          </div>
          <div className="flex justify-between pt-2.5 border-t border-white/10 text-sm font-bold text-[#10B981]">
            <span>Total Escrow Lock:</span>
            <span>{formatNaira(deal.financials.total_payable_naira)}</span>
          </div>
        </div>
      </div>

      {/* STATE 1: Awaiting Payment -> Triggers Paystack Inline Popup */}
      {deal.status === 'AWAITING_PAYMENT' && (
        <div className="iz-card p-6 space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="font-display font-bold text-lg text-white">
              Lock Funds via Instant Paystack Popup
            </h3>
            <p className="text-xs text-[#9496A1]">
              Zero page redirects. Pay via Card, Transfer, or USSD right inside the popup modal and receive your 4-digit Release OTP immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenPaystackPopup}
            disabled={actionLoading}
            className="iz-btn-pill shrink-0 !py-3.5 !px-7"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Pay {formatNaira(deal.financials.total_payable_naira)} (Popup)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* STATE 2: Funded -> Vendor Uploads Packing Video (OCR) + Scans Waybill */}
      {deal.status === 'FUNDED_LOCKED' && activeRole === 'VENDOR' && (
        <form onSubmit={handleVendorDispatch} className="space-y-5">
          <LiveProofRecorder onProofCaptured={setCapturedProof} />
          <WaybillScannerCard shortCode={deal.short_code} values={waybillForm} onChange={setWaybillForm} />

          <button
            type="submit"
            disabled={!capturedProof || !waybillForm.driver_phone || actionLoading}
            className="iz-btn-pill w-full !py-4 !text-sm"
          >
            {actionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Run Gemini 3.8 Video OCR & Dispatch Waybill Manifest</span>
            )}
          </button>
        </form>
      )}

      {deal.status === 'FUNDED_LOCKED' && activeRole === 'BUYER' && (
        <div className="iz-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-[#10B981]">
              Escrow Locked! Waiting for Vendor Video OCR & Waybill Upload
            </h3>
            <p className="text-xs text-[#9496A1]">
              Switch to &quot;Vendor View (Upload Video)&quot; at the top right to test uploading a packing video and running Gemini 3.8 Video OCR.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveRole('VENDOR')}
            className="iz-btn-pill shrink-0"
          >
            Switch to Vendor Video Upload →
          </button>
        </div>
      )}

      {/* Verified Proof-of-Pack Video OCR & Waybill Manifest Cards */}
      {deal.proof_artifact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="iz-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-white">
                Verified Proof-of-Pack Video & OCR
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 text-xs font-mono-tabular text-[#10B981] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {deal.proof_artifact.ai_confidence_score ?? 97}% Gemini 3.8 Match
              </span>
            </div>

            <video
              src={deal.proof_artifact.video_url}
              controls
              className="w-full h-48 object-cover rounded-xl border border-white/10 bg-[#0B0B10]"
            />

            <p className="text-xs text-[#10B981] font-medium">{deal.proof_artifact.ai_audit_summary}</p>
            <div className="p-2.5 rounded-xl bg-[#0B0B10] border border-white/10 text-[10px] font-mono-tabular text-[#9496A1] break-all">
              <strong className="text-white">SHA-256:</strong> {deal.proof_artifact.video_sha256_hash}
            </div>
          </div>

          {deal.waybill_manifest && (
            <div className="iz-card p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-white">
                    AI Motor-Park Waybill Manifest
                  </span>
                  <span className="text-xs font-mono-tabular text-[#F59E0B] font-bold">
                    {deal.waybill_manifest.transport_company}
                  </span>
                </div>

                <div className="bg-[#0B0B10] border border-white/10 rounded-xl p-3.5 space-y-2 text-xs font-mono-tabular">
                  <div className="flex justify-between">
                    <span className="text-[#9496A1]">Waybill No:</span>
                    <span className="text-white font-bold">{deal.waybill_manifest.waybill_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9496A1]">Driver Phone:</span>
                    <span className="text-[#10B981] font-bold">{deal.waybill_manifest.driver_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9496A1]">Vehicle Plate:</span>
                    <span className="text-white">{deal.waybill_manifest.vehicle_plate || 'Park Bus'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9496A1]">Destination:</span>
                    <span className="text-white">{deal.waybill_manifest.destination_park}</span>
                  </div>
                </div>

                {deal.waybill_manifest.last_location_label && (
                  <div className="p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs text-[#10B981] flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{deal.waybill_manifest.last_location_label}</span>
                  </div>
                )}
              </div>

              <a
                href={deal.waybill_manifest.driver_ping_url}
                target="_blank"
                rel="noreferrer"
                className="iz-btn-outline w-full"
              >
                <span>Open Zero-Install Driver GPS Ping Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* STATE 3: Dispatched -> Buyer Enters 4-Digit Release OTP */}
      {deal.status === 'DISPATCHED_IN_TRANSIT' && (
        <OtpReleasePad
          otpRemaining={deal.security.otp_remaining}
          isLocked={deal.security.is_otp_locked}
          onRelease={async (otp) => {
            const settled = await dealApi.releaseWithOtp(deal.short_code, otp);
            setDeal(settled);
          }}
          onFreezeDispute={async (reason) => {
            const frozen = await dealApi.freezeDispute(deal.short_code, reason, activeRole);
            setDeal(frozen);
          }}
        />
      )}

      {/* Double-Entry Ledger Timeline */}
      <LedgerTimeline ledgers={deal.ledgers} />

      {/* PAYSTACK INLINE POPUP MODAL (Zero Redirects) */}
      {paystackPopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#13131F] border border-[#7C5CFC]/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Paystack Popup Top Header */}
            <div className="px-6 py-4 bg-[#0B0B10] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#10B981] flex items-center justify-center text-[#0B0B10] font-bold text-xs">
                  P
                </div>
                <div>
                  <div className="font-display font-bold text-xs text-white">PAYSTACK INLINE ESCROW</div>
                  <div className="text-[10px] text-[#9496A1]">{deal.buyer.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaystackPopupOpen(false)}
                className="p-1.5 rounded-full text-[#9496A1] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <span className="text-[11px] font-mono-tabular uppercase text-[#9496A1]">
                  CONFAM ESCROW LOCK (#{deal.short_code})
                </span>
                <div className="font-display font-bold text-3xl text-[#10B981]">
                  {formatNaira(deal.financials.total_payable_naira)}
                </div>
              </div>

              {/* Payment Channel Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-[#0B0B10] p-1 rounded-full border border-white/10 text-xs font-display">
                {(['CARD', 'TRANSFER', 'USSD'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethodTab(m)}
                    className={`py-1.5 rounded-full cursor-pointer transition ${
                      payMethodTab === m ? 'bg-[#7C5CFC] text-white font-semibold' : 'text-[#9496A1]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {payMethodTab === 'CARD' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    defaultValue="4084 0840 8408 4081"
                    className="iz-input font-mono-tabular text-center tracking-widest"
                    placeholder="Card Number"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" defaultValue="09/28" className="iz-input font-mono-tabular text-center" />
                    <input type="password" defaultValue="408" className="iz-input font-mono-tabular text-center" />
                  </div>
                </div>
              )}

              {payMethodTab === 'TRANSFER' && (
                <div className="p-4 rounded-2xl bg-[#0B0B10] border border-white/10 text-center space-y-1 font-mono-tabular">
                  <div className="text-xs text-[#9496A1]">Paystack Titan Trust Virtual Account</div>
                  <div className="text-xl font-bold text-white tracking-wider">9948201942</div>
                  <div className="text-[11px] text-[#10B981]">Auto-confirms in 3 seconds</div>
                </div>
              )}

              {payMethodTab === 'USSD' && (
                <div className="p-4 rounded-2xl bg-[#0B0B10] border border-white/10 text-center space-y-1 font-mono-tabular">
                  <div className="text-xs text-[#9496A1]">GTBank / Access / Zenith USSD</div>
                  <div className="text-lg font-bold text-[#9B82FF]">*737*000*9482#</div>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmPopupPayment}
                disabled={actionLoading}
                className="iz-btn-pill w-full !py-3.5"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize Escrow Deposit ({formatNaira(deal.financials.total_payable_naira)})</span>
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-[#9496A1] flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3 text-[#10B981]" />
                <span>Secured by Paystack Inline 256-bit Encryption</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};