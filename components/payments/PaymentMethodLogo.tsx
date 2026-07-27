import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  getPaymentMethodAsset,
  getPaymentMethodLabel,
  normalizePaymentMethodCode,
  type PaymentMethodCode,
} from "@/lib/constants/payment-branding";
import { CurrencyLogo } from "./CurrencyLogo";

type PaymentMethodLogoProps = {
  method: string;
  size?: number;
  showLabel?: boolean;
  className?: string;
};

const CRYPTO_METHODS = new Set(["nxr", "bnb", "usdt", "btc", "eth"]);

export function PaymentMethodLogo({
  method,
  size = 20,
  showLabel = true,
  className,
}: PaymentMethodLogoProps) {
  const code = normalizePaymentMethodCode(method);

  if (CRYPTO_METHODS.has(code)) {
    const currencyCode = code.toUpperCase();
    return (
      <CurrencyLogo
        code={currencyCode}
        size={size}
        showLabel={showLabel}
        className={className}
      />
    );
  }

  const src = getPaymentMethodAsset(method);
  const label = getPaymentMethodLabel(method);
  const isWide = ["visa", "mastercard", "apple_pay", "google_pay", "card"].includes(code);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Image
        src={src}
        alt={label}
        width={isWide ? Math.round(size * 1.6) : size}
        height={size}
        className="shrink-0 object-contain"
        unoptimized
      />
      {showLabel && (
        <span className="text-xs font-medium">{label}</span>
      )}
    </span>
  );
}

/** Type-safe variant for known store payment method codes */
export function BrandedPaymentMethod({
  method,
  size = 20,
  showLabel = true,
  className,
}: {
  method: PaymentMethodCode;
  size?: number;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <PaymentMethodLogo
      method={method}
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}
