type Props = {
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  size?: "sm" | "md" | "lg";
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
}: Props) {
  const salePrice = Number(price);
  const listPrice =
    compareAtPrice != null && Number(compareAtPrice) > salePrice
      ? Number(compareAtPrice)
      : null;
  const classes = sizeClasses[size];

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-heading text-gold ${classes.price}`}>
        {currency} {salePrice.toFixed(2)}
      </span>
      {listPrice != null && (
        <span className={`text-muted line-through ${classes.compare}`}>
          {currency} {listPrice.toFixed(2)}
        </span>
      )}
    </div>
  );
}
