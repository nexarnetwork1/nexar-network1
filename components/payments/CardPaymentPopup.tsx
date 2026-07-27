"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CloseButton } from "@/components/ui/CloseButton";
import { Button } from "@/components/ui/Button";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import { useScrollLock } from "@/hooks/useScrollLock";

type CardPaymentPopupProps = {
  clientSecret: string;
  invoiceNumber: string;
  storeName: string;
  amountUsd: number;
  onClose: () => void;
  onSuccess: () => void;
};

function CardCheckoutForm({
  amountUsd,
  onSuccess,
  onClose,
}: {
  amountUsd: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?card=success`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setProcessing(false);
      return;
    }

    onSuccess();
    setProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={!stripe || processing}>
          {processing ? (
            "Processing…"
          ) : (
            <span className="inline-flex items-center gap-2">
              Pay <UsdAmount amount={amountUsd} size={16} />
            </span>
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} disabled={processing}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function CardPaymentPopup({
  clientSecret,
  invoiceNumber,
  storeName,
  amountUsd,
  onClose,
  onSuccess,
}: CardPaymentPopupProps) {
  useScrollLock(true);
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

  if (!stripePromise) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-red-400">Card payments are not configured.</p>
          <Button type="button" className="mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <CloseButton onClick={onClose} className="absolute right-4 top-4" />
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-gold">
          Pay with <PaymentMethodLogo method="card" size={22} showLabel={false} />
        </h2>
        <p className="mt-1 text-sm text-muted">{storeName}</p>
        <p className="mt-2 font-mono text-sm">{invoiceNumber}</p>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CardCheckoutForm amountUsd={amountUsd} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </div>
    </div>
  );
}
