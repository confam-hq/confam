import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { errMsg } from "../../api/client";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";

export default function SessionLockScreen() {
  const { user, unlock, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await unlock(password);
      toast.success("Welcome back", "Your session is unlocked.");
    } catch (cause) {
      const message = errMsg(cause, "Could not unlock your session.");
      setError(message);
      toast.error("Incorrect password", message);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    try {
      await logout();
    } catch (cause) {
      toast.error("Session ended locally", errMsg(cause, "The server could not revoke the session."));
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-4">
      <section className="neo-card w-full max-w-md space-y-6 rounded-3xl p-6 text-center sm:p-8">
        <div className="mx-auto grid size-20 place-items-center overflow-hidden rounded-full bg-surface-2 text-2xl font-semibold text-muted">
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" className="size-full object-cover" />
            : user.name.trim().charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="label">Confam session</p>
          <h1 className="mt-2 text-2xl font-semibold">Welcome back, {user.name}</h1>
          <p className="mt-2 text-sm text-muted">Enter your password to unlock your dashboard.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 text-left">
          <div>
            <label htmlFor="session-password" className="label">Password</label>
            <input
              id="session-password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              className="input neo-inset"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <button disabled={busy} className="btn-primary min-h-12 w-full">
            {busy ? "Unlocking…" : "Unlock dashboard"}
          </button>
        </form>
        <button type="button" onClick={() => void signOut()} className="text-sm font-semibold text-muted hover:text-ink">
          Not you? Sign out
        </button>
      </section>
    </main>
  );
}
