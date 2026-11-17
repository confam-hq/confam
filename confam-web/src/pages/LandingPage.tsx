import { Link } from "react-router-dom";
import { ArrowRight, Lock, ScanLine, Truck } from "lucide-react";

const cards = [
  { icon: Lock, title: "Micro-escrow", body: "Buyer pays into escrow. Vendor ships. Money moves only when the OTP is shared." },
  { icon: ScanLine, title: "AI proof of pack", body: "Video and waybill OCR matched by AI and fingerprinted with SHA-256." },
  { icon: Truck, title: "Motor-park tracking", body: "Drivers check in from any phone with a link. No app install." },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-16 text-center sm:py-24">
        <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400">
          Built for Nigerian social commerce
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Sell on WhatsApp.<br />Get paid with <span className="text-brand">confam.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          Create an escrow link in 20 seconds. Track the waybill. Release payment only when the goods land.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/register" className="btn-primary px-6 py-2.5">Start selling <ArrowRight size={16} /></Link>
          <Link to="/login" className="btn-ghost px-6 py-2.5">Log in</Link>
        </div>
      </section>

      <section className="grid gap-4 pb-20 md:grid-cols-3">
        {cards.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-6 transition hover:border-emerald-500/30">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-brand"><Icon size={18} /></div>
            <h3 className="mb-1.5 font-medium">{title}</h3>
            <p className="text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}