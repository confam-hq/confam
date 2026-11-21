import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, RefreshCw, ShoppingBag, Store } from "lucide-react";
import { useAuth, homeFor } from "../context/AuthContext";
import { authApi } from "../api/dealApi";
import { errMsg } from "../api/client";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import Select from "../components/ui/Select";
import { useToast } from "../context/useToast";
import type { Bank } from "../types/deal.types";

type AccountRole = "buyer" | "vendor";
type FormValues = {
  role: AccountRole;
  name: string;
  email: string;
  phone: string;
  password: string;
  bank_code: string;
  account_number: string;
};

const initialForm: FormValues = {
  role: "vendor",
  name: "",
  email: "",
  phone: "",
  password: "",
  bank_code: "",
  account_number: "",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksErr, setBanksErr] = useState(false);
  const [bankRequest, setBankRequest] = useState(0);
  const [f, setF] = useState(initialForm);
  const [resolved, setResolved] = useState<{ account_number: string; bank_code: string; account_name: string } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toast = useToast();

  const set = (key: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setF((previous) => ({ ...previous, [key]: event.target.value }));
    if (key === "account_number") {
      setResolved(null);
      setResolving(false);
    }
  };

  const loadBanks = useCallback(() => {
    setBanksLoading(true);
    setBanksErr(false);
    setBankRequest((previous) => previous + 1);
  }, []);
  useEffect(() => {
    let active = true;
    authApi.banks()
      .then((result) => { if (active) setBanks(result); })
      .catch(() => { if (active) setBanksErr(true); })
      .finally(() => { if (active) setBanksLoading(false); });
    return () => { active = false; };
  }, [bankRequest]);

  const bankOptions = useMemo(() => banks.map((bank) => ({ value: bank.code, label: bank.name })), [banks]);
  const accountName = resolved?.account_number === f.account_number && resolved.bank_code === f.bank_code
    ? resolved.account_name
    : "";

  useEffect(() => {
    if (f.role !== "vendor" || f.account_number.length !== 10 || !f.bank_code) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setResolving(true);
      authApi.resolveBank(f.account_number, f.bank_code)
        .then((result) => {
          if (active) setResolved({ account_number: f.account_number, bank_code: f.bank_code, account_name: result.account_name });
        })
        .catch(() => {
          if (active) setErr("Could not resolve this account. Check the number and bank.");
        })
        .finally(() => {
          if (active) setResolving(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [f.account_number, f.bank_code, f.role]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErr("");
    try {
      if (f.role === "vendor" && !accountName) {
        throw new Error("Verify your payout account before creating a vendor account.");
      }
      const user = await register({
        ...f,
        account_name: f.role === "vendor" ? accountName : "",
      });
      toast.success("Account created", "Welcome to Confam.");
      nav(homeFor(user.role), { replace: true });
    } catch (error) {
      const message = errMsg(error);
      setErr(message);
      toast.error("Account could not be created", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="CREATE YOUR ACCOUNT"
      title="Make your next deal feel safer."
      description="Choose the workspace that fits you. You can create a buyer account or a vendor account."
    >
      <form onSubmit={submit} className="neo-card space-y-5 rounded-3xl p-5 sm:p-7">
        <fieldset>
          <legend className="label">I’m joining as a</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { role: "vendor", label: "Vendor", detail: "Create deals and receive payouts", Icon: Store },
              { role: "buyer", label: "Buyer", detail: "Track purchases and confirm delivery", Icon: ShoppingBag },
            ] as const).map(({ role, label, detail, Icon }) => (
              <button
                key={role}
                type="button"
                aria-pressed={f.role === role}
                onClick={() => {
                  setF((previous) => ({
                    ...previous,
                    role,
                    ...(role === "buyer" ? { bank_code: "", account_number: "" } : {}),
                  }));
                  setResolved(null);
                  setResolving(false);
                  setErr("");
                }}
                className={`neo-card flex min-h-20 items-center gap-3 rounded-2xl p-4 text-left transition ${
                  f.role === role ? "border-brand ring-1 ring-brand" : "hover:-translate-y-0.5"
                }`}
              >
                <Icon size={20} className={f.role === role ? "text-brand" : "text-muted"} />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-1 block text-xs text-muted">{detail}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="register-name" className="label">Full name</label>
          <input id="register-name" autoComplete="name" required maxLength={120} className="input neo-inset" value={f.name} onChange={set("name")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="register-email" className="label">Email</label>
            <input id="register-email" type="email" autoComplete="email" required className="input neo-inset" value={f.email} onChange={set("email")} />
          </div>
          <div>
            <label htmlFor="register-phone" className="label">Phone</label>
            <input id="register-phone" autoComplete="tel" required inputMode="tel" className="input neo-inset" value={f.phone} onChange={set("phone")} />
          </div>
        </div>
        <div>
          <label htmlFor="register-password" className="label">Password</label>
          <input id="register-password" type="password" autoComplete="new-password" minLength={8} required className="input neo-inset" value={f.password} onChange={set("password")} />
        </div>

        {f.role === "buyer" ? (
          <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm">
            <p className="font-semibold">Use the same email as your purchase</p>
            <p className="mt-1 text-xs leading-5 text-muted">Confam links your buyer dashboard to deals addressed to this email. You can add payout details later if you also sell.</p>
          </div>
        ) : (
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Vendor payout details</h2>
              <p className="mt-1 text-xs text-muted">Payouts go to this verified account. Confam withholds 5% of item + delivery proceeds after successful delivery.</p>
            </div>
            <div>
              <label htmlFor="register-bank" className="label">Bank</label>
              <Select
                searchable
                loading={banksLoading}
                value={f.bank_code}
                onChange={(bank_code) => {
                  setF((previous) => ({ ...previous, bank_code }));
                  setResolved(null);
                  setResolving(false);
                }}
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
              <label htmlFor="register-account" className="label">Account number</label>
              <input
                id="register-account"
                required
                maxLength={10}
                inputMode="numeric"
                placeholder="10-digit NUBAN"
                className="input neo-inset font-mono-tabular"
                value={f.account_number}
                onChange={(event) => {
                  setF((previous) => ({ ...previous, account_number: event.target.value.replace(/\D/g, "") }));
                  setResolved(null);
                  setResolving(false);
                }}
              />
            </div>
            {resolving && <p className="flex items-center gap-2 text-xs text-muted"><Loader2 size={12} className="animate-spin" /> Verifying account…</p>}
            {accountName && (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} /> {accountName}
              </p>
            )}
          </section>
        )}

        {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
        <button disabled={busy || (f.role === "vendor" && !accountName)} className="btn-primary min-h-14 w-full rounded-2xl text-base">
          {busy ? "Creating account…" : `Create ${f.role} account`}
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account? <Link to="/login" className="font-semibold text-brand hover:underline">Log in</Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
