import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Props = {
  status: string;
  invoiceNumber?: string;
  confirmed?: boolean;
};

export function OrderConfirmationBanner({ status, invoiceNumber, confirmed }: Props) {
  if (status === "paid") {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div>
          <p className="font-semibold text-success">Order confirmed — payment received</p>
          {invoiceNumber && (
            <p className="mt-1 text-sm text-muted">Invoice {invoiceNumber} is paid.</p>
          )}
        </div>
      </div>
    );
  }

  if (confirmed && status === "pending_payment") {
    return (
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gold/30 bg-gold/10 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div>
            <p className="font-semibold text-gold">Order placed — complete payment to confirm</p>
            <p className="mt-1 text-sm text-muted">
              Your order appears in your dashboard, the merchant dashboard, and admin reports.
            </p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
    );
  }

  return null;
}
