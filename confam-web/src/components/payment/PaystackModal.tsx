import { useState } from "react";
import { Check, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { dealApi } from "../../api/dealApi";
import { errMsg } from "../../api/client";
import { useToast } from "../../context/useToast";
import { formatNaira } from "../../utils/formatNaira";
import type { Deal } from "../../types/deal.types";

type PaystackSetup = {
  key: string;
  email: string;
  amount: number;
  ref: string;
  onSuccess: (transaction: { reference: string }) => void;
  onCancel: () => void;
};

type PaystackWindow = Window & {
  PaystackPop?: {
    setup: (options: PaystackSetup) => { openIframe: () => void };
  };
};

export default function PaystackModal({
  deal,
  onClose,
}: {
  deal: Deal;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(deal.buyer_email ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toast = useToast();
  const buyerTotal = deal.total_payable ?? deal.amount + (deal.waybill_fee ?? 0);

  const loadPaystackInline = () =>
    new Promise<void>((resolve, reject) => {
      if (document.querySelector("#paystack-inline")) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.id = "paystack-inline";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load Paystack checkout"));
      document.head.appendChild(script);
    });

  const pay = async () => {
    setBusy(true);
    setErr("");
    try {
      const callbackUrl = new URL(`/deal/${encodeURIComponent(deal.code)}`, window.location.origin).toString();
      const init = await dealApi.initPayment(deal.code, email, callbackUrl);
      if (init.checkout.mock_mode) throw new Error("Paystack is not configured for payments in this environment.");
      if (!init.checkout.public_key || !init.checkout.reference) {
        throw new Error("Paystack did not return the credentials needed for inline checkout.");
      }

      await loadPaystackInline();
      const PaystackPop = (window as PaystackWindow).PaystackPop;
      if (!PaystackPop) throw new Error("Inline Paystack checkout could not be opened. Please try again.");

      const handler = PaystackPop.setup({
        key: init.checkout.public_key,
        email,
        amount: Math.round(buyerTotal * 100),
        ref: init.checkout.reference,
        onSuccess: (transaction: { reference: string }) => {
          dealApi.verifyPayment(deal.code, transaction.reference || init.checkout.reference || "")
            .then(() => window.location.assign(`${callbackUrl}?reference=${encodeURIComponent(transaction.reference || init.checkout.reference || "")}`))
            .catch((e) => {
              const message = errMsg(e, "Payment could not be verified");
              setErr(message);
              toast.error("Payment could not be verified", message);
            });
        },
        onCancel: () => {
          setBusy(false);
          toast.info("Checkout cancelled", "You can reopen the payment window when you are ready.");
        },
      });
      handler.openIframe();
    } catch (e) {
      const message = errMsg(e, "Payment failed to start");
      setErr(message);
      toast.error("Payment failed to start", message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#100e0b]/70 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="card w-full max-w-md overflow-hidden rounded-b-none rounded-t-[28px] p-0 sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/12 text-brand">
              <LockKeyhole size={20} />
            </span>
            <div>
              <p className="text-base font-bold">Secure escrow payment</p>
              <p className="text-xs text-muted">Protected by Paystack</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-xl border border-line text-muted transition hover:bg-surface-2 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Amount to pay</p>
            <p className="font-mono-tabular mt-2 text-3xl font-bold">{formatNaira(buyerTotal)}</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-muted">
              <ShieldCheck size={14} className="text-brand" />
              Your funds stay protected until delivery
            </p>
          </div>

          <label className="label text-sm">Email for receipt</label>
          <input type="email" className="input mb-4 h-14" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          {err && (
            <p className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">{err}</p>
          )}
          <button disabled={busy || !email} onClick={pay} className="btn-primary h-14 w-full text-base">
            {busy ? (
              "Opening secure checkout…"
            ) : (
              <>
                <LockKeyhole size={17} />
                Pay {formatNaira(buyerTotal)}
                <Check size={17} />
              </>
            )}
          </button>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
            No separate platform fee is added to the buyer total. Do not share this page or your OTP.
          </p>
        </div>
      </div>
    </div>
  );
}