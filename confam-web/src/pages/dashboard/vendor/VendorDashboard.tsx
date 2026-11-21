import { useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Plus, RefreshCw, Truck, Wallet } from "lucide-react";
import { dealApi } from "../../../api/dealApi";
import { errMsg } from "../../../api/client";
import MetricCard from "../../../components/escrow/MetricCard";
import DealTable from "../../../components/escrow/DealTable";
import DealInspector from "../../../components/escrow/DealInspector";
import LoadingScreen from "../../../components/feedback/LoadingScreen";
import CreateDealModal from "./CreateDealModal";
import { formatNaira } from "../../../utils/formatNaira";
import { useToast } from "../../../context/useToast";
import type { Deal } from "../../../types/deal.types";

export default function VendorDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [sel, setSel] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const manualRefresh = useRef(false);
  const pingSignatures = useRef(new Map<string, string | null>());
  const toast = useToast();

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    const refresh = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const latest = await dealApi.list("vendor");
        if (!active) return;
        latest.forEach((deal) => {
          const ping = deal.waybill?.last_ping;
          const signature = ping ? `${ping.at}:${ping.lat}:${ping.lng}` : null;
          const previous = pingSignatures.current.get(deal.code);
          if (hasLoaded.current && previous !== undefined && ping && signature !== previous) {
            toast.info("Driver location received", `${deal.title} · ${ping.lat.toFixed(5)}, ${ping.lng.toFixed(5)}`);
          }
          pingSignatures.current.set(deal.code, signature);
        });
        hasLoaded.current = true;
        setDeals(latest);
        setSel((current) => current
          ? latest.find((deal) => deal.code === current.code) ?? latest[0] ?? null
          : latest[0] ?? null);
        setLoadError("");
      } catch (error) {
        if (active) {
          const message = errMsg(error, "Could not load your deals.");
          if (!hasLoaded.current) setLoadError(message);
          if (manualRefresh.current) toast.error("Could not refresh deals", message);
        }
      } finally {
        requestInFlight = false;
        if (active) {
          manualRefresh.current = false;
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [reloadKey, toast]);

  const retryLoadDeals = () => {
    setLoading(true);
    setLoadError("");
    setRefreshing(true);
    manualRefresh.current = true;
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
        <div className="flex gap-2">
          <button onClick={retryLoadDeals} disabled={refreshing} className="btn-ghost min-h-11 px-3" aria-label="Refresh deals">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
          <button onClick={() => setModal(true)} className="btn-primary"><Plus size={14} /> New deal</button>
        </div>
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