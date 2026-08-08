import { CurrencyAmount } from "@/components/payments/CurrencyAmount";

type Props = {
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
};

const sizeMap = {
  sm: { logo: 16, amount: "text-base", compare: "text-xs" },
  md: { logo: 18, amount: "text-lg", compare: "text-sm" },
  lg: { logo: 24, amount: "text-3xl", compare: "text-lg" },
};

export function ProductPrice({
  price,
  compareAtPrice,
  currency,
  size = "md",
  showBadge = false,
}: Props) {
  const salePrice = Number(price);
  const listPrice =
    compareAtPrice != null && Number(compareAtPrice) > salePrice
      ? Number(compareAtPrice)
      : null;
  const styles = sizeMap[size];
  const onSale = listPrice != null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <CurrencyAmount
          amount={salePrice}
          currency={currency}
          size={styles.logo}
          amountClassName={`font-heading text-gold ${styles.amount}`}
        />
        {listPrice != null && (
          <CurrencyAmount
            amount={listPrice}
            currency={currency}
            size={styles.logo - 2}
            amountClassName={`text-muted line-through ${styles.compare}`}
          />
        )}
      </div>
      {showBadge && onSale && (
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-success">
          Sale
        </span>
      )}
    </div>
  );
}
