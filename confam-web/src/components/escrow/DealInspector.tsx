import { useState } from "react";
import { AlertTriangle, ExternalLink, MapPin, ShieldCheck, Video } from "lucide-react";
import { Link } from "react-router-dom";
import StatusPill from "./StatusPill";
import LedgerTimeline from "./LedgerTimeline";
import DriverLocationStatus from "./DriverLocationStatus";
import { formatNaira } from "../../utils/formatNaira";
import { dealApi } from "../../api/dealApi";
import { errMsg } from "../../api/client";
import { useToast } from "../../context/useToast";
import type { Deal } from "../../types/deal.types";

export default function DealInspector({
  deal,
  canFlagNonResponse,
  onUpdated,
}: {
  deal?: Deal | null;
  canFlagNonResponse?: boolean;
  onUpdated?: (d: Deal) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toast = useToast();

  if (!deal) {
    return (
      <div className="card grid min-h-[260px] place-items-center p-6 text-sm text-muted">
        Select a deal to inspect.
      </div>
    );
  }

  const grossPayout = deal.amount + (deal.waybill_fee ?? 0);
  const vendorPayout = deal.platform_fee_payer === "vendor"
    ? grossPayout - (deal.platform_fee ?? 0)
    : grossPayout;
  const feeRate = grossPayout > 0 ? Math.round(((deal.platform_fee ?? 0) / grossPayout) * 10000) / 100 : 0;

  const flagNonResponse = async () => {
    if (!window.confirm("Request an admin review because the buyer has not confirmed delivery? Funds will stay frozen during review.")) return;
    setBusy(true);
    setErr("");
    try {
      onUpdated?.(await dealApi.dispute(deal.code, "Buyer has not confirmed receipt and condition after dispatch."));
      toast.success("Dispute submitted", "Escrow remains frozen while an admin reviews the case.");
    } catch (e) {
      const message = errMsg(e, "Could not request an admin review.");
      setErr(message);
      toast.error("Could not submit dispute", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="neo-card space-y-5 rounded-2xl p-4 lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{deal.title}</p>
          <p className="font-mono-tabular text-xs text-muted">{deal.code}</p>
        </div>
        <StatusPill status={deal.status} />
      </div>

      <div>
        <p className="font-mono-tabular text-2xl font-semibold">
          {formatNaira(deal.total_payable ?? deal.amount + (deal.waybill_fee ?? 0))}
        </p>
        <div className="mt-2 space-y-1 text-xs text-muted">
          <p>Item: {formatNaira(deal.amount)}</p>
          {!!deal.waybill_fee && <p>Delivery: {formatNaira(deal.waybill_fee)}</p>}
          {!!deal.platform_fee && (
            <>
              <p>
                {feeRate}% platform fee: {formatNaira(deal.platform_fee)}
                {deal.platform_fee_payer === "vendor" ? " · withheld from vendor payout" : " · included in buyer total"}
              </p>
              <p className="font-medium text-ink">
                Estimated vendor payout: {formatNaira(vendorPayout)}
              </p>
            </>
          )}
        </div>
      </div>

      <div>
        <p className="label flex items-center gap-1.5"><Video size={12} /> Proof of Pack</p>
        {deal.proof_video_url ? (
          <video src={deal.proof_video_url ?? undefined} controls playsInline className="aspect-video w-full rounded-lg border border-line bg-black" />
        ) : (
          <div className="grid aspect-video place-items-center rounded-lg border border-dashed border-line text-xs text-muted">
            No proof uploaded
          </div>
        )}
        {deal.ai_match != null && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={12} />
            <span className="font-mono-tabular">{deal.ai_match}%</span> AI Match
            {deal.sha256 && " • SHA-256 Verified"}
          </p>
        )}
        {deal.sha256 && (
          <p className="font-mono-tabular mt-1 truncate text-[10px] text-muted">{deal.sha256}</p>
        )}
      </div>

      {deal.waybill && (
        <div>
          <p className="label flex items-center gap-1.5"><MapPin size={12} /> Waybill route</p>
          <p className="text-sm">{deal.waybill.route}</p>
          <p className="text-xs text-muted">
            {[deal.waybill.park, deal.waybill.plate, deal.waybill.driver_name].filter(Boolean).join(" • ")}
          </p>
          <DriverLocationStatus waybill={deal.waybill} />
        </div>
      )}

      <div>
        <p className="label">Ledger</p>
        <LedgerTimeline events={deal.events} />
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        {canFlagNonResponse && deal.status === "in_transit" && (
          <button onClick={flagNonResponse} disabled={busy} className="btn-ghost flex-1">
            <AlertTriangle size={14} />
            {busy ? "Requesting review…" : "Flag buyer non-response"}
          </button>
        )}
        <Link to={`/deal/${deal.code}`} className="btn-ghost flex-1">
          Open room <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}