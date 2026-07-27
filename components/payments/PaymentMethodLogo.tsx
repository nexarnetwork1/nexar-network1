import { cn } from "@/lib/utils/cn";
import type { PaymentMethodCode } from "@/lib/constants/payment-branding";
import { CurrencyLogo } from "./CurrencyLogo";

type PaymentMethodLogoProps = {
  method: PaymentMethodCode;
  size?: number;
  showLabel?: boolean;
  className?: string;
};

export function PaymentMethodLogo({
  method,
  size = 20,
  showLabel = true,
  className,
}: PaymentMethodLogoProps) {
  const cryptoMap: Partial<Record<PaymentMethodCode, string>> = {
    nxr: "NXR",
    bnb: "BNB",
    usdt: "USDT",
    btc: "BTC",
    eth: "ETH",
  };

  if (cryptoMap[method]) {
    return (
      <CurrencyLogo
        code={cryptoMap[method]!}
        size={size}
        showLabel={showLabel}
        className={className}
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CardBrandSvg method={method} size={size} />
      {showLabel && <span className="text-xs font-medium">{labelFor(method)}</span>}
    </span>
  );
}

function labelFor(method: PaymentMethodCode): string {
  const labels: Record<PaymentMethodCode, string> = {
    nxr: "NXR",
    bnb: "BNB",
    usdt: "USDT",
    btc: "BTC",
    eth: "ETH",
    visa: "Visa",
    mastercard: "Mastercard",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    card: "Card",
  };
  return labels[method];
}

function CardBrandSvg({ method, size }: { method: PaymentMethodCode; size: number }) {
  const w = size * 1.6;
  const h = size;

  if (method === "visa") {
    return (
      <svg width={w} height={h} viewBox="0 0 48 32" aria-hidden className="shrink-0">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <text x="24" y="21" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontStyle="italic" fontFamily="Arial,sans-serif">VISA</text>
      </svg>
    );
  }
  if (method === "mastercard") {
    return (
      <svg width={w} height={h} viewBox="0 0 48 32" aria-hidden className="shrink-0">
        <rect width="48" height="32" rx="4" fill="#252525" />
        <circle cx="19" cy="16" r="8" fill="#EB001B" />
        <circle cx="29" cy="16" r="8" fill="#F79E1B" fillOpacity="0.9" />
      </svg>
    );
  }
  if (method === "apple_pay") {
    return (
      <svg width={w} height={h} viewBox="0 0 48 32" aria-hidden className="shrink-0">
        <rect width="48" height="32" rx="4" fill="#000" />
        <text x="24" y="20" textAnchor="middle" fill="white" fontSize="8" fontFamily="system-ui"> Apple Pay</text>
      </svg>
    );
  }
  if (method === "google_pay") {
    return (
      <svg width={w} height={h} viewBox="0 0 48 32" aria-hidden className="shrink-0">
        <rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd" />
        <text x="24" y="20" textAnchor="middle" fill="#4285F4" fontSize="7" fontFamily="system-ui">Google Pay</text>
      </svg>
    );
  }
  return (
    <svg width={w} height={h} viewBox="0 0 48 32" aria-hidden className="shrink-0">
      <rect width="48" height="32" rx="4" fill="#333" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="9" fontFamily="system-ui">Card</text>
    </svg>
  );
}
