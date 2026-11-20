import { useEffect, useMemo, useState } from "react";
import { KeyRound, ShoppingBag, Wallet } from "lucide-react";
import { dealApi } from "../../../api/dealApi";
import MetricCard from "../../../components/escrow/MetricCard";
import DealTable from "../../../components/escrow/DealTable";
import DealInspector from "../../../components/escrow/DealInspector";
import { formatNaira } from "../../../utils/formatNaira";
import type { Deal } from "../../../types/deal.types";

export default function BuyerDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [sel, setSel] = useState<Deal | null>(null);

  useEffect(() => { dealApi.list("buyer").then((d) => { setDeals(d); setSel(d[0] ?? null); }); }, []);

  const m = useMemo(() => ({
    held: deals.filter((d) => ["escrow_locked", "in_transit"].includes(d.status)).reduce((s, d) => s + Number(d.amount), 0),
    otps: deals.filter((d) => d.status === "in_transit" && d.release_otp),
  }), [deals]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-xl font-semibold">My purchases</h1>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Held in escrow" value={formatNaira(m.held)} icon={<Wallet size={16} />} />
        <MetricCard label="Purchases" value={deals.length} icon={<ShoppingBag size={16} />} />
        <MetricCard label="Active OTPs" value={m.otps.length} icon={<KeyRound size={16} />} />
      </div>

      {m.otps.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {m.otps.map((d) => (
            <div key={d.code} className="card flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.title}</p>
                <p className="text-xs text-muted">Share only on delivery</p>
              </div>
              <span className="font-mono-tabular rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-lg tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                {d.release_otp}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <DealTable deals={deals} selected={sel?.code} onSelect={setSel} />
        <DealInspector deal={sel} />
      </div>
    </div>
  );
}