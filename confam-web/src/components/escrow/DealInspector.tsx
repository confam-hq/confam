import { useState } from "react";
import { ExternalLink, MapPin, ShieldCheck, Video } from "lucide-react";
import { Link } from "react-router-dom";
import StatusPill from "./StatusPill";
import LedgerTimeline from "./LedgerTimeline";
import { formatNaira } from "../../utils/formatNaira";
import { dealApi } from "../../api/dealApi";
import type { Deal } from "../../types/deal.types";

export default function DealInspector({
  deal,
  canPayout,
  onUpdated,
}: {
  deal?: Deal | null;
  canPayout?: boolean;
  onUpdated?: (d: Deal) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!deal)
    return (
      <div className="card grid min-h-[260px] place-items-center p-6 text-sm text-muted">
        Select a deal to inspect.
      </div>
    );

  const payout = async () => {
    setBusy(true);
    setErr("");
    try {
      onUpdated?.(await dealApi.payout(deal.code));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-5 p-4 lg:sticky lg:top-24">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{deal.title}</p>
          <p className="font-mono-tabular text-xs text-muted">{deal.code}</p>
        </div>
        <StatusPill status={deal.status} />
      </div>

      <p className="font-mono-tabular text-2xl font-semibold">{formatNaira(deal.amount)}</p>

      <div>
        <p className="label flex items-center gap-1.5"><Video size={12} /> Proof of Pack</p>
        {deal.proof_video_url ? (
          <video src={deal.proof_video_url} controls playsInline className="aspect-video w-full rounded-lg border border-line bg-black" />
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
        </div>
      )}

      <div>
        <p className="label">Ledger</p>
        <LedgerTimeline events={deal.events} />
      </div>

      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        {canPayout && deal.status === "in_transit" && (
          <button onClick={payout} disabled={busy} className="btn-primary flex-1">
            {busy ? "Processing…" : "1-click payout"}
          </button>
        )}
        <Link to={`/deal/${deal.code}`} className="btn-ghost flex-1">
          Open room <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}