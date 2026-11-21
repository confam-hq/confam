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
  const [dormantUsers, setDormantUsers] = useState<Array<{ id: number; name: string; email: string; phone: string; role: string; created_at: string }>>([]);
  const [dormantLoading, setDormantLoading] = useState(true);
  const toast = useToast();

  const load = () =>
    adminApi.disputes().then((d) => { setDisputes(d); setSel((s) => d.find((x) => x.code === s?.code) ?? d[0] ?? null); });

  useEffect(() => {
    load()
      .catch((error) => setErr(errMsg(error, "Could not load disputes.")))
      .finally(() => setLoading(false));
    adminApi.revenue().then(setRev).catch((error) => setErr(errMsg(error, "Could not load revenue.")));
    adminApi.dormantUsers()
      .then(setDormantUsers)
      .catch((error) => setErr(errMsg(error, "Could not load dormant accounts.")))
      .finally(() => setDormantLoading(false));
  }, []);

  const deleteDormantUser = async (user: { id: number; name: string }) => {
    if (!window.confirm(`Delete dormant account "${user.name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteDormantUser(user.id);
      setDormantUsers((current) => current.filter((item) => item.id !== user.id));
      toast.success("Dormant account deleted", `${user.name} was removed.`);
    } catch (error) {
      const message = errMsg(error, "Could not delete this dormant account.");
      setErr(message);
      toast.error("Could not delete account", message);
    }
  };

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
      <section className="neo-card mt-6 rounded-2xl p-4">
        <h2 className="text-base font-semibold">Dormant unverified accounts</h2>
        <p className="mt-1 text-xs text-muted">Accounts that have not completed email verification and have no deals.</p>
        {dormantLoading ? (
          <p className="mt-4 text-sm text-muted">Loading accounts…</p>
        ) : dormantUsers.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No dormant accounts found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th><th className="pb-2"></th></tr>
              </thead>
              <tbody>
                {dormantUsers.map((user) => (
                  <tr key={user.id} className="border-t border-line">
                    <td className="py-3 pr-3">{user.name}</td>
                    <td className="py-3 pr-3">{user.email}</td>
                    <td className="py-3 pr-3 capitalize">{user.role}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => deleteDormantUser(user)} className="btn-ghost text-red-500">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <DatabaseResetPanel />
    </div>
  );
}