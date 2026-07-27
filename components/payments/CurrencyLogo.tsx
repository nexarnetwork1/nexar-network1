import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  getCurrencyAsset,
  getCurrencyMeta,
} from "@/lib/constants/payment-branding";

type CurrencyLogoProps = {
  code: string;
  size?: number;
  showLabel?: boolean;
  className?: string;
};

export function CurrencyLogo({
  code,
  size = 20,
  showLabel = false,
  className,
}: CurrencyLogoProps) {
  const meta = getCurrencyMeta(code);
  const upper = code.toUpperCase();
  const src = getCurrencyAsset(upper);
  const isNxr = upper === "NXR";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Image
        src={src}
        alt={meta.label}
        width={size}
        height={size}
        className={cn(
          "shrink-0 object-contain",
          isNxr ? "rounded-full" : "rounded-sm"
        )}
        unoptimized={!isNxr}
      />
      {showLabel && (
        <span className="text-sm font-medium">{meta.symbol}</span>
      )}
    </span>
  );
}
