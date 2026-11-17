import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { dealApi, } from "../api/dealApi";
import { errMsg } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusPill from "../components/escrow/StatusPill";
import LedgerTimeline from "../components/escrow/LedgerTimeline";
import OtpReleasePad from "../components/escrow/OtpReleasePad";
import LiveProofRecorder from "../components/camera/LiveProofRecorder";
import WaybillScannerCard from "../components/waybill/WaybillScannerCard";
import PaystackModal from "../components/payment/PaystackModal";
import { formatNaira } from "../utils/formatNaira";
import type { Deal } from "../types/deal.types";

export default function DealRoomPage() {
  const { code = "" } = useParams();
  const { user } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [err, setErr] = useState("");
  const [pay, setPay] = useState(false);
  const [blob, setBlob] = useState<{ b: Blob; hash: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => dealApi.get(code).then(setDeal).catch((e) => setErr(errMsg(e, "Deal not found"))),
    [code]
  );
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="grid min-h-[50vh] place-items-center text-sm text-muted">{err}</div>;
  if (!deal) return <div className="grid min-h-[50vh] place-items-center text-sm text-muted">Loading deal…</div>;

  const isVendor = user?.role === "vendor";
  const upload = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      setDeal(await dealApi.uploadProof(deal.code, blob.b, blob.hash, setProgress));
      setBlob(null);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const release = async (otp: string) => {
    setBusy(true);
    try { setDeal(await dealApi.release(deal.code, otp)); }
    catch (e) { alert(errMsg(e, "Wrong OTP")); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono-tabular text-xs text-muted">{deal.code}</p>
          <h1 className="text-xl font-semibold sm:text-2xl">{deal.title}</h1>
          {deal.vendor_name && <p className="text-sm text-muted">Sold by {deal.vendor_name}</p>}
        </div>
        <StatusPill status={deal.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="card p-5">
            <p className="label">Amount</p>
            <p className="font-mono-tabular text-3xl font-semibold">{formatNaira(deal.amount)}</p>
            {deal.description && <p className="mt-3 text-sm text-muted">{deal.description}</p>}
            {deal.status === "pending" && !isVendor && (
              <button onClick={() => setPay(true)} className="btn-primary mt-5 w-full sm:w-auto">
                <Lock size={14} /> Pay into escrow
              </button>
            )}
          </div>

          {isVendor && deal.status === "escrow_locked" && (
            <div className="card space-y-3 p-5">
              <p className="text-sm font-medium">Record proof of pack</p>
              <LiveProofRecorder onReady={(b, hash) => setBlob({ b, hash })} />
              {blob && (
                <>
                  <p className="font-mono-tabular truncate text-[11px] text-muted">SHA-256 {blob.hash}</p>
                  <button onClick={upload} disabled={busy} className="btn-primary w-full">
                    {busy ? `Uploading ${progress}%` : "Upload proof"}
                  </button>
                </>
              )}
            </div>
          )}

          {isVendor && deal.status === "escrow_locked" && <WaybillScannerCard code={deal.code} onDone={setDeal} />}

          {deal.proof_video_url && (
            <div className="card p-5">
              <p className="mb-3 text-sm font-medium">Proof of pack</p>
              <video src={deal.proof_video_url} controls playsInline className="aspect-video w-full rounded-lg bg-black" />
              {deal.ai_match != null && (
                <p className="font-mono-tabular mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                  {deal.ai_match}% AI Match • SHA-256 Verified
                </p>
              )}
            </div>
          )}

          {deal.waybill && (
            <div className="card p-5">
              <p className="mb-2 text-sm font-medium">Waybill</p>
              <p className="text-sm">{deal.waybill.route}</p>
              <p className="text-xs text-muted">
                {[deal.waybill.park, deal.waybill.plate, deal.waybill.driver_name].filter(Boolean).join(" • ")}
              </p>
              {isVendor && deal.waybill.ping_token && (
                <p className="font-mono-tabular mt-2 break-all text-[11px] text-muted">
                  Driver link: {window.location.origin}/ping/{deal.waybill.ping_token}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {!isVendor && deal.status === "in_transit" && (
            <div className="card p-5">
              <p className="mb-1 text-sm font-medium">Confirm delivery</p>
              <p className="mb-4 text-xs text-muted">Enter the 4-digit code only after you have the goods.</p>
              <OtpReleasePad onSubmit={release} busy={busy} />
            </div>
          )}
          <div className="card p-5">
            <p className="mb-4 text-sm font-medium">Ledger</p>
            <LedgerTimeline events={deal.events} />
          </div>
        </div>
      </div>

      {pay && <PaystackModal deal={deal} onClose={() => setPay(false)} onPaid={() => { setPay(false); load(); }} />}
    </div>
  );
}