"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  verifyPaymentAction,
  cancelPaymentSessionAction,
} from "@/modules/payments/actions";
import { PaymentQrCode } from "@/components/payments/PaymentQrCode";
import { Button } from "@/components/ui/Button";
import { CloseButton } from "@/components/ui/CloseButton";
import { truncateAddress } from "@/utils";
import type { PaymentSession } from "@/types";

type PaymentPopupProps = {
  session: PaymentSession;
  invoiceNumber: string;
  storeName: string;
  merchantWallet?: string | null;
  onClose: () => void;
};

type DisplayStatus =
  | "pending"
  | "waiting"
  | "confirmed"
  | "completed"
  | "expired"
  | "cancelled";

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function mapDisplayStatus(
  status: PaymentSession["status"],
  verifying: boolean
): DisplayStatus {
  if (status === "paid" || status === "completed") return "completed";
  if (status === "confirmed") return "confirmed";
  if (status === "expired" || status === "failed") return "expired";
  if (status === "cancelled") return "cancelled";
  if (verifying) return "confirmed";
  return status === "waiting" ? "waiting" : "pending";
}

const STATUS_LABELS: Record<DisplayStatus, string> = {
  pending: "Pending",
  waiting: "Waiting for payment",
  confirmed: "Confirmed on-chain",
  completed: "Completed",
  expired: "Expired",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<DisplayStatus, string> = {
  pending: "text-zinc-400",
  waiting: "text-amber-400",
  confirmed: "text-sky-400",
  completed: "text-emerald-400",
  expired: "text-red-400",
  cancelled: "text-red-400",
};

export function PaymentPopup({
  session: initialSession,
  invoiceNumber,
  storeName,
  merchantWallet,
  onClose,
}: PaymentPopupProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [countdown, setCountdown] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expiresAt = new Date(session.expires_at).getTime();
  const displayStatus = mapDisplayStatus(session.status, verifying);

  useEffect(() => {
    const tick = () => {
      const remaining = expiresAt - Date.now();
      setCountdown(formatCountdown(remaining));
      if (remaining <= 0 && session.status === "waiting") {
        setSession((s) => ({ ...s, status: "expired" }));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, session.status]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`payment-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payment_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updated = payload.new as PaymentSession;
          setSession(updated);
          if (updated.status === "paid") {
            toast.success("Payment received");
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id, router]);

  const pollVerify = useCallback(async () => {
    if (session.status !== "waiting") return;
    setVerifying(true);
    setError(null);

    const result = await verifyPaymentAction(session.id);

    if (result.success) {
      setSession((s) => ({ ...s, status: "paid" }));
      toast.success("Payment confirmed");
      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    } else if (result.error !== "Payment not yet received") {
      setError(result.error ?? null);
    }

    setVerifying(false);
  }, [session.id, session.status, router]);

  useEffect(() => {
    if (session.status !== "waiting") return;
    const id = setInterval(pollVerify, 10000);
    return () => clearInterval(id);
  }, [session.status, pollVerify]);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    const result = await cancelPaymentSessionAction(session.id);
    if (!result.success) {
      setError(result.error ?? "Could not cancel");
      setCancelling(false);
      return;
    }
    setSession((s) => ({ ...s, status: "expired" }));
    setCancelling(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-popup-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <CloseButton onClick={onClose} className="absolute right-4 top-4" />

        <h2 id="payment-popup-title" className="font-heading text-xl font-semibold text-gold">
          Pay invoice
        </h2>
        <p className="mt-1 text-sm text-muted">{storeName}</p>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Invoice</dt>
            <dd className="font-mono">{invoiceNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Amount</dt>
            <dd className="font-heading text-lg text-gold">
              {Number(session.amount).toFixed(6)} {session.currency}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">≈ USD</dt>
            <dd>${Number(session.amount_usd).toFixed(2)}</dd>
          </div>
          {merchantWallet && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted shrink-0">Merchant wallet</dt>
              <dd className="truncate font-mono text-xs">{truncateAddress(merchantWallet, 6)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Status</dt>
            <dd className={STATUS_COLORS[displayStatus]}>{STATUS_LABELS[displayStatus]}</dd>
          </div>
          {session.status === "waiting" && (
            <div className="flex justify-between">
              <dt className="text-muted">Expires in</dt>
              <dd className="font-mono text-amber-400">{countdown}</dd>
            </div>
          )}
        </dl>

        {session.deposit_address && session.status === "waiting" && (
          <div className="mt-6 rounded-xl border border-border bg-surface/80 p-4">
            <p className="text-xs text-muted uppercase tracking-wider">Send to deposit address</p>
            <p className="mt-2 break-all font-mono text-xs text-gold-secondary">
              {session.deposit_address}
            </p>
            {session.qr_payload && (
              <div className="mt-4 flex justify-center">
                <PaymentQrCode value={session.qr_payload} />
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex gap-3">
          {session.status === "waiting" && (
            <>
              <Button
                type="button"
                className="flex-1"
                disabled={verifying}
                onClick={pollVerify}
              >
                {verifying ? "Checking…" : "I have paid"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={cancelling}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </>
          )}
          {(session.status === "paid" || displayStatus === "completed") && (
            <Button type="button" className="flex-1" onClick={onClose}>
              Done
            </Button>
          )}
          {(session.status === "expired" || session.status === "failed") && (
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
