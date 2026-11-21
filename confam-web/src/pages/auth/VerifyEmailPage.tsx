import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import { errMsg } from "../../api/client";
import { authApi } from "../../api/dealApi";
import { useToast } from "../../context/useToast";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authApi.verifyEmail(email, code);
      toast.success("Email verified", "You can now sign in to Confam.");
      navigate("/login", { replace: true });
    } catch (cause) {
      const message = errMsg(cause, "Could not verify your email.");
      setError(message);
      toast.error("Verification failed", message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      const result = await authApi.resendVerification(email);
      toast.info("Check your inbox", result.message);
    } catch (cause) {
      const message = errMsg(cause, "Could not send another verification code.");
      setError(message);
      toast.error("Code could not be sent", message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="EMAIL VERIFICATION"
      title="Verify your email."
      description="Enter the six-digit code we sent you. It expires after 10 minutes."
    >
      <form onSubmit={verify} className="neo-card space-y-5 rounded-3xl p-5 sm:p-7">
        <div>
          <label htmlFor="verify-email" className="label">Email address</label>
          <input id="verify-email" type="email" autoComplete="email" required className="input neo-inset" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div>
          <label htmlFor="verify-code" className="label">Verification code</label>
          <input id="verify-code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} className="input neo-inset font-mono-tabular tracking-[0.3em]" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
        </div>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <button disabled={busy} className="btn-primary min-h-14 w-full rounded-2xl text-base">
          {busy ? "Verifying…" : "Verify email"}
        </button>
        <button type="button" disabled={resending || !email} onClick={resend} className="btn-ghost min-h-11 w-full">
          {resending ? "Sending code…" : "Resend verification code"}
        </button>
        <p className="text-center text-sm text-muted">Already verified? <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link></p>
      </form>
    </AuthSplitLayout>
  );
}
