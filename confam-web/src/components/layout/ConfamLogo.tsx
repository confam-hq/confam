import logo from "../../assets/logo.png";

// If your logo.png already contains the "confam." wordmark, use <ConfamLogo withText={false} />
export default function ConfamLogo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src={logo} alt="Confam" style={{ height: size, width: "auto" }} className="object-contain" />
      {withText && (
        <span className="text-lg font-semibold tracking-tight text-ink">
          confam<span className="text-brand">.</span>
        </span>
      )}
    </span>
  );
}