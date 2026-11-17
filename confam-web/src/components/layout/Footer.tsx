import ConfamLogo from "./ConfamLogo";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center">
        <ConfamLogo size={26} />
        <p>Secure escrow for social commerce. Payments powered by Paystack.</p>
        <p>© {new Date().getFullYear()} Confam</p>
      </div>
    </footer>
  );
}