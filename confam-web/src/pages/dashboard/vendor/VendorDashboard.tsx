import { useEffect, useMemo, useState } from "react";
import { KeyRound, Plus, Truck, Wallet } from "lucide-react";
import { dealApi } from "../../../api/dealApi";
import { errMsg } from "../../../api/client";
import MetricCard from "../../../components/escrow/MetricCard";
import DealTable from "../../../components/escrow/DealTable";
import DealInspector from "../../../components/escrow/DealInspector";
import LoadingScreen from "../../../components/feedback/LoadingScreen";
import CreateDealModal from "./CreateDealModal";
import { formatNaira } from "../../../utils/formatNaira";
import type { Deal } from "../../../types/deal.types";

export default function VendorDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [sel, setSel] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    dealApi
      .list()
      .then((d) => {
        if (!active) return;
        setDeals(d);
        setSel(d[0] ?? null);
      }).catch((e) => {
        if (!active) return;
        setDeals([]);
        setSel(null);
        setLoadError(errMsg(e, "Could not load your deals."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reloadKey]);

  const retryLoadDeals = () => {
    setLoading(true);
    setLoadError("");
    setReloadKey((key) => key + 1);
  };

  const m = useMemo(() => ({
    escrow: deals.filter((d) => d.status === "escrow_locked" || d.status === "in_transit").reduce((s, d) => s + Number(d.total_payable ?? d.amount + (d.waybill_fee ?? 0)), 0),
    netPayout: deals
      .filter((d) => d.status === "escrow_locked" || d.status === "in_transit")
      .reduce((s, d) => s + Number(d.amount) + Number(d.waybill_fee ?? 0) - (d.platform_fee_payer === "vendor" ? Number(d.platform_fee ?? 0) : 0), 0),
    manifests: deals.filter((d) => d.waybill && d.status !== "settled").length,
    otps: deals.filter((d) => d.status === "in_transit").length,
  }), [deals]);

  const update = (d: Deal) => {
    setDeals((p) => p.map((x) => (x.code === d.code ? d : x)));
    setSel(d);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus size={14} /> New deal</button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Escrow balance" value={formatNaira(m.escrow)} icon={<Wallet size={16} />} />
        <MetricCard label="Estimated net payout" value={formatNaira(m.netPayout)} icon={<Wallet size={16} />} />
        <MetricCard label="Active waybills" value={m.manifests} icon={<Truck size={16} />} />
        <MetricCard label="Awaiting buyer confirmation" value={m.otps} icon={<KeyRound size={16} />} />
      </div>

      <div className="neo-card mb-6 flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Clear fee, predictable payout</p>
          <p className="text-xs text-muted">For new deals, Confam withholds 5% of item + delivery proceeds from your payout after successful delivery. Buyers pay no extra platform fee.</p>
        </div>
        <span className="font-mono-tabular text-lg font-bold text-brand">5%</span>
      </div>

      {loading ? (
        <LoadingScreen compact label="Loading your deals" />
      ) : loadError ? (
        <div role="alert" className="card p-6 text-center">
          <p className="text-sm font-medium">Your deals could not be loaded.</p>
          <p className="mt-2 text-sm text-muted">{loadError}</p>
          <button onClick={retryLoadDeals} className="btn-ghost mt-4">Try again</button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <DealTable deals={deals} selected={sel?.code} onSelect={setSel} />
          <DealInspector deal={sel} canFlagNonResponse onUpdated={update} />
        </div>
      )}

      {modal && (
        <CreateDealModal
          onClose={() => setModal(false)}
          onCreated={(d) => { setDeals((p) => [d, ...p]); setSel(d); }}
        />
      )}
    </div>
  );
}