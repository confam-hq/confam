import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dealApi } from '../api/dealApi';
import { formatNaira } from '../utils/formatNaira';
import { ShieldCheck, Sparkles, Loader2, Building2 } from 'lucide-react';

const NIGERIAN_BANKS = [
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '044', name: 'Access Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '999992', name: 'OPay Digital Services' },
  { code: '50211', name: 'Kuda Bank' },
  { code: '50515', name: 'Moniepoint MFB' },
];

export const CreateDealPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resolvingBank, setResolvingBank] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    vendor_name: '',
    vendor_phone: '',
    vendor_email: '',
    vendor_bank_code: '058',
    vendor_bank_name: 'Guaranty Trust Bank (GTBank)',
    vendor_account_number: '',
    vendor_account_name: '',
    buyer_name: '',
    buyer_phone: '',
    buyer_email: '',
    item_title: '',
    item_description: '',
    item_amount_naira: '',
    waybill_fee_naira: '',
    delivery_mode: 'INTERSTATE_WAYBILL',
  });

  useEffect(() => {
    const rawUser = localStorage.getItem('confam_vendor_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      setForm((prev) => ({
        ...prev,
        vendor_name: user.name || prev.vendor_name,
        vendor_phone: user.phone || prev.vendor_phone,
        vendor_email: user.email || prev.vendor_email,
        vendor_bank_code: user.bank_code || prev.vendor_bank_code,
        vendor_bank_name: user.bank_name || prev.vendor_bank_name,
        vendor_account_number: user.account_number || prev.vendor_account_number,
        vendor_account_name: user.account_name || prev.vendor_account_name,
      }));
    }
  }, []);
  
  const itemAmount = parseFloat(form.item_amount_naira) || 0;
  const waybillFee = parseFloat(form.waybill_fee_naira) || 0;
  const subtotal = itemAmount + waybillFee;
  const platformFee = Math.min(5000, Math.round(subtotal * 0.015));
  const totalPayable = subtotal + platformFee;

  const handleAccountChange = async (accountNumber: string, bankCode = form.vendor_bank_code) => {
    const cleaned = accountNumber.replace(/\D/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, vendor_account_number: cleaned }));

    if (cleaned.length === 10) {
      setResolvingBank(true);
      try {
        const res = await dealApi.resolveBankAccount(cleaned, bankCode);
        setForm((prev) => ({
          ...prev,
          vendor_account_number: cleaned,
          vendor_account_name: res.account_name,
        }));
      } catch {
        setForm((prev) => ({
          ...prev,
          vendor_account_name: prev.vendor_name
            ? prev.vendor_name.toUpperCase()
            : 'CONFAM VERIFIED VENDOR',
        }));
      } finally {
        setResolvingBank(false);
      }
    }
  };

  const fillStageDemoData = () => {
    setForm({
      vendor_name: 'Eminent Gadgets Awka',
      vendor_phone: '09045383655',
      vendor_email: 'vendor@confam.ng',
      vendor_bank_code: '058',
      vendor_bank_name: 'Guaranty Trust Bank (GTBank)',
      vendor_account_number: '0123456789',
      vendor_account_name: 'EMINENT GADGETS AWKA',
      buyer_name: 'Chukwudi Okeke',
      buyer_phone: '08031234567',
      buyer_email: 'buyer@unizik.edu.ng',
      item_title: 'UK Used iPhone 11 128GB (Black, Factory Unlocked)',
      item_description: '89% Battery Health, Face ID working 100%, includes original 20W Type-C fast charger.',
      item_amount_naira: '185000',
      waybill_fee_naira: '3500',
      delivery_mode: 'INTERSTATE_WAYBILL',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await dealApi.createDeal({
        ...form,
        item_amount_naira: Number(form.item_amount_naira),
        waybill_fee_naira: Number(form.waybill_fee_naira || 0),
      });
      navigate(`/v/${res.deal.short_code}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create Confam link. Check all required fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-4">
        <div>
          <span className="text-xs font-mono-tabular text-[#10B981] uppercase">
            ZERO-INSTALL ESCROW GENERATOR
          </span>
          <h1 className="font-display font-bold text-2xl text-[#FAFAFA]">
            Create a Confam Payment & Waybill Link
          </h1>
        </div>
        <button
          type="button"
          onClick={fillStageDemoData}
          className="self-start px-3 py-1.5 rounded-lg bg-[#121216] border border-[#27272A] hover:border-[#10B981] text-xs font-mono-tabular text-[#10B981] flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" /> Auto-Fill Demo Deal
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444] text-xs text-[#EF4444]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item & Pricing */}
        <div className="bg-[#121216] border border-[#27272A] rounded-xl p-5 space-y-4">
          <h2 className="font-display font-bold text-sm uppercase tracking-wider text-[#FAFAFA]">
            1. Item & Waybill Shield Pricing
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#A1A1AA] block mb-1">Item Title *</label>
              <input
                type="text"
                value={form.item_title}
                onChange={(e) => setForm({ ...form, item_title: e.target.value })}
                placeholder="e.g. UK Used iPhone 11 128GB (Black)"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3.5 py-2.5 text-sm text-[#FAFAFA]"
                required
              />
            </div>

            <div>
              <label className="text-xs text-[#A1A1AA] block mb-1">
                Condition / Specific Details (Audited by Gemini Vision during Proof-of-Pack)
              </label>
              <textarea
                rows={2}
                value={form.item_description}
                onChange={(e) => setForm({ ...form, item_description: e.target.value })}
                placeholder="e.g. No scratches on screen, comes with white 20W charger brick."
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-[#FAFAFA]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#A1A1AA] block mb-1">Item Price (₦) *</label>
                <input
                  type="number"
                  min={500}
                  value={form.item_amount_naira}
                  onChange={(e) => setForm({ ...form, item_amount_naira: e.target.value })}
                  placeholder="185000"
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3.5 py-2.5 text-sm font-mono-tabular text-[#FAFAFA]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#A1A1AA] block mb-1">Waybill / Rider Fee (₦)</label>
                <input
                  type="number"
                  min={0}
                  value={form.waybill_fee_naira}
                  onChange={(e) => setForm({ ...form, waybill_fee_naira: e.target.value })}
                  placeholder="3500"
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3.5 py-2.5 text-sm font-mono-tabular text-[#FAFAFA]"
                />
              </div>

              <div>
                <label className="text-xs text-[#A1A1AA] block mb-1">Delivery Mode *</label>
                <select
                  value={form.delivery_mode}
                  onChange={(e) => setForm({ ...form, delivery_mode: e.target.value })}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2.5 text-xs text-[#FAFAFA]"
                >
                  <option value="INTERSTATE_WAYBILL">Inter-State Park Waybill</option>
                  <option value="LOCAL_DISPATCH">Local Campus / City Rider</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#09090B] border border-[#27272A] flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular">
            <span className="text-[#A1A1AA]">
              1.5% Confam Fee: <strong className="text-[#FAFAFA]">{formatNaira(platformFee)}</strong>
            </span>
            <span className="text-[#10B981] font-bold text-sm">
              Total Buyer Locks: {formatNaira(totalPayable)}
            </span>
          </div>
        </div>

        {/* Vendor Settlement Bank */}
        <div className="bg-[#121216] border border-[#27272A] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#10B981]" />
            <h2 className="font-display font-bold text-sm uppercase tracking-wider text-[#FAFAFA]">
              2. Vendor Instant Payout Bank Account
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#A1A1AA] block mb-1">Vendor Business / Name *</label>
              <input
                type="text"
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                placeholder="Eminent Gadgets Awka"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-[#FAFAFA]"
                required
              />
            </div>

            <div>
              <label className="text-xs text-[#A1A1AA] block mb-1">Vendor WhatsApp / Phone *</label>
              <input
                type="tel"
                value={form.vendor_phone}
                onChange={(e) => setForm({ ...form, vendor_phone: e.target.value })}
                placeholder="09045383655"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs font-mono-tabular text-[#FAFAFA]"
                required
              />
            </div>

            <div>
              <label className="text-xs text-[#A1A1AA] block mb-1">Settlement Bank *</label>
              <select
                value={form.vendor_bank_code}
                onChange={(e) => {
                  const bank = NIGERIAN_BANKS.find((b) => b.code === e.target.value);
                  setForm({
                    ...form,
                    vendor_bank_code: e.target.value,
                    vendor_bank_name: bank?.name || 'Nigerian Bank',
                  });
                  if (form.vendor_account_number.length === 10) {
                    handleAccountChange(form.vendor_account_number, e.target.value);
                  }
                }}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA]"
              >
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#A1A1AA] block mb-1">10-Digit NUBAN Account No. *</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={form.vendor_account_number}
                onChange={(e) => handleAccountChange(e.target.value)}
                placeholder="0123456789"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs font-mono-tabular text-[#FAFAFA]"
                required
              />
            </div>
          </div>

          <div className="bg-[#09090B] border border-[#27272A] rounded-lg px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-xs text-[#A1A1AA]">Resolved Account Name:</span>
            {resolvingBank ? (
              <span className="text-xs text-[#F59E0B] flex items-center gap-1 font-mono-tabular">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Resolving NUBAN...
              </span>
            ) : (
              <input
                type="text"
                value={form.vendor_account_name}
                onChange={(e) => setForm({ ...form, vendor_account_name: e.target.value })}
                placeholder="Type 10-digit account or enter verified name"
                className="bg-transparent text-right font-mono-tabular font-bold text-xs text-[#10B981] focus:outline-none w-64"
                required
              />
            )}
          </div>
        </div>

        {/* Buyer Contact */}
        <div className="bg-[#121216] border border-[#27272A] rounded-xl p-5 space-y-4">
          <h2 className="font-display font-bold text-sm uppercase tracking-wider text-[#FAFAFA]">
            3. Buyer Contact (Receives Tracking Link & 4-Digit Release OTP)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#A1A1AA] block mb-1">Buyer Name</label>
              <input
                type="text"
                value={form.buyer_name}
                onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
                placeholder="Chukwudi Okeke"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA]"
              />
            </div>
            <div>
              <label className="text-xs text-[#A1A1AA] block mb-1">Buyer Phone *</label>
              <input
                type="tel"
                value={form.buyer_phone}
                onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })}
                placeholder="08031234567"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs font-mono-tabular text-[#FAFAFA]"
                required
              />
            </div>
            <div>
              <label className="text-xs text-[#A1A1AA] block mb-1">Buyer Email (Paystack Receipt) *</label>
              <input
                type="email"
                value={form.buyer_email}
                onChange={(e) => setForm({ ...form, buyer_email: e.target.value })}
                placeholder="buyer@unizik.edu.ng"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA]"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-[#10B981] text-[#09090B] font-display font-bold text-sm uppercase tracking-wider hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Generate Shareable Confam Link</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};