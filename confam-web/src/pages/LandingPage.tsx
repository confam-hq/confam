import { Link } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, CheckCheck, CheckCircle2, KeyRound, Link2, Lock,
  MapPin, Play, ScanLine, ShieldCheck, Smartphone, Truck, Video,
} from "lucide-react";
import logo from "../assets/logo.png";

/* ---------------- Hero composition ---------------- */
function PhoneChat() {
  return (
    <div className="relative w-[272px] rounded-[2.5rem] border border-line bg-surface-2 p-2.5 shadow-2xl shadow-emerald-500/20">
      <div className="overflow-hidden rounded-[2rem] bg-canvas">
        <div className="mx-auto mt-2 h-1 w-14 rounded-full bg-line" />
        <div className="flex items-center gap-2.5 border-b border-line bg-surface px-3 py-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-[11px] font-bold text-white">CB</div>
          <div>
            <p className="text-xs font-semibold">Chidi Bags & Tech</p>
            <p className="text-[10px] text-brand">online</p>
          </div>
        </div>

        <div className="space-y-2.5 p-3 text-[11px] leading-snug">
          <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-surface-2 px-3 py-2">Is the iPhone 13 Pro still available? 👀</div>
          <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-emerald-500/15 px-3 py-2 text-ink">
            Yes boss! Pay through Confam so you're 100% covered 🔒
          </div>

          <div className="ml-auto w-[88%] overflow-hidden rounded-2xl rounded-tr-sm border border-line bg-surface">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <img src={logo} alt="" className="h-5 w-auto" />
              <span className="font-mono-tabular text-[10px] text-muted">CF-8H2K9X</span>
            </div>
            <div className="p-3">
              <p className="font-semibold">iPhone 13 Pro, 256GB</p>
              <p className="font-mono-tabular mt-0.5 text-lg font-semibold">₦485,000</p>
              <div className="mt-2.5 rounded-lg bg-brand py-1.5 text-center text-[11px] font-semibold text-white">Pay securely</div>
            </div>
          </div>

          <div className="max-w-[60%] rounded-2xl rounded-tl-sm bg-surface-2 px-3 py-2">
            Paid ✅ <CheckCheck size={12} className="ml-1 inline text-sky-500" />
          </div>

          <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <Lock size={10} /> ₦485,000 locked in escrow
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto h-[560px] w-full max-w-[580px]">
      {/* rings + glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[90px]" />
      <svg className="pointer-events-none absolute inset-0 m-auto text-line" width="520" height="520" viewBox="0 0 520 520" fill="none">
        <circle cx="260" cy="260" r="250" stroke="currentColor" strokeDasharray="4 8" />
        <circle cx="260" cy="260" r="190" stroke="currentColor" />
      </svg>

      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"><PhoneChat /></div>

      {/* Proof of pack */}
      <div className="card float-slow absolute right-0 top-6 z-20 hidden w-52 overflow-hidden shadow-xl sm:block">
        <div className="relative aspect-video bg-gradient-to-br from-zinc-800 via-zinc-900 to-emerald-950">
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur"><Play size={14} className="fill-white text-white" /></span>
          </div>
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Proof of Pack
          </span>
        </div>
        <div className="flex items-center gap-2 p-2.5">
          <ShieldCheck size={15} className="shrink-0 text-brand" />
          <div>
            <p className="font-mono-tabular text-xs font-semibold">98% AI Match</p>
            <p className="text-[10px] text-muted">SHA-256 Verified</p>
          </div>
        </div>
      </div>

      {/* Waybill */}
      <div className="card float-slower absolute -left-2 bottom-28 z-20 hidden w-56 p-3.5 shadow-xl sm:block">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold"><Truck size={13} className="text-brand" /> Peace Mass</span>
          <span className="font-mono-tabular text-[10px] text-muted">AB-412-XA</span>
        </div>
        <svg viewBox="0 0 220 56" className="w-full">
          <path d="M12 42 C 60 42, 70 12, 110 22 S 170 38, 208 12" fill="none" stroke="var(--line)" strokeWidth="2" />
          <path d="M12 42 C 60 42, 70 12, 110 22 S 170 38, 208 12" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="6 6" className="route-dash" />
          <circle cx="12" cy="42" r="5" fill="#10B981" />
          <circle cx="208" cy="12" r="5" fill="none" stroke="#10B981" strokeWidth="2" />
          <circle cx="110" cy="22" r="4" fill="#10B981"><animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" /></circle>
        </svg>
        <div className="mt-1 flex justify-between text-[11px]">
          <span className="font-medium">Onitsha</span><span className="font-medium">Awka</span>
        </div>
      </div>

      {/* OTP */}
      <div className="card float-slow absolute bottom-4 right-2 z-20 hidden w-52 p-3.5 shadow-xl sm:block">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><KeyRound size={13} className="text-brand" /> Release OTP</p>
        <div className="font-mono-tabular flex gap-1.5">
          {["4", "7", "2", "9"].map((d, i) => (
            <span key={i} className="grid h-9 flex-1 place-items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-base font-semibold text-emerald-600 dark:text-emerald-400">{d}</span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted">Share only on delivery</p>
      </div>

      {/* Toast */}
      <div className="card float-slower absolute left-0 top-24 z-20 hidden items-center gap-2.5 px-3.5 py-2.5 shadow-xl sm:flex">
        <CheckCircle2 size={18} className="text-brand" />
        <div>
          <p className="text-xs font-semibold">Payment confirmed</p>
          <p className="text-[10px] text-muted">Paystack · just now</p>
        </div>
      </div>

      {/* Driver */}
      <div className="card float-slow absolute -right-1 top-[46%] z-20 hidden items-center gap-2.5 px-3.5 py-2.5 shadow-xl xl:flex">
        <MapPin size={18} className="text-brand" />
        <div>
          <p className="text-xs font-semibold">Driver checked in</p>
          <p className="text-[10px] text-muted">No app installed</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Data ---------------- */
const marquee = ["WhatsApp sellers", "Instagram vendors", "TikTok shops", "Motor-park waybills", "Paystack payments", "AI proof of pack", "Zero app install", "GPS driver check-ins"];
const stats = [
  { v: "20s", l: "To create an escrow link" },
  { v: "0", l: "Apps to install" },
  { v: "SHA-256", l: "Fingerprinted proof" },
  { v: "4-digit", l: "OTP release" },
];
const steps = [
  { n: "01", icon: Link2, t: "Create a link", d: "Enter the item and price. Confam generates a secure deal link in seconds." },
  { n: "02", icon: Lock, t: "Buyer pays into escrow", d: "Payment happens inside the deal room with Paystack. Money is held, not sent." },
  { n: "03", icon: Video, t: "Pack, record, ship", d: "Record proof of pack. AI matches it to the waybill and the driver checks in by GPS." },
  { n: "04", icon: KeyRound, t: "Release with OTP", d: "Buyer shares the 4-digit code on delivery and the vendor is paid instantly." },
];

/* ---------------- Page ---------------- */
export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative isolate">
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="aurora pointer-events-none absolute -left-32 top-0 -z-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="aurora pointer-events-none absolute -right-32 top-40 -z-10 h-96 w-96 rounded-full bg-teal-500/15 blur-[120px]" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-24 lg:pt-20">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 py-1 pl-1 pr-3.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>
              AI-verified escrow for social commerce
            </span>

            <h1 className="mt-6 text-[2.7rem] font-extrabold leading-[1.04] sm:text-6xl xl:text-[4.5rem]">
              Sell on WhatsApp.
              <br />
              Get paid with{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent">confam.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg lg:mx-0">
              Lock the buyer's money in escrow, prove the pack with AI-verified video, track the waybill through the motor park,
              and release payment only when the goods land.
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
              <Link to="/register" className="btn-primary h-12 w-full px-7 text-base sm:w-auto">
                Start selling free <ArrowRight size={18} />
              </Link>
              <Link to="/faq" className="btn-ghost h-12 w-full px-7 text-base sm:w-auto">How Confam works</Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted lg:justify-start">
              <span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-brand" /> No app to download</span>
              <span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-brand" /> Powered by Paystack</span>
              <span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-brand" /> Works on any phone</span>
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* MARQUEE */}
      <section className="overflow-hidden border-y border-line bg-surface/50 py-5">
        <div className="marquee flex w-max items-center gap-12 text-sm font-medium text-muted">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-12 whitespace-nowrap">
              {m}<span className="h-1 w-1 rounded-full bg-brand" />
            </span>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-14 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <p className="font-mono-tabular text-3xl font-semibold sm:text-4xl">{s.v}</p>
            <p className="mt-1 text-xs text-muted sm:text-sm">{s.l}</p>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:pb-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold text-brand">How it works</p>
          <h2 className="text-3xl font-bold sm:text-5xl">From chat to cash, safely.</h2>
          <p className="mt-4 text-muted sm:text-lg">Four steps. No back-and-forth, no "I've sent it, abeg confirm".</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ n, icon: Icon, t, d }) => (
            <div key={n} className="card group relative p-6 transition hover:-translate-y-1 hover:border-emerald-500/30">
              <span className="font-mono-tabular absolute right-5 top-5 text-xs text-muted">{n}</span>
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-brand transition group-hover:bg-brand group-hover:text-white"><Icon size={20} /></div>
              <h3 className="mb-2 text-lg font-semibold">{t}</h3>
              <p className="text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENTO */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:pb-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold text-brand">Why Confam</p>
          <h2 className="text-3xl font-bold sm:text-5xl">Trust, built into every deal.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-6">
          <div className="card relative overflow-hidden p-7 md:col-span-4">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-brand"><Lock size={20} /></div>
            <h3 className="mb-2 text-2xl font-bold">Micro-escrow that buyers actually trust</h3>
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

          <div className="card p-7 md:col-span-2">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-brand"><ScanLine size={20} /></div>
            <h3 className="mb-2 text-xl font-bold">AI-verified proof</h3>
            <p className="text-sm text-muted">Gemini reads the waybill and matches it against your pack video.</p>
            <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="font-mono-tabular text-2xl font-semibold text-emerald-600 dark:text-emerald-400">98%</p>
              <p className="text-xs text-muted">AI match • SHA-256 verified</p>
            </div>
          </div>

          <div className="card p-7 md:col-span-2">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-brand"><Truck size={20} /></div>
            <h3 className="mb-2 text-xl font-bold">Motor-park tracking</h3>
            <p className="text-sm text-muted">Scan the waybill. Drivers check in by GPS from a simple link.</p>
          </div>

          <div className="card relative overflow-hidden p-7 md:col-span-4">
            <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-brand"><Smartphone size={20} /></div>
                <h3 className="mb-2 text-2xl font-bold">Zero app install. Ever.</h3>
                <p className="max-w-md text-muted">Buyers, vendors and drivers all work from a link in the browser. Share it on WhatsApp, Instagram or SMS and you are live.</p>
              </div>
              <div className="mx-auto w-44 rounded-[1.6rem] border border-line bg-surface-2 p-2 shadow-lg">
                <div className="rounded-[1.2rem] bg-surface p-3">
                  <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
                  <img src={logo} alt="" className="mb-2 h-5 w-auto" />
                  <p className="font-mono-tabular text-lg font-semibold">₦485,000</p>
                  <div className="mt-3 rounded-md bg-brand py-1.5 text-center text-[11px] font-semibold text-white">Pay securely</div>
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
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-5xl">
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