import { useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { dealApi } from "../../api/dealApi";
import type { Deal } from "../../types/deal.types";

export default function WaybillScannerCard({ code, onDone }: { code: string; onDone: (d: Deal) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async (f?: File | null) => {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      onDone(await dealApi.scanWaybill(code, f));
    } catch (e) {
      setErr(e instanceof Error && e.message ? e.message : "Could not read waybill");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4">
      <p className="mb-1 flex items-center gap-2 text-sm font-medium"><ScanLine size={16} className="text-brand" /> Scan motor-park waybill</p>
      <p className="mb-3 text-xs text-muted">Snap the receipt. AI extracts the route, plate and driver.</p>
      <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <button onClick={() => input.current?.click()} disabled={busy} className="btn-ghost w-full">
        {busy ? "Scanning…" : "Take or upload photo"}
      </button>
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
    </div>
  );
}