import { CurrencyLogo } from "@/components/payments/CurrencyLogo";

type Props = {
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  showCurrencyLogo?: boolean;
};

const sizeClasses = {
  sm: { price: "text-base", compare: "text-xs" },
  md: { price: "text-lg", compare: "text-sm" },
  lg: { price: "text-3xl", compare: "text-lg" },
};

export function ProductPrice({
  price,
  compareAtPrice,
  currency,
  size = "md",
  showBadge = false,
  showCurrencyLogo = false,
}: Props) {
  const salePrice = Number(price);
  const listPrice =
    compareAtPrice != null && Number(compareAtPrice) > salePrice
      ? Number(compareAtPrice)
      : null;
  const classes = sizeClasses[size];
  const onSale = listPrice != null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-baseline gap-2">
        {showCurrencyLogo && (
          <CurrencyLogo code={currency} size={size === "lg" ? 24 : 18} />
        )}
        <span className={`font-heading text-gold ${classes.price}`}>
          {currency} {salePrice.toFixed(2)}
        </span>
        {listPrice != null && (
          <span className={`text-muted line-through ${classes.compare}`}>
            {currency} {listPrice.toFixed(2)}
          </span>
        )}
      </div>
      {showBadge && onSale && (
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">
          Sale
        </span>
      )}
    </div>
  );
}
