import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" className="card w-full max-w-md rounded-3xl p-5 shadow-2xl pop-in sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${danger ? "bg-red-500/10 text-red-500" : "bg-brand/10 text-brand"}`}>
            <AlertTriangle size={20} />
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-ghost h-10 w-10 p-0"><X size={16} /></button>
        </div>
        <h2 id="confirm-modal-title" className="mt-5 text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={danger
              ? "min-h-11 flex-1 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              : "btn-primary flex-1"}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
