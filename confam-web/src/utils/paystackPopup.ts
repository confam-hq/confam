declare global {
  interface Window {
    PaystackPop?: any;
  }
}

interface PaystackPopupOptions {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, any>;
  onSuccess: (reference: string) => void;
  onCancel?: () => void;
}

export function triggerPaystackModalPopup({
  email,
  amountKobo,
  reference,
  metadata = {},
  onSuccess,
  onCancel,
}: PaystackPopupOptions) {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

  // If a real Paystack public key is configured and SDK is loaded, launch native Paystack Inline V2 Popup
  if (
    window.PaystackPop &&
    publicKey &&
    publicKey.startsWith('pk_') &&
    !publicKey.includes('your_paystack')
  ) {
    const popup = new window.PaystackPop();
    popup.newTransaction({
      key: publicKey,
      email,
      amount: amountKobo,
      currency: 'NGN',
      ref: reference,
      metadata,
      onSuccess: (transaction: { reference: string }) => {
        onSuccess(transaction.reference || reference);
      },
      onCancel: () => {
        if (onCancel) onCancel();
      },
    });
    return { usedNativeSdk: true };
  }

  // Otherwise signal caller to display our built-in Interactive Paystack Inline Modal Popup
  return { usedNativeSdk: false };
}