"use client";

import { QRCodeSVG } from "qrcode.react";
import { CurrencyLogo } from "./CurrencyLogo";

type PaymentQrCodeProps = {
  value: string;
  currency?: string;
  size?: number;
};

export function PaymentQrCode({ value, currency, size = 180 }: PaymentQrCodeProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-lg bg-white p-3">
        <QRCodeSVG value={value} size={size} level="M" />
      </div>
      {currency && (
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5">
          <CurrencyLogo code={currency} size={18} showLabel />
          <span className="text-xs text-muted">Scan to pay</span>
        </div>
      )}
    </div>
  );
}
