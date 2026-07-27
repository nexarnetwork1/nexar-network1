"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Currency } from "@/shared/payments";
import { QRCode } from "@/components/ui/QRCode";

interface QRCodeCardProps {
  walletAddress: string;
  amount: number;
  currency: Currency;
}

export function QRCodeCard({ walletAddress, amount, currency }: QRCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Generate payment data for QR code
  const paymentData = `${currency}:${walletAddress}?amount=${amount}`;

  return (
    <div className="rounded-xl border border-border bg-background/50 p-6">
      <h3 className="text-sm font-semibold text-white mb-4">Scan QR Code</h3>
      
      <div className="flex flex-col items-center space-y-4">
        {/* QR Code */}
        <div className="relative rounded-lg border-2 border-gold/20 p-4 bg-white">
          <QRCode
            value={paymentData}
            size={192}
            className="mx-auto"
            fgColor="#000000"
            bgColor="#FFFFFF"
          />
          <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-black">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Scan with your wallet app to pay
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {amount} {currency}
          </p>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
            copied
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-gold/30 bg-gold/10 text-gold hover:bg-gold/20"
          )}
          aria-label="Copy wallet address"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy Address</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
