import { useEffect, useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
import { adminApi } from "../../api/dealApi";
import { errMsg } from "../../api/client";
import Skeleton from "../feedback/Skeleton";
import { useToast } from "../../context/useToast";

const confirmationPhrase = "RESET DATABASE";

export default function DatabaseResetPanel() {
  const toast = useToast();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [driver, setDriver] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [backupFile, setBackupFile] = useState("");
  const [deletionSummary, setDeletionSummary] = useState<{ deals: number; accounts: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminApi.databaseResetStatus()
      .then((status) => {
        if (active) {
          setEnabled(status.enabled);
          setDriver(status.driver);
        }
      })
      .catch((cause) => {
        if (active) {
          const message = errMsg(cause, "Could not check database reset availability.");
          setError(message);
          toast.error("Reset status unavailable", message);
        }
      });
    return () => { active = false; };
  }, [toast]);

  const reset = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await adminApi.resetDatabase(password, confirmation);
      setBackupFile(result.backup_file);
      setDeletionSummary(result.deleted);
      setPassword("");
      setConfirmation("");
      toast.success("Database reset complete", result.message);
    } catch (cause) {
      const message = errMsg(cause, "The database could not be reset.");
      setError(message);
      toast.error("Database reset failed", message);
    } finally {
      setBusy(false);
    }
  };

  const downloadBackup = async () => {
    setDownloading(true);
    try {
      const contents = await adminApi.downloadDatabaseBackup(backupFile);
      const url = URL.createObjectURL(contents);
      const link = document.createElement("a");
      link.href = url;
      link.download = backupFile;
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      toast.error("Backup download failed", errMsg(cause, "The backup could not be downloaded."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="neo-card mt-8 space-y-5 rounded-2xl border border-red-500/30 p-5 sm:p-6" aria-labelledby="database-reset-title">
      <div className="flex items-start gap-3">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-red-500" />
        <div>
          <h2 id="database-reset-title" className="font-semibold">Database reset</h2>
          <p className="mt-1 text-sm text-muted">
            Creates a verified private database backup, then deletes all deals and non-admin accounts while preserving the database schema and administrator accounts.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm">
        <p className="font-semibold text-red-600 dark:text-red-400">This action cannot be undone.</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Proof videos, receipt images, and avatars in file storage are not deleted. The backup contains database data only and is stored privately on the API server.
        </p>
      </div>

      {enabled === null ? (
        <Skeleton className="h-14 rounded-xl" />
      ) : enabled ? (
        <p className="text-xs text-muted">Database driver: {driver}. A current administrator password and the exact confirmation phrase are required.</p>
      ) : (
        <p role="status" className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          Database reset is disabled in production. Enable it explicitly with <code>ADMIN_DATABASE_RESET_ENABLED=true</code> only for a controlled maintenance window.
        </p>
      )}

      <form onSubmit={reset} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reset-admin-password" className="label">Current administrator password</label>
          <input
            id="reset-admin-password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="reset-database-confirmation" className="label">Type {confirmationPhrase} to confirm</label>
          <input
            id="reset-database-confirmation"
            required
            autoComplete="off"
            className="input font-mono"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>
        {error && <p role="alert" className="text-sm text-red-500 sm:col-span-2">{error}</p>}
        <button
          type="submit"
          disabled={busy || enabled !== true || !password || confirmation !== confirmationPhrase}
          className="min-h-12 rounded-xl bg-red-600 px-4 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          {busy ? "Backing up and resetting…" : "Back up and reset application data"}
        </button>
      </form>

      {backupFile && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Backup created: {backupFile}</p>
            {deletionSummary && <p className="mt-1 text-xs text-muted">Removed {deletionSummary.deals} deals and {deletionSummary.accounts} non-admin accounts.</p>}
          </div>
          <button type="button" disabled={downloading} onClick={() => void downloadBackup()} className="btn-ghost min-h-10">
            <Download size={15} /> {downloading ? "Preparing…" : "Download backup"}
          </button>
        </div>
      )}
    </section>
  );
}
