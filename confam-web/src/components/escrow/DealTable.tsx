import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import StatusPill from "./StatusPill";
import { formatNaira } from "../../utils/formatNaira";
import type { Deal } from "../../types/deal.types";

export default function DealTable({
  deals,
  selected,
  onSelect,
}: {
  deals: Deal[];
  selected?: string;
  onSelect: (d: Deal) => void;
}) {
  const [q, setQ] = useState("");
  const rows = useMemo(
    () =>
      deals.filter((d) =>
        `${d.code} ${d.title} ${d.buyer_name ?? ""}`.toLowerCase().includes(q.toLowerCase())
      ),
    [deals, q]
  );

  return (
    <div className="neo-card overflow-hidden rounded-2xl">
      <div className="border-b border-line p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search deals" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-2 font-medium">Deal</th>
              <th className="px-4 py-2 font-medium">Buyer total</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr
                key={d.code}
                onClick={() => onSelect(d)}
                className={`cursor-pointer border-b border-line last:border-0 hover:bg-surface-2 ${
                  selected === d.code ? "bg-surface-2" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{d.title}</p>
                  <p className="font-mono-tabular text-xs text-muted">{d.code}</p>
                </td>
                <td className="font-mono-tabular px-4 py-3">
                  {formatNaira(d.total_payable ?? d.amount + (d.waybill_fee ?? 0))}
                </td>
                <td className="px-4 py-3"><StatusPill status={d.status} /></td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-muted">No deals found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}