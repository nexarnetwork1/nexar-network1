import type { FulfillmentStatus, OrderStatus } from "@/types";
import { Check, Circle, Package, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type TimelineStep = {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp?: string | null;
};

function buildSteps(
  status: OrderStatus,
  fulfillment: FulfillmentStatus = "pending",
  timestamps: { created?: string; paid?: string | null; shipped?: string | null; delivered?: string | null }
): TimelineStep[] {
  const cancelled = status === "cancelled" || status === "expired";
  const refunded = status === "refunded";
  const paid = status === "paid" || refunded;

  const steps: TimelineStep[] = [
    {
      key: "pending",
      label: "Pending",
      description: "Order placed, awaiting payment",
      completed: true,
      current: status === "pending_payment",
      timestamp: timestamps.created,
    },
    {
      key: "paid",
      label: "Paid",
      description: "Payment confirmed",
      completed: paid || cancelled,
      current: status === "paid" && fulfillment === "pending",
      timestamp: timestamps.paid,
    },
    {
      key: "processing",
      label: "Processing",
      description: "Merchant preparing your order",
      completed: paid && ["processing", "shipped", "delivered"].includes(fulfillment),
      current: status === "paid" && fulfillment === "processing",
    },
    {
      key: "shipped",
      label: "Shipped",
      description: "Order is on the way",
      completed: paid && ["shipped", "delivered"].includes(fulfillment),
      current: status === "paid" && fulfillment === "shipped",
      timestamp: timestamps.shipped,
    },
    {
      key: "delivered",
      label: "Delivered",
      description: "Order delivered successfully",
      completed: paid && fulfillment === "delivered",
      current: status === "paid" && fulfillment === "delivered",
      timestamp: timestamps.delivered,
    },
  ];

  if (cancelled) {
    return [
      steps[0],
      {
        key: "cancelled",
        label: "Cancelled",
        description: "Order was cancelled",
        completed: true,
        current: true,
      },
    ];
  }

  if (refunded) {
    return [
      ...steps.slice(0, 2),
      {
        key: "refunded",
        label: "Refunded",
        description: "Payment refunded to customer",
        completed: true,
        current: true,
      },
    ];
  }

  return steps;
}

const ICONS = [Circle, Check, Package, Truck, Check];

type OrderTimelineProps = {
  status: OrderStatus;
  fulfillmentStatus?: FulfillmentStatus;
  createdAt: string;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
};

export function OrderTimeline({
  status,
  fulfillmentStatus = "pending",
  createdAt,
  paidAt,
  shippedAt,
  deliveredAt,
}: OrderTimelineProps) {
  const steps = buildSteps(status, fulfillmentStatus, {
    created: createdAt,
    paid: paidAt,
    shipped: shippedAt,
    delivered: deliveredAt,
  });

  return (
    <ol className="relative space-y-0" aria-label="Order progress">
      {steps.map((step, i) => {
        const Icon = step.key === "cancelled" || step.key === "refunded" ? X : ICONS[i] ?? Circle;
        const isLast = i === steps.length - 1;

        return (
          <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-full w-0.5",
                  step.completed ? "bg-emerald-500/50" : "bg-border"
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                step.current
                  ? "border-gold bg-gold/20 text-gold"
                  : step.completed
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : "border-border bg-surface text-muted"
              )}
              aria-current={step.current ? "step" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn("font-medium", step.current ? "text-gold" : "text-white")}>
                {step.label}
              </p>
              <p className="text-sm text-muted">{step.description}</p>
              {step.timestamp && (
                <p className="mt-1 text-xs text-muted">
                  {new Date(step.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
