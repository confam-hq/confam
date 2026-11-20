import type { ReactNode } from "react";

export default function MetricCard({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="neo-card rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between text-muted">
        <span className="text-xs font-medium">{label}</span>
        {icon}
      </div>
      <p className="font-mono-tabular text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}