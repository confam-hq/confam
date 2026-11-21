import Skeleton from "./Skeleton";

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
      aria-label={label}
      className={`mx-auto w-full max-w-7xl space-y-5 rounded-2xl ${
        compact ? "py-4" : "py-8"
      }`}
    >
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="hidden h-28 rounded-2xl xl:block" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
