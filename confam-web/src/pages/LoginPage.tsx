import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, homeFor } from "../context/AuthContext";
import { errMsg } from "../api/client";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import { useToast } from "../context/useToast";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toast = useToast();

  const go = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const user = await login(email, password);
      toast.success("Signed in", "Your Confam workspace is ready.");
      const destination = (loc.state as { from?: string } | null)?.from;
      nav(destination || homeFor(user.role), { replace: true });
    } catch (error) {
      const message = errMsg(error, "Invalid email or password.");
      setErr(message);
      toast.error("Sign-in failed", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplitLayout
      eyebrow="WELCOME BACK"
      title="Sign in to Confam."
      description="Pick up where you left off and see what needs your attention."
    >
      <form onSubmit={go} className="neo-card space-y-5 rounded-3xl p-5 sm:p-7">
        <div>
          <label htmlFor="login-email" className="label">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            className="input neo-inset"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="label">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            className="input neo-inset"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
        <button disabled={busy} className="btn-primary min-h-14 w-full rounded-2xl text-base">
          {busy ? "Signing in…" : "Continue to your workspace"}
        </button>
        <p className="text-center text-sm text-muted">
          New to Confam? <Link to="/register" className="font-semibold text-brand hover:underline">Create a buyer or vendor account</Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
