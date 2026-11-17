import { X } from "lucide-react";
import type { Deal } from "../../../types/deal.types";
import CreateDealForm from "./CreateDealForm";

export default function CreateDealModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (deal: Deal) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid min-h-full place-items-end overflow-y-auto bg-black/60 p-3 sm:place-items-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-deal-title"
        className="card flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-b-none sm:max-h-[calc(100dvh-2rem)] sm:rounded-xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h1 id="create-deal-title" className="font-semibold">New deal</h1>
            <p className="mt-0.5 text-xs text-muted">Create a secure escrow link for your buyer.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto p-5 sm:p-6">
          <CreateDealForm
            onCreated={(deal) => {
              onCreated(deal);
              onClose();
            }}
          />
        </div>
      </section>
    </div>
  );
}
