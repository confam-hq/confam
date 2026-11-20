import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, PackageCheck, ShoppingBag, Wallet } from "lucide-react";
import { dealApi } from "../../../api/dealApi";
import { errMsg } from "../../../api/client";
import MetricCard from "../../../components/escrow/MetricCard";
import DealTable from "../../../components/escrow/DealTable";
import DealInspector from "../../../components/escrow/DealInspector";
import LoadingScreen from "../../../components/feedback/LoadingScreen";
import { formatNaira } from "../../../utils/formatNaira";
import type { Deal } from "../../../types/deal.types";

export default function BuyerDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [sel, setSel] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    dealApi.list("buyer")
      .then((items) => {
        if (!active) return;
        setDeals(items);
        setSel((current) => items.find((item) => item.code === current?.code) ?? items[0] ?? null);
      })
      .catch((error) => {
        if (active) setLoadError(errMsg(error, "Could not load your purchases."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reloadKey]);

  const metrics = useMemo(() => ({
    held: deals
      .filter((deal) => ["escrow_locked", "in_transit", "disputed"].includes(deal.status))
      .reduce((sum, deal) => sum + Number(deal.total_payable ?? deal.amount), 0),
    awaitingConfirmation: deals.filter((deal) => deal.status === "in_transit").length,
  }), [deals]);

  const updateDeal = (updated: Deal) => {
    setDeals((previous) => previous.map((deal) => deal.code === updated.code ? updated : deal));
    setSel(updated);
    setShowDispute(false);
  };

  const confirmDelivery = async () => {
    if (!sel || sel.status !== "in_transit") return;
    if (!window.confirm("Confirm that you received the goods and waybill in good condition? This releases the vendor's payout.")) return;
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      updateDeal(await dealApi.confirmDelivery(sel.code));
      setMessage("Delivery confirmed. The vendor payout has been released.");
    } catch (error) {
      setActionError(errMsg(error, "Could not confirm delivery."));
    } finally {
      setBusy(false);
    }
  };

  const openDispute = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sel || reason.trim().length < 10) return;
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      updateDeal(await dealApi.dispute(sel.code, reason.trim()));
      setReason("");
      setMessage("Your dispute is open. The escrow will remain frozen while Confam reviews it.");
    } catch (error) {
      setActionError(errMsg(error, "Could not open the dispute."));
    } finally {
      setBusy(false);
    }
  };

  const retryLoad = () => {
    setLoading(true);
    setLoadError("");
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Buyer workspace</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Your purchases</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Protected in escrow" value={formatNaira(metrics.held)} icon={<Wallet size={16} />} />
        <MetricCard label="Purchases" value={deals.length} icon={<ShoppingBag size={16} />} />
        <MetricCard label="Ready for your confirmation" value={metrics.awaitingConfirmation} icon={<PackageCheck size={16} />} />
      </div>

      {sel?.status === "in_transit" && (
        <section className="neo-card rounded-3xl p-5 sm:p-7" aria-labelledby="delivery-confirmation-title">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Your action protects both sides</p>
              <h2 id="delivery-confirmation-title" className="mt-2 text-xl font-semibold sm:text-2xl">
                Did {sel.title} arrive in good condition?
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Check the goods and waybill before confirming. Confirmation releases the vendor payout. If anything is wrong, open a dispute instead; funds stay frozen until admin review.
              </p>
            </div>
            <div className="grid gap-3 sm:min-w-72">
              <button
                onClick={confirmDelivery}
                disabled={busy}
                className="btn-primary min-h-16 w-full rounded-2xl px-6 text-base sm:text-lg"
              >
                <CheckCircle2 size={20} />
                {busy ? "Updating deal…" : "Confirm good delivery"}
              </button>
              <button
                onClick={() => { setShowDispute((open) => !open); setActionError(""); }}
                disabled={busy}
                className="btn-ghost min-h-12 w-full rounded-2xl"
              >
                <AlertTriangle size={17} /> Report a problem
              </button>
            </div>
          </div>

          {showDispute && (
            <form onSubmit={openDispute} className="mt-5 max-w-2xl border-t border-line pt-5">
              <label htmlFor="buyer-dispute-reason" className="label">What went wrong?</label>
              <textarea
                id="buyer-dispute-reason"
                required
                minLength={10}
                maxLength={1000}
                rows={3}
                className="input resize-y"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Describe the issue with the item, condition, or waybill."
              />
              <button disabled={busy || reason.trim().length < 10} className="btn-primary mt-3 min-h-12">
                {busy ? "Opening dispute…" : "Freeze escrow and request review"}
              </button>
            </form>
          )}
        </section>
      )}

      {sel?.status === "disputed" && (
        <div className="neo-card rounded-2xl p-5" role="status">
          <p className="font-semibold">This deal is under review</p>
          <p className="mt-1 text-sm text-muted">Escrow remains frozen while an admin reviews the evidence and decides whether to release or refund.</p>
        </div>
      )}
      {message && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
      {actionError && <p role="alert" className="text-sm text-red-500">{actionError}</p>}

      {loading ? (
        <LoadingScreen compact label="Loading your purchases" />
      ) : loadError ? (
        <div className="neo-card rounded-2xl p-6 text-center" role="alert">
          <p className="font-medium">Purchases could not be loaded.</p>
          <p className="mt-2 text-sm text-muted">{loadError}</p>
          <button onClick={retryLoad} className="btn-ghost mt-4">Try again</button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <DealTable deals={deals} selected={sel?.code} onSelect={setSel} />
          <DealInspector deal={sel} />
        </div>
      )}
    </div>
  );
}
