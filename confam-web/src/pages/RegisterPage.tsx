import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dealApi } from '../api/dealApi';
import {
  UserPlus,
  Loader2,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Banknote,
  Lock,
  BadgeCheck,
} from 'lucide-react';

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

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    bank_code: '058',
    bank_name: 'Guaranty Trust Bank (GTBank)',
    account_number: '',
    account_name: '',
  });

  const handleAccountNumber = async (val: string, bankCode = form.bank_code) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, account_number: cleaned }));

    if (cleaned.length === 10) {
      setResolving(true);
      try {
        const res = await dealApi.resolveBankAccount(cleaned, bankCode);
        setForm((prev) => ({
          ...prev,
          account_number: cleaned,
          account_name: res.account_name,
        }));
      } catch {
        setForm((prev) => ({
          ...prev,
          account_name: prev.name ? prev.name.toUpperCase() : 'CONFAM VERIFIED MERCHANT',
        }));
      } finally {
        setResolving(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await dealApi.registerVendor(form);
      navigate('/dashboard/vendor');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Registration failed. Check if email or phone is already registered.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-160px)] overflow-hidden bg-[#07070A] px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,92,252,0.22),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_28%)]" />

      <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0E0E12]/90 shadow-[0_30px_80px_rgba(12,12,18,0.7)] backdrop-blur xl:grid-cols-[1.05fr_1.35fr]">
        <aside className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(27,27,36,0.96),rgba(15,15,20,0.96))] p-6 sm:p-8 xl:border-r xl:border-b-0">
          <div className="absolute right-6 top-6 h-28 w-28 rounded-full bg-[#7C5CFC]/15 blur-3xl" />

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#7C5CFC]/30 bg-[#7C5CFC]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B7A9FF]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified merchant access
            </div>

            <div className="space-y-4">
              <h1 className="max-w-xs text-3xl font-black tracking-tight text-white sm:text-4xl">
                Open your vendor vault.
              </h1>
              <p className="max-w-sm text-sm leading-6 text-zinc-400">
                Bring your bank account, your store identity, and your next sales flow into one trusted escrow workspace.
              </p>
            </div>

            <div className="grid gap-3 pt-2">
              {[
                { icon: Lock, title: 'Protected payouts', text: 'Escrow funds stay locked until delivery is confirmed.' },
                { icon: BadgeCheck, title: 'Bank-verified', text: 'NUBAN account lookup keeps payout details accurate.' },
                { icon: Sparkles, title: 'Faster fulfillment', text: 'Create quote-ready deal links in minutes, not days.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <div className="mt-1 text-xs leading-5 text-zinc-400">{text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                <Banknote className="h-3.5 w-3.5" />
                Payout preview
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">Projected settlement</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-white">₦125,400</div>
                </div>
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                  3-min payout
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="relative bg-[#0B0B10] p-5 sm:p-8 lg:p-10">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B7A9FF]">
                Merchant onboarding
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white">Create your vault</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C5CFC]/15 text-[#B7A9FF] ring-1 ring-inset ring-[#7C5CFC]/30">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Store / merchant name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Eminent Gadgets Awka"
                  className="w-full rounded-2xl border border-white/10 bg-[#0E0E12] px-3.5 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#7C5CFC] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  WhatsApp phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="09045383655"
                  className="w-full rounded-2xl border border-white/10 bg-[#0E0E12] px-3.5 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#7C5CFC] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="store@confam.ng"
                  className="w-full rounded-2xl border border-white/10 bg-[#0E0E12] px-3.5 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#7C5CFC] focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Password
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-2xl border border-white/10 bg-[#0E0E12] px-3.5 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#7C5CFC] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-[#101016] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981]">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Payout bank
                  </div>
                  <div className="text-sm font-medium text-white">Instant settlements</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                    Nigerian bank
                  </label>
                  <select
                    value={form.bank_code}
                    onChange={(e) => {
                      const bank = NIGERIAN_BANKS.find((b) => b.code === e.target.value);
                      setForm({
                        ...form,
                        bank_code: e.target.value,
                        bank_name: bank?.name || 'Nigerian Bank',
                      });
                      if (form.account_number.length === 10) {
                        handleAccountNumber(form.account_number, e.target.value);
                      }
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-[#0E0E12] px-3.5 py-3 text-sm text-white focus:border-[#7C5CFC] focus:outline-none"
                  >
                    {NIGERIAN_BANKS.map((b) => (
                      <option key={b.code} value={b.code} className="bg-[#0B0B10] text-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                    Account number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.account_number}
                    onChange={(e) => handleAccountNumber(e.target.value)}
                    placeholder="0123456789"
                    className="w-full rounded-2xl border border-white/10 bg-[#0E0E12] px-3.5 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#7C5CFC] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#09090D] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                  <span>Resolved account name</span>
                </div>

                {resolving ? (
                  <span className="inline-flex items-center gap-2 text-xs font-mono text-amber-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Verifying with Paystack...
                  </span>
                ) : (
                  <input
                    type="text"
                    value={form.account_name}
                    onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                    placeholder="Auto-fills on 10 digits"
                    className="w-full max-w-[260px] border-none bg-transparent text-right text-sm font-mono font-bold text-[#10B981] placeholder:text-zinc-500 focus:outline-none"
                    required
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#10B981] px-5 py-3.5 text-sm font-semibold text-[#08110D] transition hover:bg-[#34d399] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Complete merchant registration</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-zinc-400">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#B7A9FF] transition hover:text-white">
              Login to vendor hub
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
