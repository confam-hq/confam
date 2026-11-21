import { useEffect, useState } from "react";
import { Banknote, Gavel, Percent, Users, Store, ShoppingBag, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { adminApi } from "../../../api/dealApi";
import { errMsg } from "../../../api/client";
import MetricCard from "../../../components/escrow/MetricCard";
import DealTable from "../../../components/escrow/DealTable";
import DealInspector from "../../../components/escrow/DealInspector";
import LoadingScreen from "../../../components/feedback/LoadingScreen";
import { formatNaira } from "../../../utils/formatNaira";
import { useToast } from "../../../context/useToast";
import DatabaseResetPanel from "../../../components/admin/DatabaseResetPanel";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import type { Deal } from "../../../types/deal.types";

export default function AdminDashboard() {
  const [params] = useSearchParams();
  const section = params.get("section") ?? "overview";
  const [disputes, setDisputes] = useState<Deal[]>([]);
  const [sel, setSel] = useState<Deal | null>(null);
  const [rev, setRev] = useState({ total: 0, fees: 0, settled: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [dormantUsers, setDormantUsers] = useState<Array<{ id: number; name: string; email: string; phone: string; role: string; created_at: string }>>([]);
  const [dormantLoading, setDormantLoading] = useState(true);
  const [overview, setOverview] = useState<{
    users: { total: number; admins: number; vendors: number; buyers: number; verified: number; unverified: number };
    deals: { total: number; statuses: Record<string, number> };
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const [confirmResolve, setConfirmResolve] = useState<"release" | "refund" | null>(null);
  const [deleting, setDeleting] = useState(false);
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
    adminApi.overview().then(setOverview).catch((error) => setErr(errMsg(error, "Could not load platform analytics.")));
  }, []);

  const deleteDormantUser = async (user: { id: number; name: string }) => {
    setConfirmDelete(user);
  };

  const confirmDeleteDormantUser = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteDormantUser(confirmDelete.id);
      setDormantUsers((current) => current.filter((item) => item.id !== confirmDelete.id));
      toast.success("Dormant account deleted", `${confirmDelete.name} was removed.`);
      setConfirmDelete(null);
    } catch (error) {
      const message = errMsg(error, "Could not delete this dormant account.");
      setErr(message);
      toast.error("Could not delete account", message);
    } finally {
      setDeleting(false);
    }
  };

  const resolve = async (outcome: "release" | "refund") => {
    if (!sel) return;
    setBusy(true);
    setErr("");
    try {
      await adminApi.resolve(sel.code, outcome);
      await load();
      setConfirmResolve(null);
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
      {err && <p role="alert" className="mb-4 text-sm text-red-500">{err}</p>}

      {section === "overview" && (
        <>
          <div className="mb-6">
            <p className="label">Admin workspace</p>
            <h1 className="text-2xl font-semibold">Platform overview</h1>
            <p className="mt-1 text-sm text-muted">Live operational and revenue activity across Confam.</p>
          </div>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total accounts" value={overview?.users.total ?? "—"} icon={<Users size={16} />} />
            <MetricCard label="Total deals" value={overview?.deals.total ?? "—"} icon={<Gavel size={16} />} />
            <MetricCard label="Volume settled" value={formatNaira(rev.settled)} icon={<Banknote size={16} />} />
            <MetricCard label="Fee revenue" value={formatNaira(rev.fees)} icon={<Percent size={16} />} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
            <section className="neo-card rounded-3xl p-5">
              <h2 className="font-semibold">Deals by status</h2>
              <p className="mt-1 text-xs text-muted">Current distribution across the escrow lifecycle</p>
              <div className="mt-5">
                {(() => {
                  const statuses = [
                    ["Awaiting payment", overview?.deals.statuses.awaiting_payment ?? 0, "#94a3b8"],
                    ["Escrow locked", overview?.deals.statuses.escrow_locked ?? 0, "#10b981"],
                    ["In transit", overview?.deals.statuses.in_transit ?? 0, "#3b82f6"],
                    ["Settled", overview?.deals.statuses.settled ?? 0, "#059669"],
                    ["Disputed", overview?.deals.statuses.disputed ?? 0, "#f59e0b"],
                    ["Refunded", overview?.deals.statuses.refunded ?? 0, "#ef4444"],
                  ] as const;
                  const max = Math.max(1, ...statuses.map((item) => item[1]));
                  return (
                    <svg viewBox="0 0 620 260" role="img" aria-label="Bar chart showing deals by status" className="w-full overflow-visible">
                      {[0, 1, 2, 3].map((line) => <line key={line} x1="48" x2="600" y1={210 - line * 48} y2={210 - line * 48} stroke="var(--line)" />)}
                      {statuses.map(([label, count, color], index) => {
                        const height = count ? Math.max(6, count / max * 160) : 0;
                        const x = 62 + index * 90;
                        return (
                          <g key={label}>
                            <text x={x + 28} y={Math.max(35, 210 - height - 8)} textAnchor="middle" fill="var(--ink)" fontSize="12">{count}</text>
                            <rect x={x} y={210 - height} width="56" height={height} rx="8" fill={color} />
                            <text x={x + 28} y="234" textAnchor="middle" fill="var(--muted)" fontSize="9">{label}</text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
            </section>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="neo-card rounded-3xl p-5">
                <div className="flex items-center justify-between"><p className="font-semibold">Account mix</p><Users size={18} className="text-brand" /></div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-surface-2 p-4"><Store size={16} className="text-brand" /><p className="mt-3 font-mono-tabular text-xl font-semibold">{overview?.users.vendors ?? "—"}</p><p className="text-xs text-muted">Vendors</p></div>
                  <div className="rounded-2xl bg-surface-2 p-4"><ShoppingBag size={16} className="text-brand" /><p className="mt-3 font-mono-tabular text-xl font-semibold">{overview?.users.buyers ?? "—"}</p><p className="text-xs text-muted">Buyers</p></div>
                </div>
              </div>
              <div className="neo-card rounded-3xl p-5">
                <div className="flex items-center justify-between"><p className="font-semibold">Email verification</p><ShieldCheck size={18} className="text-brand" /></div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div><p className="font-mono-tabular text-2xl font-semibold">{overview?.users.verified ?? "—"}</p><p className="text-xs text-muted">Verified</p></div>
                  <div><p className="font-mono-tabular text-2xl font-semibold">{overview?.users.unverified ?? "—"}</p><p className="text-xs text-muted">Unverified</p></div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {section === "disputes" && (
        <>
          <div className="mb-6">
            <p className="label">Dispute center</p>
            <h1 className="text-2xl font-semibold">Arbitration queue</h1>
            <p className="mt-1 text-sm text-muted">Review evidence and decide whether to release or refund funds.</p>
          </div>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Open disputes" value={disputes.length} icon={<Gavel size={16} />} />
            <MetricCard label="Volume settled" value={formatNaira(rev.settled)} icon={<Banknote size={16} />} />
            <MetricCard label="Fee revenue" value={formatNaira(rev.fees)} icon={<Percent size={16} />} />
          </div>
          {loading ? <LoadingScreen compact label="Loading the dispute queue" /> : (
            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
              <DealTable deals={disputes} selected={sel?.code} onSelect={setSel} />
              <div className="space-y-3">
                <DealInspector deal={sel} />
                {sel && (
                  <div className="neo-card space-y-3 rounded-2xl p-4">
                    <p className="text-sm font-semibold">Resolve this case</p>
                    <p className="text-xs text-muted">Review the dispute reason and available evidence before deciding.</p>
                    <button disabled={busy} onClick={() => setConfirmResolve("release")} className="btn-primary min-h-12 w-full">Release to vendor</button>
                    <button disabled={busy} onClick={() => setConfirmResolve("refund")} className="btn-ghost min-h-12 w-full">Refund buyer</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {section === "accounts" && (
        <section>
          <div className="mb-6">
            <p className="label">Account management</p>
            <h1 className="text-2xl font-semibold">Dormant accounts</h1>
            <p className="mt-1 text-sm text-muted">Unverified accounts that have not created any deals.</p>
          </div>
          <div className="neo-card rounded-3xl p-5">
            {dormantLoading ? <p className="text-sm text-muted">Loading accounts…</p> : dormantUsers.length === 0 ? (
              <div className="py-10 text-center"><UserRoundCheck size={28} className="mx-auto text-brand" /><p className="mt-3 font-medium">No dormant accounts found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted"><tr><th className="pb-3">Name</th><th className="pb-3">Email</th><th className="pb-3">Role</th><th className="pb-3 text-right">Action</th></tr></thead>
                  <tbody>{dormantUsers.map((user) => (
                    <tr key={user.id} className="border-t border-line">
                      <td className="py-4 pr-3 font-medium">{user.name}</td><td className="py-4 pr-3 text-muted">{user.email}</td><td className="py-4 pr-3 capitalize">{user.role}</td>
                      <td className="py-4 text-right"><button onClick={() => deleteDormantUser(user)} className="btn-ghost min-h-10 text-red-500">Delete</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {section === "control" && (
        <>
          <div className="mb-6">
            <p className="label">System controls</p>
            <h1 className="text-2xl font-semibold">Admin control area</h1>
            <p className="mt-1 text-sm text-muted">Restricted maintenance operations and database management.</p>
          </div>
          <DatabaseResetPanel />
        </>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={`Delete ${confirmDelete?.name ?? "this account"}?`}
        description="This permanently removes the unverified dormant account and its active sessions."
        confirmLabel="Delete account"
        danger
        busy={deleting}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => void confirmDeleteDormantUser()}
      />
      <ConfirmModal
        open={!!confirmResolve}
        title={confirmResolve === "refund" ? "Refund this buyer?" : "Release funds to the vendor?"}
        description={`This resolves dispute ${sel?.code ?? ""}. The escrow decision cannot be undone.`}
        confirmLabel={confirmResolve === "refund" ? "Confirm refund" : "Confirm release"}
        danger
        busy={busy}
        onClose={() => setConfirmResolve(null)}
        onConfirm={() => confirmResolve && void resolve(confirmResolve)}
      />
    </div>
  );
}