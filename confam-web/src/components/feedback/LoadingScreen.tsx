import AnimatedLogo from "./AnimatedLogo";

export default function LoadingScreen({
  label = "Loading your Confam workspace",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`neo-card flex flex-col items-center justify-center gap-4 rounded-3xl px-6 text-center ${
        compact ? "min-h-56 py-10" : "min-h-[65vh] py-16"
      }`}
    >
      <div className="relative grid size-24 place-items-center rounded-[28px] bg-surface-2/70">
        <span aria-hidden="true" className="absolute inset-0 rounded-[28px] border border-brand/20 loading-orbit" />
        <AnimatedLogo size={54} />
      </div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-xs text-muted">Getting everything ready…</p>
      </div>
      <div aria-hidden="true" className="loading-track w-40">
        <span className="loading-sweep" />
      </div>
    </div>
  );
}
