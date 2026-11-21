import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import { errMsg } from "../../api/client";
import { authApi } from "../../api/dealApi";
import { useToast } from "../../context/useToast";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await authApi.resetPassword(email, code, password, confirmation);
      toast.success("Password reset", result.message);
      navigate("/login", { replace: true });
    } catch (cause) {
      const message = errMsg(cause, "Could not reset your password.");
      setError(message);
      toast.error("Password could not be reset", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="ACCOUNT RECOVERY"
      title="Choose a new password."
      description="Enter the code from your email and create a new password."
    >
      <form onSubmit={submit} className="neo-card space-y-5 rounded-3xl p-5 sm:p-7">
        <div>
          <label htmlFor="reset-email" className="label">Email address</label>
          <input id="reset-email" type="email" autoComplete="email" required className="input neo-inset" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div>
          <label htmlFor="reset-code" className="label">Reset code</label>
          <input id="reset-code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} className="input neo-inset font-mono-tabular tracking-[0.3em]" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
        </div>
        <div>
          <label htmlFor="reset-password" className="label">New password</label>
          <input id="reset-password" type="password" autoComplete="new-password" minLength={8} required className="input neo-inset" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <div>
          <label htmlFor="reset-confirmation" className="label">Confirm new password</label>
          <input id="reset-confirmation" type="password" autoComplete="new-password" minLength={8} required className="input neo-inset" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <button disabled={busy} className="btn-primary min-h-14 w-full rounded-2xl text-base">
          {busy ? "Resetting password…" : "Reset password"}
        </button>
        <p className="text-center text-sm text-muted"><Link to="/forgot-password" className="font-semibold text-brand hover:underline">Request another code</Link></p>
      </form>
    </AuthSplitLayout>
  );
}
