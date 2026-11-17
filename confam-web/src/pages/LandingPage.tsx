import { Link } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, CheckCircle2, KeyRound, Link2, Lock, MapPin,
  Play, ScanLine, ShieldCheck, Smartphone, Truck, Video,
} from "lucide-react";

/* ---------- Hero visual (all built in code, no image files needed) ---------- */
function HeroVisual() {
  return (
    <div className="relative mx-auto mt-14 w-full max-w-5xl sm:mt-20">
      <div className="pointer-events-none absolute inset-x-0 top-10 -z-10 mx-auto h-72 max-w-3xl rounded-full bg-emerald-500/20 blur-[100px]" />

      <div className="relative mx-auto max-w-md md:max-w-none md:h-[480px]">
        {/* Center: deal room */}
        <div className="card relative z-10 mx-auto w-full max-w-sm overflow-hidden shadow-2xl shadow-emerald-500/10 md:absolute md:left-1/2 md:top-0 md:-translate-x-1/2">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="font-mono-tabular text-[11px] text-muted">CF-8H2K9X</p>
              <p className="text-sm font-medium">iPhone 13 Pro, 256GB</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Lock size={10} /> Escrow Locked
            </span>
          </div>
          <div className="space-y-4 p-4">
            <div>
              <p className="text-[11px] text-muted">Held in escrow</p>
              <p className="font-mono-tabular text-3xl font-semibold tracking-tight">₦485,000</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted">
              {["Paid", "Packed", "In transit", "Delivered"].map((s, i) => (
                <div key={s} className="flex flex-1 flex-col gap-1.5">
                  <span className={`h-1 rounded-full ${i < 3 ? "bg-brand" : "bg-line"}`} />
                  <span className={i < 3 ? "text-ink" : ""}>{s}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2.5">
              <span className="flex items-center gap-2 text-xs"><KeyRound size={14} className="text-brand" /> Release OTP</span>
              <span className="font-mono-tabular flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="grid h-7 w-6 place-items-center rounded border border-line bg-surface text-sm">•</span>
                ))}
              </span>
            </div>
            <button className="btn-primary w-full pointer-events-none">Release payment</button>
          </div>
        </div>

        {/* Left: proof of pack */}
        <div className="card float-slow absolute -left-2 top-24 z-20 hidden w-60 overflow-hidden shadow-xl md:block lg:left-6">
          <div className="relative aspect-video bg-gradient-to-br from-zinc-800 via-zinc-900 to-emerald-950">
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur"><Play size={16} className="fill-white text-white" /></span>
            </div>
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Proof of Pack
            </span>
          </div>
          <div className="flex items-center gap-2 p-3">
            <ShieldCheck size={16} className="shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="font-mono-tabular text-xs font-medium">98% AI Match</p>
              <p className="truncate text-[10px] text-muted">SHA-256 Verified</p>
            </div>
          </div>
        </div>

        {/* Right: waybill route */}
        <div className="card float-slower absolute -right-2 top-40 z-20 hidden w-64 p-4 shadow-xl md:block lg:right-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium"><Truck size={14} className="text-brand" /> Peace Mass waybill</span>
            <span className="font-mono-tabular text-[10px] text-muted">AB-412-XA</span>
          </div>
          <svg viewBox="0 0 220 60" className="mb-2 w-full">
            <path d="M12 44 C 60 44, 70 14, 110 24 S 170 40, 208 14" fill="none" stroke="var(--line)" strokeWidth="2" />
            <path d="M12 44 C 60 44, 70 14, 110 24 S 170 40, 208 14" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="6 6" className="route-dash" />
            <circle cx="12" cy="44" r="5" fill="#10B981" />
            <circle cx="208" cy="14" r="5" fill="none" stroke="#10B981" strokeWidth="2" />
            <circle cx="110" cy="24" r="4" fill="#10B981"><animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" /></circle>
          </svg>
          <div className="flex justify-between text-xs">
            <div><p className="font-medium">Onitsha</p><p className="text-[10px] text-muted">Departed 9:40am</p></div>
            <div className="text-right"><p className="font-medium">Awka</p><p className="text-[10px] text-muted">ETA 12:15pm</p></div>
          </div>
        </div>

        {/* Bottom-left: payment confirmed toast */}
        <div className="card float-slower absolute bottom-6 left-0 z-20 hidden items-center gap-3 px-4 py-3 shadow-xl lg:left-24 lg:flex">
          <CheckCircle2 size={20} className="text-brand" />
          <div>
            <p className="text-xs font-medium">Payment confirmed</p>
            <p className="text-[10px] text-muted">Paystack · just now</p>
          </div>
        </div>

        {/* Bottom-right: driver ping */}
        <div className="card float-slow absolute bottom-2 right-0 z-20 hidden items-center gap-3 px-4 py-3 shadow-xl lg:right-24 lg:flex">
          <MapPin size={20} className="text-brand" />
          <div>
            <p className="text-xs font-medium">Driver checked in</p>
            <p className="text-[10px] text-muted">No app installed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Data ---------- */
const stats = [
  { v: "20s", l: "To create an escrow link" },
  { v: "0", l: "Apps to install" },
  { v: "SHA-256", l: "Fingerprinted proof" },
  { v: "4-digit", l: "OTP release" },
];

const steps = [
  { n: "01", icon: Link2, t: "Create a link", d: "Vendor enters the item and price. Confam generates a secure deal link in seconds." },
  { n: "02", icon: Lock, t: "Buyer pays into escrow", d: "Payment happens inside the deal room with Paystack. The money is held, not sent." },
  { n: "03", icon: Video, t: "Pack, record, ship", d: "Vendor records proof of pack. AI matches it to the waybill and the driver checks in by GPS." },
  { n: "04", icon: KeyRound, t: "Release with OTP", d: "Buyer shares the 4-digit code on delivery and the vendor is paid instantly." },
];

/* ---------- Page ---------- */
export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 text-center sm:pb-24 sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <BadgeCheck size={14} /> Escrow built for Nigerian social commerce
          </span>

          <h1 className="mx-auto mt-6 max-w-4xl text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Sell on WhatsApp.
            <br />
            Get paid with{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">confam.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg lg:text-xl">
            Lock the buyer's money in escrow, prove the pack with AI-verified video, track the waybill through the motor park,
            and release payment only when the goods land.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary h-12 w-full px-7 text-base sm:w-auto">
              Start selling free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-ghost h-12 w-full px-7 text-base sm:w-auto">
              Try the demo
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand" /> No app to download</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand" /> Powered by Paystack</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand" /> Works on any phone</span>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-line bg-surface/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-mono-tabular text-3xl font-semibold tracking-tight sm:text-4xl">{s.v}</p>
              <p className="mt-1 text-xs text-muted sm:text-sm">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium text-brand">How it works</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">From chat to cash, safely.</h2>
          <p className="mt-4 text-muted sm:text-lg">Four steps. No back-and-forth, no "I've sent it, abeg confirm".</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ n, icon: Icon, t, d }) => (
            <div key={n} className="card group relative p-6 transition hover:-translate-y-1 hover:border-emerald-500/30">
              <span className="font-mono-tabular absolute right-5 top-5 text-xs text-muted">{n}</span>
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-brand transition group-hover:bg-brand group-hover:text-white">
                <Icon size={20} />
              </div>
              <h3 className="mb-2 text-lg font-medium">{t}</h3>
              <p className="text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENTO FEATURES */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:pb-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium text-brand">Why Confam</p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Trust, built into every deal.</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          {/* Escrow */}
          <div className="card relative overflow-hidden p-7 md:col-span-4">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-brand"><Lock size={20} /></div>
            <h3 className="mb-2 text-2xl font-semibold tracking-tight">Micro-escrow that buyers actually trust</h3>
            <p className="max-w-lg text-muted">Money is locked the moment the buyer pays and only moves when the OTP is shared. Disputes go to arbitration, not WhatsApp screenshots.</p>
            <div className="mt-7 grid max-w-md grid-cols-3 gap-2 text-center text-xs">
              {[["Paid", "₦485,000"], ["Held", "Locked"], ["Released", "On OTP"]].map(([a, b], i) => (
                <div key={a} className={`rounded-lg border p-3 ${i === 1 ? "border-emerald-500/30 bg-emerald-500/10" : "border-line bg-surface-2"}`}>
                  <p className="text-muted">{a}</p>
                  <p className="font-mono-tabular mt-0.5 font-medium">{b}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI */}
          <div className="card p-7 md:col-span-2">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-brand"><ScanLine size={20} /></div>
            <h3 className="mb-2 text-xl font-semibold tracking-tight">AI-verified proof</h3>
            <p className="text-sm text-muted">Gemini reads the waybill and matches it against your pack video.</p>
            <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="font-mono-tabular text-2xl font-semibold text-emerald-600 dark:text-emerald-400">98%</p>
              <p className="text-xs text-muted">AI match • SHA-256 verified</p>
            </div>
          </div>

          {/* Motor park */}
          <div className="card p-7 md:col-span-2">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-brand"><Truck size={20} /></div>
            <h3 className="mb-2 text-xl font-semibold tracking-tight">Motor-park tracking</h3>
            <p className="text-sm text-muted">Scan the waybill. Drivers check in by GPS from a simple link.</p>
          </div>

          {/* Zero install */}
          <div className="card relative overflow-hidden p-7 md:col-span-4">
            <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-brand"><Smartphone size={20} /></div>
                <h3 className="mb-2 text-2xl font-semibold tracking-tight">Zero app install. Ever.</h3>
                <p className="max-w-md text-muted">Buyers, vendors and drivers all work from a link in the browser. Share it on WhatsApp, Instagram or SMS and you are live.</p>
              </div>
              <div className="mx-auto w-44 rounded-[1.6rem] border border-line bg-surface-2 p-2 shadow-lg">
                <div className="rounded-[1.2rem] bg-surface p-3">
                  <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
                  <p className="text-[10px] text-muted">confam.ng/deal</p>
                  <p className="font-mono-tabular text-lg font-semibold">₦485,000</p>
                  <div className="mt-3 rounded-md bg-brand py-1.5 text-center text-[11px] font-medium text-white">Pay securely</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-surface to-surface px-6 py-14 text-center sm:py-20">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
              Stop chasing buyers. Start getting <span className="text-brand">confam.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted sm:text-lg">Create your first escrow link in under a minute.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary h-12 w-full px-7 text-base sm:w-auto">Create free account <ArrowRight size={18} /></Link>
              <Link to="/login" className="btn-ghost h-12 w-full px-7 text-base sm:w-auto">Log in</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}