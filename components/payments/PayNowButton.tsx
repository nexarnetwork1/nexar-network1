"use client";

import { useState } from "react";
import { initiatePaymentAction } from "@/modules/payments/actions";
import { PaymentPopup } from "@/components/payments/PaymentPopup";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { PaymentSession } from "@/types";

type PayNowButtonProps = {
  invoiceId: string;
  invoiceNumber: string;
  storeName: string;
  amountUsd: number;
};

const CRYPTO_METHODS = ["NXR", "BNB", "USDT"] as const;

export function PayNowButton({
  invoiceId,
  invoiceNumber,
  storeName,
}: PayNowButtonProps) {
  const [method, setMethod] = useState<string>("USDT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [showMethodPicker, setShowMethodPicker] = useState(false);

  async function handlePay() {
    setLoading(true);
    setError(null);

    const result = await initiatePaymentAction(invoiceId, method);

    if (!result.success || !result.sessionId) {
      setError(result.error ?? "Failed to start payment");
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

  return (
    <div>
      {!showMethodPicker ? (
        <Button type="button" onClick={() => setShowMethodPicker(true)}>
          Pay now
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <p className="text-sm text-muted">Select payment method</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CRYPTO_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  method === m
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border text-muted hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" disabled={loading} onClick={handlePay}>
              {loading ? "Starting…" : `Pay with ${method}`}
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
