import { useCallback, useEffect, useState } from "react";
import { Monitor, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/dealApi";
import type { AuthSession } from "../../api/dealApi";
import { errMsg } from "../../api/client";
import LoadingScreen from "../../components/feedback/LoadingScreen";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";

export default function SessionsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await authApi.sessions();
      setSessions(result.sessions);
      setCurrentId(result.current_token_id);
    } catch (cause) {
      const message = errMsg(cause, "Could not load your sessions.");
      setError(message);
      toast.error("Sessions could not be loaded", message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const revoke = async (session: AuthSession) => {
    setRevoking(session.id);
    try {
      if (session.id === currentId) {
        await authApi.revokeSession(session.id);
        await logout(false);
        toast.info("Session ended", "Sign in again to continue.");
        navigate("/login", { replace: true });
        return;
      }

      await authApi.revokeSession(session.id);
      toast.success("Session revoked", "That device has been signed out.");
      await load();
    } catch (cause) {
      toast.error("Could not revoke session", errMsg(cause, "Try again."));
    } finally {
      setRevoking(null);
    }
  };

  if (loading) return <LoadingScreen compact label="Loading your sessions" />;

  return (
    <div className="mx-auto max-w-4xl py-2">
      <div className="mb-6">
        <p className="label">Account security</p>
        <h1 className="text-xl font-semibold">Active sessions</h1>
        <p className="mt-1 text-sm text-muted">Review devices signed in to your Confam account and revoke any you don’t recognize.</p>
      </div>
      {error ? (
        <div role="alert" className="neo-card rounded-2xl p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button type="button" onClick={() => void load()} className="btn-ghost mt-4">Try again</button>
        </div>
      ) : sessions.length ? (
        <ul className="space-y-3">
          {sessions.map((session) => {
            const current = session.id === currentId;
            return (
              <li key={session.id} className="neo-card flex flex-wrap items-center gap-4 rounded-2xl p-4 sm:p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2">
                  {current ? <ShieldCheck size={19} className="text-brand" /> : <Monitor size={19} className="text-muted" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{session.name}{current && <span className="ml-2 text-xs text-brand">This device</span>}</p>
                  <p className="mt-1 text-xs text-muted">
                    Signed in {new Date(session.created_at).toLocaleString()}
                    {session.last_used_at && ` · Last active ${new Date(session.last_used_at).toLocaleString()}`}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={revoking === session.id}
                  onClick={() => void revoke(session)}
                  aria-label={`Revoke ${session.name} session`}
                  className="btn-ghost min-h-10"
                >
                  <X size={15} /> {revoking === session.id ? "Revoking…" : "Revoke"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="neo-card rounded-2xl p-6 text-sm text-muted">No active sessions were found.</div>
      )}
    </div>
  );
}
