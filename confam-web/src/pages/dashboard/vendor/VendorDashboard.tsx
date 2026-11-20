import { useEffect, useMemo, useState } from "react";
import { KeyRound, Plus, Truck, Wallet } from "lucide-react";
import { dealApi } from "../../../api/dealApi";
import MetricCard from "../../../components/escrow/MetricCard";
import DealTable from "../../../components/escrow/DealTable";
import DealInspector from "../../../components/escrow/DealInspector";
import CreateDealModal from "./CreateDealModal";
import { formatNaira } from "../../../utils/formatNaira";
import type { Deal } from "../../../types/deal.types";

export default function VendorDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [sel, setSel] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    dealApi
      .list()
      .then((d) => {
        setDeals(d);
        setSel(d[0] ?? null);
      })
      .catch(() => {
        setDeals([]);
        setSel(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const m = useMemo(() => ({
    escrow: deals.filter((d) => d.status === "escrow_locked" || d.status === "in_transit").reduce((s, d) => s + Number(d.amount), 0),
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

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Escrow balance" value={formatNaira(m.escrow)} icon={<Wallet size={16} />} />
        <MetricCard label="Active waybills" value={m.manifests} icon={<Truck size={16} />} />
        <MetricCard label="Pending release OTPs" value={m.otps} icon={<KeyRound size={16} />} />
      </div>

      {loading ? (
        <div className="card p-10 text-center text-sm text-muted">Loading…</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <DealTable deals={deals} selected={sel?.code} onSelect={setSel} />
          <DealInspector deal={sel} canPayout onUpdated={update} />
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