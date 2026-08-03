"use client";

import { PaymentQrCode } from "@/components/payments/PaymentQrCode";
import { buildQrPayload } from "@/lib/qr/payload";
import type { QrCode } from "@/types";

const LABELS: Record<QrCode["qr_type"], string> = {
  marketplace: "Marketplace QR",
  payment_only: "Payment-only QR",
};

type StoreQrCodesProps = {
  codes: QrCode[];
};

export function StoreQrCodes({ codes }: StoreQrCodesProps) {
  if (codes.length === 0) {
    return (
      <p className="text-sm text-muted">
        QR codes will appear here once your store is active.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {codes.map((code) => {
        const qrUrl = code.payload.startsWith("http")
          ? code.payload
          : buildQrPayload(code.secret_token);

        return (
        <div
          key={code.id}
          className="rounded-2xl border border-border bg-card/60 p-5"
        >
          <p className="text-sm font-medium">{LABELS[code.qr_type]}</p>
          <p className="mt-1 break-all font-mono text-xs text-muted">
            {qrUrl}
          </p>
          <div className="mt-4 inline-block">
            <PaymentQrCode value={qrUrl} size={160} />
          </div>
        </div>
        );
      })}
    </div>
  );
}
