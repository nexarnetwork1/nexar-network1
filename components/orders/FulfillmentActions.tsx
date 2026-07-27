"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderFulfillmentAction } from "@/modules/orders/actions";
import { Button } from "@/components/ui/Button";
import type { FulfillmentStatus } from "@/types";

type Props = {
  orderId: string;
  currentStatus?: FulfillmentStatus;
};

const NEXT_STATUS: Record<"pending" | "processing" | "shipped", "processing" | "shipped" | "delivered"> = {
  pending: "processing",
  processing: "shipped",
  shipped: "delivered",
};

export function FulfillmentActions({ orderId, currentStatus = "pending" }: Props) {
  const [pending, startTransition] = useTransition();
  const next =
    currentStatus === "pending" || currentStatus === "processing" || currentStatus === "shipped"
      ? NEXT_STATUS[currentStatus]
      : undefined;

  if (!next) return null;

  function advance() {
    if (!next) return;
    startTransition(async () => {
      const result = await updateOrderFulfillmentAction(orderId, next);
      if (result.success) {
        toast.success(`Order marked as ${next}`);
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    });
  }

  return (
    <Button type="button" onClick={advance} disabled={pending} variant="secondary">
      Mark as {next}
    </Button>
  );
}
