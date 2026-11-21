import ConfamLogo from "./ConfamLogo";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <ConfamLogo size={26} />
        <p>5% vendor fee applies to new deals only and is withheld at settlement. Payments powered by Paystack.</p>
        <nav aria-label="Legal links" className="flex flex-wrap gap-4">
          <Link to="/faq" className="hover:text-brand">FAQ</Link>
          <Link to="/terms" className="hover:text-brand">Terms</Link>
          <Link to="/privacy" className="hover:text-brand">Privacy</Link>
          <Link to="/cookies" className="hover:text-brand">Cookies</Link>
        </nav>
        <p>© {new Date().getFullYear()} Confam</p>
      </div>
    </footer>
  );
}