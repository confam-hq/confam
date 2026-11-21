import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { dealApi } from "../../../api/dealApi";
import { errMsg } from "../../../api/client";
import { useToast } from "../../../context/useToast";
import LoadingScreen from "../../../components/feedback/LoadingScreen";
import StatusPill from "../../../components/escrow/StatusPill";
import { formatNaira } from "../../../utils/formatNaira";
import type { Deal } from "../../../types/deal.types";

const canDispute = (deal: Deal) => deal.status === "escrow_locked" || deal.status === "in_transit";

export default function VendorDisputesPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const toast = useToast();

  useEffect(() => {
    let active = true;
    dealApi.list("vendor")
      .then((result) => {
        if (!active) return;
        setDeals(result);
        setSelectedCode(result.find(canDispute)?.code ?? "");
      })
      .catch((cause) => { if (active) setError(errMsg(cause, "Could not load your deals.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const eligibleDeals = useMemo(() => deals.filter(canDispute), [deals]);
  const selectedDeal = eligibleDeals.find((deal) => deal.code === selectedCode);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDeal || reason.trim().length < 10) return;
    if (!window.confirm(`Submit a dispute for ${selectedDeal.code}? Funds will remain frozen while an admin reviews the case.`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await dealApi.dispute(selectedDeal.code, reason.trim());
      setDeals((previous) => previous.map((deal) => deal.code === updated.code ? updated : deal));
      setSelectedCode(eligibleDeals.find((deal) => deal.code !== updated.code)?.code ?? "");
      setReason("");
      setNotice(`Dispute submitted for ${updated.code}. Funds remain frozen while the case is reviewed.`);
      toast.success("Dispute submitted", `Funds for ${updated.code} remain frozen during review.`);
    } catch (cause) {
      const message = errMsg(cause, "Could not submit the dispute.");
      setError(message);
      toast.error("Could not submit dispute", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-2">
      <div className="mb-6">
        <p className="label">Vendor workspace</p>
        <h1 className="text-xl font-semibold">Submit a dispute</h1>
        <p className="mt-1 text-sm text-muted">Ask an admin to review a funded deal when delivery or buyer confirmation is in question.</p>
      </div>

      <div className="neo-card mb-5 flex gap-3 rounded-2xl p-4">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-brand" />
        <div className="text-sm">
          <p className="font-semibold">Escrow stays protected during review</p>
          <p className="mt-1 text-xs leading-5 text-muted">Submitting a dispute freezes the deal’s funds. An admin reviews the details and evidence before deciding whether to release or refund them.</p>
        </div>
      </div>

      {loading ? (
        <LoadingScreen compact label="Loading eligible deals" />
      ) : error && !eligibleDeals.length ? (
        <div role="alert" className="card p-6 text-center">
          <p className="text-sm font-medium">Your deals could not be loaded.</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              setReloadKey((key) => key + 1);
            }}
            className="btn-ghost mt-4"
          >
            Try again
          </button>
        </div>
      ) : eligibleDeals.length ? (
        <form onSubmit={submit} className="neo-card space-y-5 rounded-2xl p-5 sm:p-6">
          <div>
            <label htmlFor="dispute-deal" className="label">Deal</label>
            <select
              id="dispute-deal"
              className="input"
              value={selectedCode}
              onChange={(event) => setSelectedCode(event.target.value)}
            >
              {eligibleDeals.map((deal) => (
                <option key={deal.code} value={deal.code}>{deal.code} · {deal.title}</option>
              ))}
            </select>
          </div>

          {selectedDeal && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-4">
              <div>
                <p className="font-medium">{selectedDeal.title}</p>
                <p className="mt-1 font-mono-tabular text-xs text-muted">{selectedDeal.code} · {formatNaira(selectedDeal.total_payable ?? selectedDeal.amount + (selectedDeal.waybill_fee ?? 0))}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={selectedDeal.status} />
                <Link to={`/deal/${selectedDeal.code}`} aria-label={`Open ${selectedDeal.code}`} className="btn-ghost min-h-10 px-3">
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="dispute-reason" className="label">What needs review?</label>
            <textarea
              id="dispute-reason"
              required
              minLength={10}
              maxLength={1000}
              rows={5}
              className="input resize-y"
              placeholder="Explain what happened, when it happened, and what evidence the admin should review."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="mt-1 text-right text-xs text-muted">{reason.length}/1000</p>
          </div>

          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
          <button disabled={busy || !selectedDeal || reason.trim().length < 10} className="btn-primary min-h-14 w-full text-base">
            <AlertTriangle size={17} /> {busy ? "Submitting dispute…" : "Submit dispute"}
          </button>
        </form>
      ) : (
        <div className="card p-6 text-center">
          {notice && <p role="status" className="mb-4 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
          <p className="font-medium">No eligible deals right now</p>
          <p className="mt-2 text-sm text-muted">Disputes can be submitted for funded or in-transit deals that have not already been settled or disputed.</p>
          <Link to="/dashboard/vendor" className="btn-primary mt-5 min-h-12">Back to overview</Link>
        </div>
      )}
    </div>
  );
}
