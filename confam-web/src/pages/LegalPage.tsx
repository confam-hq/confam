import { Link } from "react-router-dom";

type PolicyKey = "terms" | "privacy" | "cookies";

const policies: Record<PolicyKey, { title: string; summary: string; sections: { heading: string; body: string }[] }> = {
  terms: {
    title: "Terms of service",
    summary: "Draft terms for using Confam escrow and delivery tools.",
    sections: [
      {
        heading: "How a Confam deal works",
        body: "A buyer funds a deal through the payment provider. Confam records deal details, packing proof, waybill information, and delivery status. When the buyer confirms that the goods and waybill arrived in good condition, the vendor payout is released. If either party raises a dispute, the funds remain held while a Confam admin reviews the available evidence.",
      },
      {
        heading: "Platform fee",
        body: "For deals created under the new fee schedule, Confam withholds a 5% platform fee from the vendor's item and delivery proceeds when the deal is settled. The fee is deducted from the vendor payout; it is not added as a separate buyer platform surcharge. Existing deals keep the fee terms shown when they were created. A refunded deal does not generate a vendor payout or platform fee.",
      },
      {
        heading: "Buyer confirmation and disputes",
        body: "Buyers should inspect the goods and waybill before confirming good delivery. Confirmation releases the vendor payout and should only be submitted after receipt. Either the buyer or vendor may raise a dispute for an active funded deal. Disputed funds stay frozen until an authorized Confam admin records a release or refund decision; silence alone does not automatically release funds.",
      },
      {
        heading: "Payments, AI, and evidence",
        body: "Payment processing is provided by Paystack. Confam may use automated tools to inspect packing videos and waybill images. AI results are supporting evidence, not a guarantee of authenticity, item condition, carrier acceptance, or delivery.",
      },
      {
        heading: "Operator and governing law",
        body: "The service is currently presented as Confam and is intended for use in Nigeria. The registered legal entity, official contact address, and governing-law wording must be confirmed before these draft terms are treated as final.",
      },
    ],
  },
  privacy: {
    title: "Privacy notice",
    summary: "Draft overview of the information used to operate Confam.",
    sections: [
      {
        heading: "Information we use",
        body: "Confam processes account names, email addresses, phone numbers, vendor payout details, buyer and deal details, payment references, packing videos, waybill images and extracted text, and driver location pings when that feature is used.",
      },
      {
        heading: "Why we use it",
        body: "Information is used to create and manage deals, route payments and payouts, verify packing and waybill evidence, track dispatch, support disputes, protect accounts, and meet applicable legal or payment-provider requirements.",
      },
      {
        heading: "Service providers and sharing",
        body: "Paystack processes payment and banking operations. Google Gemini may process submitted video or image evidence for AI review when configured. Relevant deal information is shared with the other deal participant to coordinate payment and delivery. Confam does not sell personal information.",
      },
      {
        heading: "Storage and retention",
        body: "Deal records and uploaded evidence are stored by the application and its configured storage provider. They are retained as needed to provide the service, resolve disputes, protect the platform, and meet legal obligations. The final retention schedule and data-protection contact must be supplied by the registered operator.",
      },
      {
        heading: "Your choices",
        body: "You may contact Confam to request access to or correction of account information, or to raise a privacy concern. Requests may be limited where records must be kept for an active payment, dispute, security, or legal requirement. Add the operator's verified contact details before publication.",
      },
    ],
  },
  cookies: {
    title: "Cookie and browser-storage notice",
    summary: "What Confam currently stores in your browser.",
    sections: [
      {
        heading: "Essential browser storage",
        body: "The current web app stores your sign-in token and display-theme preference in browser local storage. This is browser storage, not an advertising cookie. Removing site data signs you out and resets saved preferences.",
      },
      {
        heading: "Cookies from providers",
        body: "Paystack checkout and other third-party services may use cookies or similar technologies under their own privacy notices. Confam does not control those provider technologies.",
      },
      {
        heading: "Analytics and advertising",
        body: "No analytics or advertising-cookie integration is configured in the current application. If non-essential tracking is added later, this notice and any required consent controls must be updated before launch.",
      },
    ],
  },
};

export default function LegalPage({ page }: { page: PolicyKey }) {
  const policy = policies[page];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
      <Link to="/" className="text-sm font-semibold text-brand hover:underline">← Back to Confam</Link>
      <header className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Confam · Draft for review</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{policy.title}</h1>
        <p className="mt-3 text-sm text-muted">{policy.summary}</p>
      </header>

      <div className="neo-card mt-6 rounded-2xl border-amber-500/30 p-4 text-sm">
        <p className="font-semibold">Draft — not final legal advice</p>
        <p className="mt-1 text-muted">
          Confirm the registered legal entity, jurisdiction, contact details, and retention schedule with Nigerian counsel before publishing as final policy.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {policy.sections.map((section) => (
          <section key={section.heading} className="neo-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
