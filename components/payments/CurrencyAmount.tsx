import { cn } from "@/lib/utils/cn";
import { currencyDecimals, getCurrencyMeta } from "@/lib/constants/payment-branding";
import { CurrencyLogo } from "./CurrencyLogo";

type CurrencyAmountProps = {
  amount: number;
  currency: string;
  decimals?: number;
  size?: number;
  showCode?: boolean;
  className?: string;
  amountClassName?: string;
  logoClassName?: string;
};

export function CurrencyAmount({
  amount,
  currency,
  decimals,
  size = 18,
  showCode = true,
  className,
  amountClassName,
  logoClassName,
}: CurrencyAmountProps) {
  const meta = getCurrencyMeta(currency);
  const places = currencyDecimals(currency, decimals);
  const formatted = Number(amount).toFixed(places);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CurrencyLogo
        code={currency}
        size={size}
        showLabel={false}
        className={logoClassName}
      />
      <span className={cn("tabular-nums", amountClassName)}>
        {formatted}
        {showCode && (
          <span className="ml-1 font-medium">{meta.symbol}</span>
        )}
      </span>
    </span>
  );
}

/** USD amount with logo — for fiat-denominated totals */
export function UsdAmount({
  amount,
  size = 18,
  className,
  amountClassName,
}: {
  amount: number;
  size?: number;
  className?: string;
  amountClassName?: string;
}) {
  return (
    <CurrencyAmount
      amount={amount}
      currency="USD"
      size={size}
      showCode={false}
      className={className}
      amountClassName={amountClassName}
    />
  );
}
