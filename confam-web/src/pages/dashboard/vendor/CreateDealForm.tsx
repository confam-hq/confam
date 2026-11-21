import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { errMsg } from "../../../api/client";
import { dealApi } from "../../../api/dealApi";
import { formatNaira } from "../../../utils/formatNaira";
import { useToast } from "../../../context/useToast";
import type { CreateDealPayload, Deal, DeliveryMode } from "../../../types/deal.types";

type FormValues = {
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  item_title: string;
  item_description: string;
  item_amount_naira: string;
  waybill_fee_naira: string;
  delivery_mode: DeliveryMode | "";
};

const initialForm: FormValues = {
  buyer_name: "",
  buyer_phone: "",
  buyer_email: "",
  item_title: "",
  item_description: "",
  item_amount_naira: "",
  waybill_fee_naira: "0",
  delivery_mode: "",
};

export default function CreateDealForm({
  onCreated,
  submitLabel = "Create deal",
}: {
  onCreated: (deal: Deal) => void;
  submitLabel?: string;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toast = useToast();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErr("");

    if (!user?.phone || !user.bank_code || !user.account_number || !user.account_name) {
      const message = "Your account is missing payout details. Update your bank details before creating a deal.";
      setErr(message);
      toast.error("Payout details needed", message);
      return;
    }

    setBusy(true);
    const payload: CreateDealPayload = {
      vendor_name: user.name,
      vendor_phone: user.phone,
      vendor_email: user.email,
      vendor_bank_code: user.bank_code,
      vendor_bank_name: user.bank_name ?? undefined,
      vendor_account_number: user.account_number,
      vendor_account_name: user.account_name,
      buyer_name: form.buyer_name.trim() || undefined,
      buyer_phone: form.buyer_phone.trim(),
      buyer_email: form.buyer_email.trim(),
      item_title: form.item_title.trim(),
      item_description: form.item_description.trim() || undefined,
      item_amount_naira: Number(form.item_amount_naira),
      waybill_fee_naira: Number(form.waybill_fee_naira || 0),
      delivery_mode: form.delivery_mode as DeliveryMode,
    };

    try {
      onCreated(await dealApi.create(payload));
      toast.success("Deal created", "Your escrow link is ready to share with the buyer.");
    } catch (error) {
      const message = errMsg(error);
      setErr(message);
      toast.error("Could not create deal", message);
    } finally {
      setBusy(false);
    }
  };

  const maskedAccount = user?.account_number ? `•••• ${user.account_number.slice(-4)}` : "Not set";
  const subtotal = Number(form.item_amount_naira || 0) + Number(form.waybill_fee_naira || 0);
  const estimatedFee = Math.round(subtotal * 100 * 0.05) / 100;
  const estimatedPayout = subtotal - estimatedFee;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-lg border border-line bg-surface-2 px-4 py-3">
        <p className="text-xs font-medium text-muted">Seller payout</p>
        <p className="mt-1 text-sm font-medium">
          {user?.account_name || user?.name || "Payout details unavailable"}
        </p>
        <p className="text-xs text-muted">
          {[user?.bank_name, maskedAccount].filter(Boolean).join(" · ")}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Buyer details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="buyer-name" className="label">Buyer name <span className="font-normal">(optional)</span></label>
            <input id="buyer-name" className="input" value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="buyer-phone" className="label">Buyer phone</label>
            <input id="buyer-phone" required inputMode="tel" className="input" value={form.buyer_phone} onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="buyer-email" className="label">Buyer email</label>
            <input id="buyer-email" type="email" required className="input" value={form.buyer_email} onChange={(e) => setForm({ ...form, buyer_email: e.target.value })} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Item and delivery</h2>
        <div>
          <label htmlFor="item-title" className="label">What are you selling?</label>
          <input id="item-title" required maxLength={160} className="input" value={form.item_title} onChange={(e) => setForm({ ...form, item_title: e.target.value })} />
        </div>
        <div>
          <label htmlFor="item-description" className="label">Details <span className="font-normal">(optional)</span></label>
          <textarea id="item-description" rows={3} maxLength={2000} className="input resize-y" value={form.item_description} onChange={(e) => setForm({ ...form, item_description: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="item-amount" className="label">Amount (₦)</label>
            <input id="item-amount" type="number" min={500} step="0.01" required inputMode="decimal" className="input font-mono-tabular" value={form.item_amount_naira} onChange={(e) => setForm({ ...form, item_amount_naira: e.target.value })} />
          </div>
          <div>
            <label htmlFor="waybill-fee" className="label">Delivery fee (₦) <span className="font-normal">(optional)</span></label>
            <input id="waybill-fee" type="number" min={0} step="0.01" inputMode="decimal" className="input font-mono-tabular" value={form.waybill_fee_naira} onChange={(e) => setForm({ ...form, waybill_fee_naira: e.target.value })} />
          </div>
        </div>
        <div>
          <label htmlFor="delivery-mode" className="label">Delivery method</label>
          <select
            id="delivery-mode"
            required
            className="input"
            value={form.delivery_mode}
            onChange={(e) => setForm({ ...form, delivery_mode: e.target.value as DeliveryMode | "" })}
          >
            <option value="" disabled>Choose a delivery method</option>
            <option value="LOCAL_DISPATCH">Local delivery</option>
            <option value="INTERSTATE_WAYBILL">Interstate waybill</option>
          </select>
        </div>
      </section>

      <div className="neo-card rounded-2xl p-4">
        <p className="text-sm font-semibold">Vendor platform fee: 5%</p>
        <p className="mt-1 text-xs text-muted">
          Deducted from your item and delivery proceeds after successful delivery. The buyer is not charged an extra platform fee.
        </p>
        {subtotal > 0 && (
          <div className="mt-3 flex justify-between gap-3 text-sm">
            <span className="text-muted">Estimated fee · estimated payout</span>
            <span className="font-mono-tabular text-right">
              {formatNaira(estimatedFee)} · {formatNaira(estimatedPayout)}
            </span>
          </div>
        )}
      </div>

      {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
      <button disabled={busy} className="btn-primary min-h-14 w-full text-base">
        {busy ? "Creating…" : submitLabel}
      </button>
    </form>
  );
}
