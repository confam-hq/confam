import { useEffect, useState } from "react";
import { Banknote, Gavel, Percent } from "lucide-react";
import { adminApi } from "../../../api/dealApi";
import { errMsg } from "../../../api/client";
import MetricCard from "../../../components/escrow/MetricCard";
import DealTable from "../../../components/escrow/DealTable";
import DealInspector from "../../../components/escrow/DealInspector";
import { formatNaira } from "../../../utils/formatNaira";
import type { Deal } from "../../../types/deal.types";

export default function AdminDashboard() {
  const [disputes, setDisputes] = useState<Deal[]>([]);
  const [sel, setSel] = useState<Deal | null>(null);
  const [rev, setRev] = useState({ total: 0, fees: 0, settled: 0 });
  const [busy, setBusy] = useState(false);

  const load = () =>
    adminApi.disputes().then((d) => { setDisputes(d); setSel((s) => d.find((x) => x.code === s?.code) ?? d[0] ?? null); });

  useEffect(() => { load(); adminApi.revenue().then(setRev).catch(() => {}); }, []);

  const resolve = async (outcome: "release" | "refund") => {
    if (!sel) return;
    setBusy(true);
    try { await adminApi.resolve(sel.code, outcome); await load(); }
    catch (e) { alert(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-xl font-semibold">Arbitration & revenue</h1>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Open disputes" value={disputes.length} icon={<Gavel size={16} />} />
        <MetricCard label="Volume settled" value={formatNaira(rev.settled)} icon={<Banknote size={16} />} />
        <MetricCard label="Fee revenue" value={formatNaira(rev.fees)} icon={<Percent size={16} />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <DealTable deals={disputes} selected={sel?.code} onSelect={setSel} />
        <div className="space-y-3">
          <DealInspector deal={sel} />
          {sel && (
            <div className="card grid grid-cols-2 gap-2 p-4">
              <button disabled={busy} onClick={() => resolve("release")} className="btn-primary">Release to vendor</button>
              <button disabled={busy} onClick={() => resolve("refund")} className="btn-ghost">Refund buyer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}