"use client";

import { QRCodeSVG } from "qrcode.react";

type PaymentQrCodeProps = {
  value: string;
  size?: number;
};

export function PaymentQrCode({ value, size = 180 }: PaymentQrCodeProps) {
  return (
    <div className="rounded-lg bg-white p-3">
      <QRCodeSVG value={value} size={size} level="M" />
    </div>
  );
}
