import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { authApi } from "../../../api/dealApi";
import type { VendorProfilePayload } from "../../../api/dealApi";
import { errMsg } from "../../../api/client";
import Select from "../../../components/ui/Select";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/useToast";
import type { Bank } from "../../../types/deal.types";

type ProfileForm = VendorProfilePayload;

export default function VendorProfilePage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankLoadError, setBankLoadError] = useState("");
  const [bankRequest, setBankRequest] = useState(0);
  const [form, setForm] = useState<ProfileForm>({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    bank_code: user?.bank_code ?? "",
    bank_name: user?.bank_name ?? "",
    account_number: user?.account_number ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    authApi.banks()
      .then((result) => { if (active) setBanks(result); })
      .catch((cause) => {
        if (active) {
          const message = errMsg(cause, "Could not load the bank list.");
          setBankLoadError(message);
          toast.error("Could not load banks", message);
        }
      })
      .finally(() => { if (active) setBanksLoading(false); });
    return () => { active = false; };
  }, [bankRequest, toast]);

  const bankOptions = useMemo(() => {
    const options = banks.map((bank) => ({ value: bank.code, label: bank.name }));
    if (form.bank_code && !banks.some((bank) => bank.code === form.bank_code)) {
      options.unshift({ value: form.bank_code, label: form.bank_name || form.bank_code });
    }
    return options;
  }, [banks, form.bank_code, form.bank_name]);

  const retryBanks = useCallback(() => {
    setBankLoadError("");
    setBanksLoading(true);
    setBankRequest((key) => key + 1);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedBank = bankOptions.find((bank) => bank.value === form.bank_code);
    if (!selectedBank) {
      setError("Choose a bank before saving your payout details.");
      return;
    }
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateProfile({ ...form, bank_name: selectedBank.label });
      setForm({
        name: updated.name,
        phone: updated.phone ?? "",
        bank_code: updated.bank_code ?? "",
        bank_name: updated.bank_name ?? "",
        account_number: updated.account_number ?? "",
      });
      setSaved(true);
      toast.success("Profile saved", "Your verified payout details will be used for new deals.");
    } catch (cause) {
      const message = errMsg(cause, "Could not save your profile.");
      setError(message);
      toast.error("Could not save profile", message);
    } finally {
      setBusy(false);
    }
  };

  const update = (key: keyof ProfileForm, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  };

  return (
    <div className="mx-auto max-w-3xl py-2">
      <div className="mb-6">
        <p className="label">Vendor workspace</p>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-muted">Keep your contact and verified payout details up to date.</p>
      </div>

      <form onSubmit={submit} className="neo-card space-y-5 rounded-2xl p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-name" className="label">Full name</label>
            <input id="profile-name" required maxLength={120} autoComplete="name" className="input" value={form.name} onChange={(event) => update("name", event.target.value)} />
          </div>
          <div>
            <label htmlFor="profile-phone" className="label">Phone</label>
            <input id="profile-phone" required maxLength={20} autoComplete="tel" inputMode="tel" className="input" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="profile-email" className="label">Account email</label>
            <input id="profile-email" readOnly className="input cursor-not-allowed opacity-70" value={user?.email ?? ""} />
            <p className="mt-1 text-xs text-muted">Email is your sign-in and deal identity, so it cannot be changed here.</p>
          </div>
        </div>

        <section className="space-y-4 border-t border-line pt-5">
          <div>
            <h2 className="font-semibold">Payout account</h2>
            <p className="mt-1 text-xs text-muted">The account is verified when you save. Changes apply to new deals; existing deals keep their saved payout destination.</p>
          </div>
          <div>
            <p className="label">Bank</p>
            <Select
              searchable
              loading={banksLoading}
              value={form.bank_code}
              onChange={(bank_code) => {
                const bank = bankOptions.find((option) => option.value === bank_code);
                setForm((previous) => ({ ...previous, bank_code, bank_name: bank?.label ?? "" }));
                setSaved(false);
              }}
              options={bankOptions}
              placeholder="Choose your bank"
            />
            {bankLoadError && (
              <button type="button" onClick={retryBanks} className="mt-2 flex items-center gap-1.5 text-xs text-red-500 hover:underline">
                <RefreshCw size={12} /> {bankLoadError} Retry
              </button>
            )}
          </div>
          <div>
            <label htmlFor="profile-account-number" className="label">10-digit account number</label>
            <input
              id="profile-account-number"
              required
              minLength={10}
              maxLength={10}
              inputMode="numeric"
              autoComplete="off"
              className="input font-mono-tabular"
              value={form.account_number}
              onChange={(event) => update("account_number", event.target.value.replace(/\D/g, ""))}
            />
          </div>
          {user?.account_name && (
            <div className="flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-sm">
              <ShieldCheck size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span><span className="text-muted">Saved verified account name: </span>{user.account_name}</span>
            </div>
          )}
        </section>

        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        {saved && <p role="status" className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={16} /> Profile and payout details saved.</p>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/dashboard/vendor/settings" className="text-sm text-brand hover:underline">Go to settings</Link>
          <button disabled={busy} className="btn-primary min-h-12 w-full sm:w-auto">
            {busy ? "Saving profile…" : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
