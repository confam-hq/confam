declare global {
  interface Window { PaystackPop?: any }
}

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Paystack"));
    document.body.appendChild(s);
  });
  return loading;
}

interface Opts {
  email: string;
  amountNaira: number;
  reference?: string;
  accessCode?: string;
  onSuccess: (ref: string) => void;
  onClose?: () => void;
}

export async function openPaystack(o: Opts) {
  await loadScript();
  const pop = new window.PaystackPop();
  const base = o.accessCode
    ? { accessCode: o.accessCode }
    : {
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: o.email,
        amount: Math.round(o.amountNaira * 100),
        currency: "NGN",
        reference: o.reference,
      };
  pop.newTransaction({
    ...base,
    onSuccess: (t: { reference: string }) => o.onSuccess(t.reference),
    onCancel: () => o.onClose?.(),
  });
}