import { useState } from "react";
import { X } from "lucide-react";
import { dealApi } from "../../../api/dealApi";
import { errMsg } from "../../../api/client";
import type { Deal } from "../../../types/deal.types";

export default function CreateDealModal({ onClose, onCreated }: { onClose: () => void; onCreated: (d: Deal) => void }) {
  const [f, setF] = useState({ title: "", amount: "", buyer_phone: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      onCreated(await dealApi.create({ ...f, amount: Number(f.amount) }));
      onClose();
    } catch (x) {
      setErr(errMsg(x));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 sm:place-items-center sm:p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 rounded-b-none p-5 sm:rounded-b-xl">
        <div className="flex items-center justify-between">
          <p className="font-medium">New deal</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink"><X size={18} /></button>
        </div>
        <div><label className="label">Item</label><input required className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Amount (₦)</label><input required inputMode="numeric" className="input font-mono-tabular" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/\D/g, "") })} /></div>
          <div><label className="label">Buyer phone</label><input inputMode="tel" className="input" value={f.buyer_phone} onChange={(e) => setF({ ...f, buyer_phone: e.target.value })} /></div>
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? "Creating…" : "Create deal"}</button>
      </form>
    </div>
  );
}