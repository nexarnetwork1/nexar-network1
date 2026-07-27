"use client";

import { useState, useTransition } from "react";
import { checkoutAction } from "@/modules/orders/actions";
import { Button } from "@/components/ui/Button";

export function CheckoutButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCheckout() {
    setError(null);
    startTransition(async () => {
      const result = await checkoutAction();
      if (result && !result.success) {
        setError(result.error ?? "Checkout failed");
      }
    });
  }

  return (
    <div>
      <Button
        type="button"
        className="w-full"
        disabled={pending}
        onClick={handleCheckout}
      >
        {pending ? "Processing…" : "Proceed to checkout"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <p className="mt-3 text-xs text-muted">
        Creates one order and invoice per store. Payment in the next step.
      </p>
    </div>
  );
}
