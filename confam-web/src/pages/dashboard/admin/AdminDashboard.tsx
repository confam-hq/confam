import { useEffect, useState } from "react";
import { Banknote, Gavel, Percent } from "lucide-react";
import { adminApi } from "../../../api/dealApi";
import { errMsg } from "../../../api/client";
import MetricCard from "../../../components/escrow/MetricCard";
import DealTable from "../../../components/escrow/DealTable";
import DealInspector from "../../../components/escrow/DealInspector";
import LoadingScreen from "../../../components/feedback/LoadingScreen";
import { formatNaira } from "../../../utils/formatNaira";
import { useToast } from "../../../context/useToast";
import DatabaseResetPanel from "../../../components/admin/DatabaseResetPanel";
import type { Deal } from "../../../types/deal.types";

export default function AdminDashboard() {
  const [disputes, setDisputes] = useState<Deal[]>([]);
  const [sel, setSel] = useState<Deal | null>(null);
  const [rev, setRev] = useState({ total: 0, fees: 0, settled: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toast = useToast();

  const load = () =>
    adminApi.disputes().then((d) => { setDisputes(d); setSel((s) => d.find((x) => x.code === s?.code) ?? d[0] ?? null); });

  useEffect(() => {
    load()
      .catch((error) => setErr(errMsg(error, "Could not load disputes.")))
      .finally(() => setLoading(false));
    adminApi.revenue().then(setRev).catch((error) => setErr(errMsg(error, "Could not load revenue.")));
  }, []);

  const resolve = async (outcome: "release" | "refund") => {
    if (!sel) return;
    const action = outcome === "refund" ? "refund the buyer" : "release funds to the vendor";
    if (!window.confirm(`Resolve ${sel.code} and ${action}? This action cannot be undone.`)) return;
    setBusy(true);
    setErr("");
    try {
      await adminApi.resolve(sel.code, outcome);
      await load();
      toast.success("Dispute resolved", `Funds were ${outcome === "refund" ? "refunded to the buyer" : "released to the vendor"}.`);
    }
    catch (e) {
      const message = errMsg(e, "Could not resolve this dispute.");
      setErr(message);
      toast.error("Could not resolve dispute", message);
    }
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

      {err && <p role="alert" className="mb-4 text-sm text-red-500">{err}</p>}

      {loading ? (
        <LoadingScreen compact label="Loading the dispute queue" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <DealTable deals={disputes} selected={sel?.code} onSelect={setSel} />
          <div className="space-y-3">
            <DealInspector deal={sel} />
            {sel && (
              <div className="neo-card space-y-3 rounded-2xl p-4">
                <p className="text-sm font-semibold">Resolve this case</p>
                <p className="text-xs text-muted">Review the dispute reason and available packing/waybill evidence before deciding.</p>
                <button disabled={busy} onClick={() => resolve("release")} className="btn-primary min-h-12 w-full">
                  {busy ? "Updating…" : "Release to vendor"}
                </button>
                <button disabled={busy} onClick={() => resolve("refund")} className="btn-ghost min-h-12 w-full">Refund buyer</button>
              </div>
            )}
          </div>
        </div>
      )}
      <DatabaseResetPanel />
    </div>
  );
}