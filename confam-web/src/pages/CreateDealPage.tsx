import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, MessageCircle } from "lucide-react";
import { formatNaira } from "../utils/formatNaira";
import type { Deal } from "../types/deal.types";
import CreateDealForm from "./dashboard/vendor/CreateDealForm";

export default function CreateDealPage() {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [copied, setCopied] = useState(false);

  const link = deal ? `${window.location.origin}/deal/${deal.code}` : "";

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
      <div className="card space-y-4 p-6">
        <h1 className="text-lg font-semibold">New escrow deal</h1>
        <CreateDealForm onCreated={setDeal} submitLabel="Generate escrow link" />
      </div>
    </div>
  );
}