import { useState } from "react";
import { X } from "lucide-react";
import { openPaystack } from "../../utils/paystackPopup";
import { dealApi, errMsg } from "../../api/dealApi";
import { formatNaira } from "../../utils/formatNaira";
import type { Deal } from "../../types/deal.types";

export default function PaystackModal({
  deal,
  onClose,
  onPaid,
}: {
  deal: Deal;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [email, setEmail] = useState(deal.buyer_email ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pay = async () => {
    setBusy(true);
    setErr("");
    try {
      const init = await dealApi.initPayment(deal.code, email);
      await openPaystack({
        email,
        amountNaira: deal.amount,
        reference: init.reference,
        accessCode: init.access_code,
        onSuccess: async (ref) => {
          await dealApi.verifyPayment(deal.code, ref);
          onPaid();
        },
        onClose: () => setBusy(false),
      });
    } catch (e) {
      setErr(errMsg(e, "Payment failed to start"));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 p-0 sm:place-items-center sm:p-4">
      <div className="card w-full max-w-sm rounded-b-none p-5 sm:rounded-b-xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-medium">Pay into escrow</p>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink"><X size={18} /></button>
        </div>
        <p className="font-mono-tabular mb-4 text-2xl font-semibold">{formatNaira(deal.amount)}</p>
        <label className="label">Email for receipt</label>
        <input type="email" className="input mb-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        {err && <p className="mb-2 text-xs text-red-500">{err}</p>}
        <button disabled={busy || !email} onClick={pay} className="btn-primary w-full">
          {busy ? "Opening Paystack…" : "Pay securely"}
        </button>
        <p className="mt-3 text-center text-[11px] text-muted">Funds are held until you confirm delivery.</p>
      </div>
    </div>
  );
}