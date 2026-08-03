"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { initiatePaymentAction } from "@/modules/payments/actions";
import {
  cryptoPaymentMethods,
  initiatePaymentSchema,
  type PaymentMethodCode,
} from "@/modules/payments/validators";
import { PaymentPopup } from "@/components/payments/PaymentPopup";
import { CardPaymentPopup } from "@/components/payments/CardPaymentPopup";
import { PaymentMethodPicker } from "@/components/payments/BrandedSelect";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { PaymentSession } from "@/types";
import type { InvoicePaymentOptions } from "@/modules/payments/repository";

type PayNowButtonProps = {
  invoiceId: string;
  invoiceNumber: string;
  storeName: string;
  amountUsd: number;
  paymentOptions?: InvoicePaymentOptions;
};

export function PayNowButton({
  invoiceId,
  invoiceNumber,
  storeName,
  amountUsd,
  paymentOptions = { acceptsCrypto: true, acceptsCard: false, stripeAvailable: false },
}: PayNowButtonProps) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethodCode>(
    paymentOptions.acceptsCrypto ? "USDT" : "card"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showMethodPicker, setShowMethodPicker] = useState(false);

  const availableCrypto = paymentOptions.acceptsCrypto ? [...cryptoPaymentMethods] : [];
  const showCard = paymentOptions.acceptsCard;
  const pickerMethods = [
    ...availableCrypto,
    ...(showCard ? (["card"] as const) : []),
  ];

  async function handlePay() {
    setLoading(true);
    setError(null);

    const parsed = initiatePaymentSchema.safeParse({ invoiceId, method });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid payment method");
      setLoading(false);
      return;
    }

    const result = await initiatePaymentAction(
      parsed.data.invoiceId,
      parsed.data.method
    );

    if (!result.success) {
      setError(result.error ?? "Failed to start payment");
      setLoading(false);
      return;
    }

    if (result.paymentKind === "card" && result.clientSecret) {
      setClientSecret(result.clientSecret);
      setShowMethodPicker(false);
      setLoading(false);
      return;
    }

    if (!result.sessionId) {
      setError("Failed to start payment session");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("payment_sessions")
      .select("*")
      .eq("id", result.sessionId)
      .single();

    if (data) {
      setSession(data as PaymentSession);
      setShowMethodPicker(false);
    }

    setLoading(false);
  }

  if (clientSecret) {
    return (
      <CardPaymentPopup
        clientSecret={clientSecret}
        invoiceNumber={invoiceNumber}
        storeName={storeName}
        amountUsd={amountUsd}
        onClose={() => setClientSecret(null)}
        onSuccess={() => {
          toast.success("Payment submitted");
          setClientSecret(null);
          router.refresh();
        }}
      />
    );
  }

  if (session) {
    return (
      <PaymentPopup
        session={session}
        invoiceNumber={invoiceNumber}
        storeName={storeName}
        onClose={() => setSession(null)}
      />
    );
  }

  if (!showCard && availableCrypto.length === 0) {
    return <p className="text-sm text-muted">No payment methods available for this store.</p>;
  }

  return (
    <div>
      {!showMethodPicker ? (
        <Button type="button" onClick={() => setShowMethodPicker(true)}>
          Pay now
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="text-sm text-muted">Select payment method</p>
          <PaymentMethodPicker
            className="mt-3"
            methods={pickerMethods}
            selected={method}
            onSelect={(m) => setMethod(m as PaymentMethodCode)}
          />
          <div className="mt-4 flex gap-2">
            <Button type="button" disabled={loading} onClick={handlePay}>
              {loading ? (
                "Starting…"
              ) : (
                <span className="inline-flex items-center gap-2">
                  Pay with
                  <PaymentMethodLogo method={method} size={18} showLabel={false} />
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowMethodPicker(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
