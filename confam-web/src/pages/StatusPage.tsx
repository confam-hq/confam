import { ArrowLeft, Home, RefreshCw, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedLogo from "../components/feedback/AnimatedLogo";

type StatusCode = "403" | "404" | "500";

const pageCopy: Record<StatusCode, { eyebrow: string; title: string; message: string }> = {
  "403": {
    eyebrow: "ACCESS DENIED",
    title: "This space isn’t yours to enter.",
    message: "Your account doesn’t have permission to open this workspace. Switch accounts or head back to Confam.",
  },
  "404": {
    eyebrow: "PAGE NOT FOUND",
    title: "Looks like this page took a detour.",
    message: "That address doesn’t lead to a Confam page. Check the link or head back to a safe place.",
  },
  "500": {
    eyebrow: "UNEXPECTED ERROR",
    title: "Something went off-route.",
    message: "Confam hit an unexpected error. Try again, or head home while we get things back on track.",
  },
};

export default function StatusPage({ code, detail }: { code: StatusCode; detail?: string }) {
  const copy = pageCopy[code];
  const isForbidden = code === "403";

  return (
    <main className="relative isolate grid min-h-screen overflow-hidden bg-canvas px-4 py-10 text-ink sm:py-16">
      <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10 opacity-40" />
      <div aria-hidden="true" className="aurora absolute -right-32 -top-32 -z-10 size-[30rem] rounded-full bg-emerald-500/10 blur-3xl" />

      <section className="mx-auto my-auto w-full max-w-3xl">
        <div className="neo-card relative overflow-hidden rounded-[32px] p-6 sm:p-10 lg:p-14">
          <div aria-hidden="true" className="absolute -right-8 -top-12 font-mono-tabular text-[10rem] font-black leading-none text-brand/[0.06] sm:text-[16rem]">
            {code}
          </div>

          <div className="relative">
            <Link to="/" aria-label="Confam home" className="inline-flex rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
              <AnimatedLogo size={52} />
            </Link>

            <div className="mt-10 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <ShieldAlert size={20} />
              </span>
              <p className="font-mono-tabular text-xs font-bold tracking-[0.2em] text-brand">{copy.eyebrow}</p>
            </div>

            <p className="font-mono-tabular mt-5 text-6xl font-black tracking-[-0.08em] text-ink sm:text-8xl">{code}</p>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-tight sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">{detail || copy.message}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/" className="btn-primary min-h-14 rounded-2xl px-6 text-base">
                <Home size={18} /> Back to Confam
              </Link>
              {isForbidden ? (
                <Link to="/login" className="btn-ghost min-h-14 rounded-2xl px-6 text-base">
                  <ArrowLeft size={18} /> Switch account
                </Link>
              ) : (
                <button onClick={() => window.location.reload()} className="btn-ghost min-h-14 rounded-2xl px-6 text-base">
                  <RefreshCw size={17} /> Try again
                </button>
              )}
            </div>

            <p className="mt-10 border-t border-line pt-5 text-xs text-muted">
              Need a hand? Return home and reopen your deal from its original Confam link.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
