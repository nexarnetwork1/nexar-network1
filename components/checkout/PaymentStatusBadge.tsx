"use client";

import { PaymentStatus } from "@/shared/payments";
import { cn } from "@/lib/utils/cn";
import { Loader2, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

interface PaymentStatusBadgeProps {
  status: PaymentStatus | 'confirming';
}

const STATUS_CONFIG: Record<PaymentStatus | 'confirming', {
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  pulse: boolean;
}> = {
  [PaymentStatus.PENDING]: {
    label: "Waiting for Payment",
    icon: Clock,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    pulse: true,
  },
  [PaymentStatus.PROCESSING]: {
    label: "Processing",
    icon: Loader2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    pulse: true,
  },
  'confirming': {
    label: "Confirming",
    icon: Loader2,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    pulse: true,
  },
  [PaymentStatus.REQUIRES_ACTION]: {
    label: "Action Required",
    icon: AlertTriangle,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    pulse: true,
  },
  [PaymentStatus.REQUIRES_CONFIRMATION]: {
    label: "Confirmation Required",
    icon: Clock,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    pulse: true,
  },
  [PaymentStatus.REQUIRES_CAPTURE]: {
    label: "Capture Required",
    icon: Clock,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    pulse: true,
  },
  [PaymentStatus.SUCCEEDED]: {
    label: "Payment Successful",
    icon: CheckCircle2,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    pulse: false,
  },
  [PaymentStatus.COMPLETED]: {
    label: "Payment Completed",
    icon: CheckCircle2,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    pulse: false,
  },
  [PaymentStatus.FAILED]: {
    label: "Payment Failed",
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    pulse: false,
  },
  [PaymentStatus.CANCELED]: {
    label: "Payment Canceled",
    icon: XCircle,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    pulse: false,
  },
  [PaymentStatus.DECLINED]: {
    label: "Payment Declined",
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    pulse: false,
  },
  [PaymentStatus.REFUNDED]: {
    label: "Payment Refunded",
    icon: CheckCircle2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    pulse: false,
  },
  [PaymentStatus.PARTIALLY_REFUNDED]: {
    label: "Partially Refunded",
    icon: CheckCircle2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    pulse: false,
  },
  [PaymentStatus.DISPUTED]: {
    label: "Payment Disputed",
    icon: AlertTriangle,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    pulse: true,
  },
  [PaymentStatus.CHARGEBACK]: {
    label: "Chargeback",
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    pulse: false,
  },
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[PaymentStatus.PENDING];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2",
        config.bgColor,
        config.borderColor,
        config.pulse && "animate-pulse"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          config.color,
          status === PaymentStatus.PROCESSING ||
          status === PaymentStatus.REQUIRES_ACTION ||
          status === PaymentStatus.REQUIRES_CONFIRMATION ||
          status === PaymentStatus.REQUIRES_CAPTURE ||
          status === PaymentStatus.DISPUTED
            ? "animate-spin"
            : ""
        )}
      />
      <span className={cn("text-sm font-medium", config.color)}>
        {config.label}
      </span>
    </div>
  );
}
