import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import ConfamLogo from "../layout/ConfamLogo";

export default function AuthSplitLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 p-4 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:p-8">
        <aside className="neo-card relative hidden overflow-hidden rounded-[32px] p-8 lg:flex lg:min-h-[calc(100vh-4rem)] lg:flex-col lg:justify-between xl:p-12">
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
          <Link to="/" className="relative w-fit" aria-label="Confam home">
            <ConfamLogo size={38} />
          </Link>

          <div className="relative max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck size={14} /> Escrow with clear next steps
            </div>
            <h2 className="text-4xl font-semibold leading-tight xl:text-5xl">
              Trade with confidence. Confirm every step.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">
              Keep payment, packing proof, waybill details, and delivery decisions together in one calm workspace.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted">
              <li className="flex items-center gap-3"><Check size={16} className="text-brand" /> Buyers confirm delivery or open a dispute.</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-brand" /> Vendors see the 5% fee before they create a deal.</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-brand" /> Disputed funds stay held for admin review.</li>
            </ul>
          </div>

          <div className="relative flex items-center justify-between border-t border-line pt-5 text-xs text-muted">
            <span>Secure social-commerce escrow</span>
            <span className="font-mono-tabular">NGN</span>
          </div>
        </aside>

        <section className="flex min-w-0 items-center justify-center py-4 sm:py-8">
          <div className="w-full max-w-xl">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link to="/" aria-label="Confam home"><ConfamLogo size={34} /></Link>
              <Link to="/" className="btn-ghost min-h-10 px-3 text-xs">Back to home <ArrowUpRight size={14} /></Link>
            </div>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted">{description}</p>
            </div>
            {children}
            <nav aria-label="Legal information" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
              <Link to="/terms" className="hover:text-brand">Terms</Link>
              <Link to="/privacy" className="hover:text-brand">Privacy</Link>
              <Link to="/cookies" className="hover:text-brand">Cookies</Link>
            </nav>
          </div>
        </section>
      </div>
    </main>
  );
}
