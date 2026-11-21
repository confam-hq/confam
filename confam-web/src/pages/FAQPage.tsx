import { useState } from "react";
import { ChevronDown, HelpCircle, Link2, Lock, ShieldCheck, Truck, CircleDollarSign, Scale } from "lucide-react";
import { Link } from "react-router-dom";

const faqs = [
  {
    icon: Lock,
    question: "What happens after I pay for a deal?",
    answer: "Your payment is held in escrow instead of being sent directly to the vendor. The deal moves from awaiting payment to funded, and your protected payment stays locked until delivery is confirmed or a dispute is resolved.",
  },
  {
    icon: Link2,
    question: "Do I need an app to use Confam?",
    answer: "No. Confam works directly in your browser. Vendors can create deals, buyers can open the deal room, and drivers can submit location updates using a shared link.",
  },
  {
    icon: ShieldCheck,
    question: "How is packing proof verified?",
    answer: "The vendor records a proof-of-pack video. Confam stores it securely, fingerprints the evidence, and uses automated AI review to compare the packing evidence with deal details and supporting waybill information.",
  },
  {
    icon: Truck,
    question: "How does delivery tracking work?",
    answer: "After dispatch, the driver or participant can open a location-check-in link. Confam records the latest location ping together with its time. The deal room shows this activity to the relevant participant.",
  },
  {
    icon: CircleDollarSign,
    question: "When is the vendor paid?",
    answer: "The vendor is paid after the buyer confirms good delivery and waybill receipt. If the delivery is disputed, funds remain frozen until an authorized Confam admin releases or refunds them.",
  },
  {
    icon: CircleDollarSign,
    question: "What fee does Confam charge?",
    answer: "A 5% vendor fee applies to newly created deals and is deducted from the vendor's item and delivery proceeds at settlement. It is not added to the buyer as a separate platform surcharge.",
  },
  {
    icon: Scale,
    question: "What is a dispute?",
    answer: "A dispute freezes the escrowed funds while an administrator reviews the deal evidence. Either party can raise it for an active funded deal when goods, waybill details, delivery, or payment require formal review.",
  },
  {
    icon: HelpCircle,
    question: "What if I entered the wrong deal code?",
    answer: "Use the deal lookup in the navigation bar and carefully copy the full Confam code from the link or message. Public deal records are read from the code, so a misspelled code may open an unavailable deal.",
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number>(0);

  return (
    <main className="relative isolate min-h-[70vh] overflow-hidden px-4 py-10 sm:py-16">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <HelpCircle size={13} /> Support center
          </span>
          <h1 className="mt-5 text-3xl font-semibold sm:text-5xl">Frequently asked questions</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Everything you need to know about protected payments, evidence, delivery, and dispute resolution.
          </p>
        </header>

        <div className="mt-9 space-y-3">
          {faqs.map((faq, index) => {
            const Icon = faq.icon;
            const expanded = open === index;
            return (
              <section key={faq.question} className={`overflow-hidden rounded-2xl border transition ${expanded ? "border-brand/40 bg-surface shadow-lg shadow-emerald-500/5" : "border-line bg-surface/70"}`}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? -1 : index)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5 sm:py-5"
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${expanded ? "bg-brand text-white" : "bg-surface-2 text-brand"}`}>
                    <Icon size={18} />
                  </span>
                  <span className="flex-1 font-semibold">{faq.question}</span>
                  <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${expanded ? "rotate-180 text-brand" : ""}`} />
                </button>
                {expanded && (
                  <div className="border-t border-line px-5 pb-5 pt-4 sm:px-17 sm:pl-[4.75rem]">
                    <p className="text-sm leading-7 text-muted">{faq.answer}</p>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <section className="neo-card mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl p-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-semibold">Still have a question?</p>
            <p className="mt-1 text-sm text-muted">Open an account or sign in to manage your deals and disputes.</p>
          </div>
          <Link to="/register" className="btn-primary min-w-36">Get started</Link>
        </section>
      </div>
    </main>
  );
}
