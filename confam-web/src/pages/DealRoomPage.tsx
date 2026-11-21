import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { isAxiosError } from "axios";
import { dealApi } from "../api/dealApi";
import { errMsg } from "../api/client";
import { useAuth } from "../context/AuthContext";
import StatusPill from "../components/escrow/StatusPill";
import LedgerTimeline from "../components/escrow/LedgerTimeline";
import LiveProofRecorder from "../components/camera/LiveProofRecorder";
import WaybillScannerCard from "../components/waybill/WaybillScannerCard";
import PaystackModal from "../components/payment/PaystackModal";
import LoadingScreen from "../components/feedback/LoadingScreen";
import DriverLocationStatus from "../components/escrow/DriverLocationStatus";
import StatusPage from "./StatusPage";
import { formatNaira } from "../utils/formatNaira";
import { useToast } from "../context/useToast";
import type { Deal } from "../types/deal.types";

export default function DealRoomPage() {
  const { code = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isVendor = user?.role === "vendor";
  const toast = useToast();
  const verifiedPaymentReference = useRef<string | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const ping = deal?.waybill?.last_ping;
  const pingSignature = ping ? `${ping.at}:${ping.lat}:${ping.lng}` : null;
  const [err, setErr] = useState("");
  const [loadErrorCode, setLoadErrorCode] = useState<"404" | "500">("500");
  const [pay, setPay] = useState(false);
  const [blob, setBlob] = useState<{ b: Blob; hash: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const load = useCallback(
    () => dealApi.get(code)
      .then((loadedDeal) => {
        setDeal(loadedDeal);
        setErr("");
      })
      .catch((e) => {
        setLoadErrorCode(isAxiosError(e) && e.response?.status === 404 ? "404" : "500");
        setErr(errMsg(e, "Could not load this deal."));
      }),
    [code]
  );
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isVendor || deal?.status !== "in_transit") return;
    let active = true;
    let lastPing = pingSignature;
    let pollErrorShown = false;
    const interval = window.setInterval(async () => {
      try {
        const latest = await dealApi.get(code);
        if (!active) return;
        const ping = latest.waybill?.last_ping;
        const nextPing = ping ? `${ping.at}:${ping.lat}:${ping.lng}` : null;
        if (ping && nextPing && nextPing !== lastPing) {
          toast.info(
            "Driver location received",
            `${latest.title} · ${ping.lat.toFixed(5)}, ${ping.lng.toFixed(5)}`,
          );
        }
        lastPing = nextPing;
        setDeal(latest);
        pollErrorShown = false;
      } catch (error) {
        if (active && !pollErrorShown) {
          toast.error("Could not refresh driver location", errMsg(error, "Check your connection and try again."));
          pollErrorShown = true;
        }
      }
    }, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [code, deal?.status, isVendor, pingSignature, toast]);

  useEffect(() => {
    const reference = new URLSearchParams(location.search).get("reference");
    if (!reference || verifiedPaymentReference.current === reference) return;

    verifiedPaymentReference.current = reference;
    dealApi.verifyPayment(code, reference)
      .then(() => {
        toast.success("Payment confirmed", "Escrow has been funded successfully.");
        const query = new URLSearchParams(location.search);
        query.delete("reference");
        query.delete("trxref");
        query.delete("mock_paid");
        const search = query.toString();
        navigate(
          { pathname: location.pathname, search: search ? `?${search}` : "" },
          { replace: true }
        );
        return load();
      })
      .catch((e) => {
        verifiedPaymentReference.current = null;
        setErr(errMsg(e, "Could not verify payment"));
      });
  }, [code, load, location.pathname, location.search, navigate, toast]);

  if (err && !deal) return <StatusPage code={loadErrorCode} detail={err} />;
  if (!deal) return <LoadingScreen label="Opening your protected deal" />;

  const isBuyer = user?.role === "buyer"
    && user.email.toLowerCase() === deal.buyer_email?.toLowerCase();
  const buyerTotal = deal.total_payable ?? deal.amount + (deal.waybill_fee ?? 0);
  const upload = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      setDeal(await dealApi.uploadProof(deal.code, blob.b, blob.hash, setProgress));
      setBlob(null);
      toast.success("Proof uploaded", "Your packing video was saved and verified.");
    } catch (e) {
      const message = errMsg(e);
      setErr(message);
      toast.error("Proof upload failed", message);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelivery = async () => {
    if (!window.confirm("Confirm that the goods and waybill arrived in good condition? This releases the vendor payout.")) return;
    setBusy(true);
    setErr("");
    try {
      setDeal(await dealApi.confirmDelivery(deal.code));
      toast.success("Delivery confirmed", "The vendor payout has been released.");
    }
    catch (e) {
      const message = errMsg(e, "Could not confirm delivery");
      setErr(message);
      toast.error("Could not confirm delivery", message);
    }
    finally { setBusy(false); }
  };

  const openDispute = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErr("");
    try {
      setDeal(await dealApi.dispute(deal.code, disputeReason.trim()));
      setShowDispute(false);
      setDisputeReason("");
      setActionMessage("Dispute opened. Escrow remains frozen pending admin review.");
      toast.success("Dispute opened", "Escrow remains frozen pending admin review.");
    } catch (e) {
      const message = errMsg(e, "Could not open a dispute");
      setErr(message);
      toast.error("Could not open dispute", message);
    } finally {
      setBusy(false);
    }
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
          <div className="neo-card rounded-2xl p-5">
            <p className="label">Buyer total</p>
            <p className="font-mono-tabular text-3xl font-semibold">{formatNaira(buyerTotal)}</p>
            <p className="mt-2 text-xs text-muted">
              Includes item and delivery. The 5% platform fee is withheld from vendor proceeds, not added to your total.
            </p>
            {deal.description && <p className="mt-3 text-sm text-muted">{deal.description}</p>}
            {deal.status === "pending" && !isVendor && (
              <button onClick={() => setPay(true)} className="btn-primary mt-5 w-full sm:w-auto">
                <Lock size={14} /> Pay into escrow
              </button>
            )}
          </div>

          {isBuyer && deal.status === "in_transit" && (
            <section className="neo-card space-y-4 rounded-2xl p-5" aria-labelledby="confirm-delivery-title">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Delivery check</p>
                <h2 id="confirm-delivery-title" className="mt-1 text-lg font-semibold">Have you received everything in good condition?</h2>
                <p className="mt-2 text-sm text-muted">Check the item and waybill. Confirming releases the payout; report any issue to keep escrow frozen for review.</p>
              </div>
              <button onClick={confirmDelivery} disabled={busy} className="btn-primary min-h-14 w-full rounded-2xl text-base">
                <CheckCircle2 size={18} /> {busy ? "Updating deal…" : "Confirm good delivery"}
              </button>
              <button onClick={() => setShowDispute((open) => !open)} disabled={busy} className="btn-ghost min-h-12 w-full rounded-2xl">
                <AlertTriangle size={16} /> Report a problem
              </button>
              {showDispute && (
                <form onSubmit={openDispute} className="space-y-3 border-t border-line pt-4">
                  <label htmlFor="deal-dispute-reason" className="label">Describe the issue</label>
                  <textarea
                    id="deal-dispute-reason"
                    required
                    minLength={10}
                    maxLength={1000}
                    rows={3}
                    className="input resize-y"
                    value={disputeReason}
                    onChange={(event) => setDisputeReason(event.target.value)}
                    placeholder="Tell us what is wrong with the item or waybill."
                  />
                  <button disabled={busy || disputeReason.trim().length < 10} className="btn-primary min-h-12 w-full">
                    {busy ? "Opening dispute…" : "Freeze escrow and request review"}
                  </button>
                </form>
              )}
            </section>
          )}

          {!user && deal.status === "in_transit" && (
            <div className="neo-card rounded-2xl p-5">
              <h2 className="font-semibold">Confirm delivery from your buyer account</h2>
              <p className="mt-2 text-sm text-muted">Sign in with the email used for this purchase to confirm delivery or open a dispute.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link to="/login" state={{ from: location.pathname }} className="btn-primary min-h-12">Log in</Link>
                <Link to="/register" className="btn-ghost min-h-12">Create buyer account</Link>
              </div>
            </div>
          )}

          {deal.status === "disputed" && (
            <div className="neo-card rounded-2xl p-5">
              <p className="font-semibold">Dispute under review</p>
              <p className="mt-1 text-sm text-muted">Escrow stays frozen until an admin reviews the evidence and resolves the case.</p>
            </div>
          )}
          {actionMessage && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{actionMessage}</p>}
          {err && <p role="alert" className="text-sm text-red-500">{err}</p>}

          {isVendor && deal.status === "escrow_locked" && (
            <div className="neo-card space-y-3 rounded-2xl p-5">
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

          {isVendor && deal.status === "escrow_locked" && (
            deal.proof_video_url
              ? <WaybillScannerCard code={deal.code} onDone={setDeal} />
              : <p className="text-xs text-muted">Upload and verify proof-of-pack before scanning the waybill and dispatching.</p>
          )}

          {deal.proof_video_url && (
            <div className="neo-card rounded-2xl p-5">
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
              <DriverLocationStatus waybill={deal.waybill} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="neo-card rounded-2xl p-5">
            <p className="mb-4 text-sm font-medium">Ledger</p>
            <LedgerTimeline events={deal.events} />
          </div>
        </div>
      </div>

      {pay && <PaystackModal deal={deal} onClose={() => setPay(false)} />}
    </div>
  );
}