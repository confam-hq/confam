import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, homeFor } from "../context/AuthContext";
import { errMsg } from "../api/client";
import ConfamLogo from "../components/layout/ConfamLogo";

// Set these to a seeded demo account on your Laravel backend
const DEMO = { email: "demo@confam.ng", password: "password" };

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const go = async (e: string, p: string) => {
    setBusy(true);
    setErr("");
    try {
      const u = await login(e, p);
      nav(loc.state?.from || homeFor(u.role), { replace: true });
    } catch (x) {
      setErr(errMsg(x, "Invalid credentials"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-md px-4 py-12 sm:py-20">
      <div className="mb-6 flex justify-center"><ConfamLogo size={36} /></div>
      <form onSubmit={(e) => { e.preventDefault(); go(email, password); }} className="card space-y-4 p-6">
        <h1 className="text-lg font-semibold">Welcome back</h1>
        <div>
          <label className="label">Email</label>
          <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? "Signing in…" : "Log in"}</button>
        <button type="button" disabled={busy} onClick={() => go(DEMO.email, DEMO.password)} className="btn-ghost w-full">
          1-click demo login
        </button>
        <p className="text-center text-xs text-muted">
          New merchant? <Link to="/register" className="text-brand hover:underline">Create account</Link>
        </p>
      </form>
    </div>
  );
}