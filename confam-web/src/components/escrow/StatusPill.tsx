import type { DealStatus } from "../../types/deal.types";

const map: Record<DealStatus, { label: string; cls: string }> = {
  pending: { label: "Awaiting Payment", cls: "border-line text-muted" },
  escrow_locked: { label: "Escrow Locked", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  in_transit: { label: "In Transit", cls: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  settled: { label: "Settled", cls: "border-line bg-surface-2 text-ink" },
  disputed: { label: "Disputed", cls: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  refunded: { label: "Refunded", cls: "border-line text-muted" },
};

export default function StatusPill({ status }: { status: DealStatus }) {
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}