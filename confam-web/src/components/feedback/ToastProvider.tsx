import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { ToastContext } from "../../context/toastContext";
import type { ToastKind } from "../../context/toastContext";

interface ToastMessage {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

function ToastCard({ toast, dismiss }: { toast: ToastMessage; dismiss: (id: number) => void }) {
  const Icon = toast.kind === "success" ? CheckCircle2 : toast.kind === "error" ? AlertCircle : Info;

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), toast.kind === "error" ? 8000 : 6000);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.id, toast.kind]);

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      className="neo-card flex items-start gap-3 rounded-xl border border-line p-4 shadow-xl"
    >
      <Icon
        size={18}
        className={`mt-0.5 shrink-0 ${
          toast.kind === "success"
            ? "text-emerald-600 dark:text-emerald-400"
            : toast.kind === "error"
              ? "text-red-500"
              : "text-brand"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="mt-1 text-xs leading-5 text-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const nextId = useRef(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const push = useCallback((kind: ToastKind, title: string, description?: string) => {
    const toast = { id: ++nextId.current, kind, title, description };
    setToasts((current) => [...current, toast].slice(-4));
  }, []);
  const success = useCallback((title: string, description?: string) => push("success", title, description), [push]);
  const error = useCallback((title: string, description?: string) => push("error", title, description), [push]);
  const info = useCallback((title: string, description?: string) => push("info", title, description), [push]);
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const value = useMemo(() => ({ success, error, info }), [success, error, info]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="fixed right-4 top-20 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => <ToastCard key={toast.id} toast={toast} dismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}
