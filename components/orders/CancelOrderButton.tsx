"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelOrderAction,
  merchantCancelOrderAction,
} from "@/modules/orders/actions";
import { Button } from "@/components/ui/Button";

type Props = {
  orderId: string;
  scope?: "customer" | "merchant";
};

export function CancelOrderButton({ orderId, scope = "customer" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const confirmMessage =
    scope === "merchant"
      ? "Cancel this unpaid order? The customer will no longer be able to pay."
      : "Cancel this order? You can place a new order anytime.";

  function handleCancel() {
    if (!confirm(confirmMessage)) return;

    const action =
      scope === "merchant" ? merchantCancelOrderAction : cancelOrderAction;

    startTransition(async () => {
      const result = await action(orderId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error ?? "Could not cancel order");
      }
    });
  }

  return (
    <Button type="button" variant="outline" disabled={pending} onClick={handleCancel}>
      {pending ? "Cancelling…" : "Cancel order"}
    </Button>
  );
}
