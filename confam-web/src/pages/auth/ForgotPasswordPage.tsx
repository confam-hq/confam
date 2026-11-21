import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import { errMsg } from "../../api/client";
import { authApi } from "../../api/dealApi";
import { useToast } from "../../context/useToast";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await authApi.forgotPassword(email);
      toast.info("Check your inbox", result.message);
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (cause) {
      const message = errMsg(cause, "Could not request a password reset.");
      setError(message);
      toast.error("Reset code could not be sent", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="ACCOUNT RECOVERY"
      title="Forgot your password?"
      description="We’ll send a six-digit reset code to your email address."
    >
      <form onSubmit={submit} className="neo-card space-y-5 rounded-3xl p-5 sm:p-7">
        <div>
          <label htmlFor="forgot-email" className="label">Email address</label>
          <input id="forgot-email" type="email" autoComplete="email" required className="input neo-inset" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <button disabled={busy} className="btn-primary min-h-14 w-full rounded-2xl text-base">
          {busy ? "Sending code…" : "Send reset code"}
        </button>
        <p className="text-center text-sm text-muted"><Link to="/login" className="font-semibold text-brand hover:underline">Back to sign in</Link></p>
      </form>
    </AuthSplitLayout>
  );
}
