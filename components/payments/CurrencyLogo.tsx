import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { getCurrencyMeta } from "@/lib/constants/payment-branding";

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

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {upper === "NXR" ? (
        <Image
          src="/logo.png"
          alt="NXR"
          width={size}
          height={size}
          className="rounded-full object-contain"
        />
      ) : (
        <CurrencySvg code={upper} size={size} />
      )}
      {showLabel && (
        <span className="text-sm font-medium">{meta.symbol}</span>
      )}
    </span>
  );
}

function CurrencySvg({ code, size }: { code: string; size: number }) {
  const colors: Record<string, string> = {
    BNB: "#F3BA2F",
    USDT: "#26A17B",
    BTC: "#F7931A",
    ETH: "#627EEA",
    USD: "#85BB65",
    EUR: "#003399",
    EGP: "#CE1126",
  };
  const fill = colors[code] ?? "#888";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="16" cy="16" r="16" fill={fill} />
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fill="white"
        fontSize="10"
        fontWeight="bold"
        fontFamily="system-ui,sans-serif"
      >
        {code.slice(0, 3)}
      </text>
    </svg>
  );
}
