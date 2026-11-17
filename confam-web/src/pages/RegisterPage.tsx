import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth, homeFor } from "../context/AuthContext";
import { authApi } from "../api/dealApi";
import { errMsg } from "../api/client";
import type { Bank } from "../types/deal.types";

const FALLBACK_BANKS: Bank[] = [
  { code: "058", name: "GTBank" }, { code: "044", name: "Access Bank" }, { code: "057", name: "Zenith Bank" },
  { code: "033", name: "UBA" }, { code: "011", name: "First Bank" }, { code: "50211", name: "Kuda" },
  { code: "999992", name: "OPay" }, { code: "50515", name: "Moniepoint" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [banks, setBanks] = useState<Bank[]>(FALLBACK_BANKS);
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", bank_code: "", account_number: "" });
  const [acctName, setAcctName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => { authApi.banks().then((b) => b?.length && setBanks(b)).catch(() => {}); }, []);

  useEffect(() => {
    setAcctName("");
    if (f.account_number.length === 10 && f.bank_code) {
      setResolving(true);
      authApi
        .resolveBank(f.account_number, f.bank_code)
        .then((r) => setAcctName(r.account_name))
        .catch(() => setErr("Could not resolve account"))
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
      <form onSubmit={submit} className="card space-y-4 p-6">
        <h1 className="text-lg font-semibold">Create merchant account</h1>
        <div><label className="label">Full name</label><input required className="input" value={f.name} onChange={set("name")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Email</label><input type="email" required className="input" value={f.email} onChange={set("email")} /></div>
          <div><label className="label">Phone</label><input required className="input" inputMode="tel" value={f.phone} onChange={set("phone")} /></div>
        </div>
        <div><label className="label">Password</label><input type="password" minLength={8} required className="input" value={f.password} onChange={set("password")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Bank</label>
            <select required className="input" value={f.bank_code} onChange={set("bank_code")}>
              <option value="">Select bank</option>
              {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Account number</label>
            <input required maxLength={10} inputMode="numeric" className="input font-mono-tabular" value={f.account_number}
              onChange={(e) => setF((p) => ({ ...p, account_number: e.target.value.replace(/\D/g, "") }))} />
          </div>
        </div>
        {resolving && <p className="text-xs text-muted">Resolving account…</p>}
        {acctName && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} /> {acctName}
          </p>
        )}
        {err && <p className="text-xs text-red-500">{err}</p>}
        <button disabled={busy || !acctName} className="btn-primary w-full">{busy ? "Creating…" : "Create account"}</button>
        <p className="text-center text-xs text-muted">
          Have an account? <Link to="/login" className="text-brand hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}