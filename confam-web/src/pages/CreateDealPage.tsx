import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, MessageCircle } from "lucide-react";
import { dealApi } from "../api/dealApi";
import { errMsg } from "../api/client";
import { formatNaira } from "../utils/formatNaira";
import type { Deal } from "../types/deal.types";

export default function CreateDealPage() {
  const [f, setF] = useState({ title: "", description: "", amount: "", buyer_phone: "" });
  const [deal, setDeal] = useState<Deal | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const link = deal ? `${window.location.origin}/deal/${deal.code}` : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      setDeal(await dealApi.create({ ...f, amount: Number(f.amount) }));
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (deal)
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="card space-y-4 p-6">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Escrow link ready</p>
          <p className="font-medium">{deal.title}</p>
          <p className="font-mono-tabular text-2xl font-semibold">{formatNaira(deal.amount)}</p>
          <div className="font-mono-tabular break-all rounded-lg border border-line bg-surface-2 p-3 text-xs">{link}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button onClick={copy} className="btn-ghost">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy link"}</button>
            <a className="btn-primary" target="_blank" rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`Pay securely via Confam escrow: ${link}`)}`}>
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>
          <Link to="/dashboard/vendor" className="block text-center text-xs text-muted hover:text-ink">Back to dashboard</Link>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <form onSubmit={submit} className="card space-y-4 p-6">
        <h1 className="text-lg font-semibold">New escrow deal</h1>
        <div><label className="label">What are you selling?</label><input required className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><label className="label">Details (optional)</label><textarea rows={3} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Amount (₦)</label><input required inputMode="numeric" className="input font-mono-tabular" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/\D/g, "") })} /></div>
          <div><label className="label">Buyer phone</label><input inputMode="tel" className="input" value={f.buyer_phone} onChange={(e) => setF({ ...f, buyer_phone: e.target.value })} /></div>
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? "Generating…" : "Generate escrow link"}</button>
      </form>
    </div>
  );
}