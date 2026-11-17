export default function ConfamLogo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <path d="M16 2l11.5 6.5v13L16 28 4.5 21.5v-13L16 2z" fill="#10B981" />
        <path d="M10.5 16.2l3.7 3.7 7.3-7.6" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {withText && (
        <span className="text-lg font-semibold tracking-tight text-ink">
          confam<span className="text-brand">.</span>
        </span>
      )}
    </span>
  );
}