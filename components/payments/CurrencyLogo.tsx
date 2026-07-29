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
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      {/* Native img avoids Android MIME/extension mismatches with nosniff + next/image SVG handling */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={meta.label}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={cn(
          "h-auto w-auto max-h-full max-w-full shrink-0 object-contain",
          isNxr ? "rounded-full" : "rounded-sm"
        )}
        style={{ width: size, height: size }}
      />
      {showLabel && (
        <span className="truncate text-sm font-medium">{meta.symbol}</span>
      )}
    </span>
  );
}
