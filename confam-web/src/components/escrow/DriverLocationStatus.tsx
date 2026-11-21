import { ExternalLink, MapPin } from "lucide-react";
import type { Waybill } from "../../types/deal.types";

export default function DriverLocationStatus({ waybill }: { waybill: Waybill }) {
  const ping = waybill.last_ping;

  return (
    <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold">
        <MapPin size={13} className="text-brand" /> Latest driver check-in
      </p>
      {ping ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono-tabular text-xs">
              {ping.lat.toFixed(5)}, {ping.lng.toFixed(5)}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {ping.at ? new Date(ping.at).toLocaleString() : "Time unavailable"}
            </p>
          </div>
          <a
            href={`https://www.google.com/maps?q=${ping.lat},${ping.lng}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost min-h-9 shrink-0 px-2.5 text-xs"
          >
            Map <ExternalLink size={12} />
          </a>
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted">No location check-in received yet. This panel updates automatically.</p>
      )}
    </div>
  );
}
