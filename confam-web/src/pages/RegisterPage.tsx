import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useAuth, homeFor } from "../context/AuthContext";
import { authApi } from "../api/dealApi";
import { errMsg } from "../api/client";
import ConfamLogo from "../components/layout/ConfamLogo";
import Select from "../components/ui/Select";
import type { Bank } from "../types/deal.types";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksErr, setBanksErr] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", bank_code: "", account_number: "" });
  const [acctName, setAcctName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const loadBanks = useCallback(() => {
    setBanksLoading(true);
    setBanksErr(false);
    authApi.banks().then(setBanks).catch(() => setBanksErr(true)).finally(() => setBanksLoading(false));
  }, []);
  useEffect(loadBanks, [loadBanks]);

  const bankOptions = useMemo(() => banks.map((b) => ({ value: b.code, label: b.name })), [banks]);

  useEffect(() => {
    setAcctName("");
    setErr("");
    if (f.account_number.length === 10 && f.bank_code) {
      setResolving(true);
      authApi
        .resolveBank(f.account_number, f.bank_code)
        .then((r) => setAcctName(r.account_name))
        .catch(() => setErr("Could not resolve this account. Check the number and bank."))
        .finally(() => setResolving(false));
    }
  }, [f.account_number, f.bank_code]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const u = await register({ ...f, role: "vendor", account_name: acctName });
      nav(homeFor(u.role), { replace: true });
    } catch (x) {
      setErr(errMsg(x));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="mb-6 flex justify-center"><ConfamLogo size={44} /></div>
      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <h1 className="text-xl font-semibold">Create merchant account</h1>
          <p className="mt-1 text-xs text-muted">Payouts go straight to your bank account.</p>
        </div>
        <div><label className="label">Full name</label><input required className="input" value={f.name} onChange={set("name")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Email</label><input type="email" required className="input" value={f.email} onChange={set("email")} /></div>
          <div><label className="label">Phone</label><input required inputMode="tel" className="input" value={f.phone} onChange={set("phone")} /></div>
        </div>
        <div><label className="label">Password</label><input type="password" minLength={8} required className="input" value={f.password} onChange={set("password")} /></div>

        <div>
          <label className="label">Bank</label>
          <Select
            searchable
            loading={banksLoading}
            value={f.bank_code}
            onChange={(v) => setF((p) => ({ ...p, bank_code: v }))}
            options={bankOptions}
            placeholder="Choose your bank"
          />
          {banksErr && (
            <button type="button" onClick={loadBanks} className="mt-2 flex items-center gap-1.5 text-xs text-red-500 hover:underline">
              <RefreshCw size={12} /> Couldn't load banks. Tap to retry
            </button>
          )}
        </div>

        <div>
          <label className="label">Account number</label>
          <input
            required
            maxLength={10}
            inputMode="numeric"
            placeholder="10-digit NUBAN"
            className="input font-mono-tabular"
            value={f.account_number}
            onChange={(e) => setF((p) => ({ ...p, account_number: e.target.value.replace(/\D/g, "") }))}
          />
        </div>

        {resolving && <p className="flex items-center gap-2 text-xs text-muted"><Loader2 size={12} className="animate-spin" /> Verifying account…</p>}
        {acctName && (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} /> {acctName}
          </p>
        )}
        {err && <p className="text-xs text-red-500">{err}</p>}

        <button disabled={busy || !acctName} className="btn-primary w-full py-2.5">{busy ? "Creating…" : "Create account"}</button>
        <p className="text-center text-xs text-muted">
          Have an account? <Link to="/login" className="font-medium text-brand hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}