import { useEffect, useMemo, useState } from "react";
import { Banknote, CircleCheck, Clock3, PackageCheck, Percent } from "lucide-react";
import { dealApi } from "../../../api/dealApi";
import { errMsg } from "../../../api/client";
import LoadingScreen from "../../../components/feedback/LoadingScreen";
import MetricCard from "../../../components/escrow/MetricCard";
import StatusPill from "../../../components/escrow/StatusPill";
import { formatNaira } from "../../../utils/formatNaira";
import type { Deal, DealStatus } from "../../../types/deal.types";

const statusLabels: { status: DealStatus; label: string }[] = [
  { status: "pending", label: "Awaiting payment" },
  { status: "escrow_locked", label: "In escrow" },
  { status: "in_transit", label: "In transit" },
  { status: "settled", label: "Settled" },
  { status: "disputed", label: "Disputed" },
  { status: "refunded", label: "Refunded" },
];

const grossValue = (deal: Deal) => Number(deal.amount) + Number(deal.waybill_fee ?? 0);
const netPayout = (deal: Deal) =>
  grossValue(deal) - (deal.platform_fee_payer === "vendor" ? Number(deal.platform_fee ?? 0) : 0);

export default function VendorAnalyticsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    dealApi.list("vendor")
      .then((result) => { if (active) setDeals(result); })
      .catch((cause) => { if (active) setError(errMsg(cause, "Could not load analytics.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const metrics = useMemo(() => {
    const settled = deals.filter((deal) => deal.status === "settled");
    const active = deals.filter((deal) => deal.status === "escrow_locked" || deal.status === "in_transit");
    return {
      settledVolume: settled.reduce((sum, deal) => sum + grossValue(deal), 0),
      settledPayout: settled.reduce((sum, deal) => sum + netPayout(deal), 0),
      activePayout: active.reduce((sum, deal) => sum + netPayout(deal), 0),
      feesWithheld: settled
        .filter((deal) => deal.platform_fee_payer === "vendor")
        .reduce((sum, deal) => sum + Number(deal.platform_fee ?? 0), 0),
    };
  }, [deals]);
  const statusCounts = useMemo(
    () => statusLabels.map(({ status, label }) => ({
      status,
      label,
      count: deals.filter((deal) => deal.status === status).length,
    })),
    [deals],
  );
  const maxStatusCount = Math.max(1, ...statusCounts.map(({ count }) => count));

  const retry = () => {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="mx-auto max-w-7xl py-2">
      <div className="mb-6">
        <p className="label">Vendor workspace</p>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-muted">All-time activity and estimated payouts across your deals.</p>
      </div>

      {loading ? (
        <LoadingScreen compact label="Loading your analytics" />
      ) : error ? (
        <div role="alert" className="card p-6 text-center">
          <p className="text-sm font-medium">Analytics could not be loaded.</p>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button onClick={retry} className="btn-ghost mt-4">Try again</button>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total deals" value={deals.length} icon={<PackageCheck size={16} />} />
            <MetricCard label="Settled volume" value={formatNaira(metrics.settledVolume)} icon={<Banknote size={16} />} />
            <MetricCard label="Settled vendor payout" value={formatNaira(metrics.settledPayout)} icon={<CircleCheck size={16} />} />
            <MetricCard label="Payout in escrow" value={formatNaira(metrics.activePayout)} icon={<Clock3 size={16} />} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="neo-card rounded-2xl p-5">
              <h2 className="font-semibold">Deals by status</h2>
              <div className="mt-5">
                <svg
                  viewBox="0 0 600 250"
                  role="img"
                  aria-label="Bar chart showing the number of deals in each status"
                  className="w-full overflow-visible text-brand"
                >
                  {[0, 1, 2, 3].map((line) => {
                    const y = 200 - line * 55;
                    return <line key={line} x1="38" x2="575" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.14" />;
                  })}
                  {statusCounts.map(({ status, label, count }, index) => {
                    const height = count ? Math.max(4, (count / maxStatusCount) * 165) : 0;
                    const x = 55 + index * 88;
                    return (
                      <g key={status}>
                        <text x={x + 24} y={Math.max(20, 200 - height - 8)} textAnchor="middle" className="fill-ink text-xs">{count}</text>
                        <rect x={x} y={200 - height} width="48" height={height} rx="6" className="fill-brand" />
                        <text x={x + 24} y="222" textAnchor="middle" className="fill-muted text-[9px]">{label}</text>
                      </g>
                    );
                  })}
                </svg>
                <p className="sr-only">Counts: {statusCounts.map(({ label, count }) =>
                  `${label}: ${count}`
                ).join(", ")}.</p>
              </div>
            </section>

            <section className="neo-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Platform fees</h2>
                  <p className="mt-1 text-xs text-muted">Fees withheld from settled deals where the vendor pays the fee.</p>
                </div>
                <Percent size={18} className="text-brand" />
              </div>
              <p className="mt-6 font-mono-tabular text-3xl font-semibold">{formatNaira(metrics.feesWithheld)}</p>
              <p className="mt-2 text-xs text-muted">New vendor-paid deals use a 5% fee. Older deals keep their original fee arrangement.</p>
            </section>
          </div>

          <section className="mt-6">
            <h2 className="mb-3 font-semibold">Recent deals</h2>
            {deals.length ? (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-surface-2 text-xs text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Deal</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {deals.slice(0, 8).map((deal) => (
                      <tr key={deal.code}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{deal.title}</p>
                          <p className="font-mono-tabular text-xs text-muted">{deal.code}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">{new Date(deal.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-mono-tabular">{formatNaira(grossValue(deal))}</td>
                        <td className="px-4 py-3"><StatusPill status={deal.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card p-6 text-sm text-muted">Your deal activity will appear here after you create a deal.</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
