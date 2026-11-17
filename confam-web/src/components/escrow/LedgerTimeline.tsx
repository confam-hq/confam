import type { LedgerEvent } from "../../types/deal.types";

export default function LedgerTimeline({ events = [] }: { events?: LedgerEvent[] }) {
  if (!events.length) return <p className="text-sm text-muted">No activity yet.</p>;
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-brand" />
          <p className="text-sm font-medium">{e.label}</p>
          {e.detail && <p className="text-xs text-muted">{e.detail}</p>}
          <p className="font-mono-tabular text-[11px] text-muted">{new Date(e.at).toLocaleString("en-NG")}</p>
        </li>
      ))}
    </ol>
  );
}