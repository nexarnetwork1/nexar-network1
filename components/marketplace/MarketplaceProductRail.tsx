import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductWithStore } from "@/types";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getProductRatingSummaries } from "@/modules/reviews/repository";

type MarketplaceProductRailProps = {
  title: string;
  description?: string;
  products: ProductWithStore[];
  viewAllHref?: string;
  showNewBadge?: boolean;
  productBasePath?: string;
};

export async function MarketplaceProductRail({
  title,
  description,
  products,
  viewAllHref,
  showNewBadge,
  productBasePath = "/marketplace/products",
}: MarketplaceProductRailProps) {
  if (products.length === 0) return null;

  const ratingSummaries = await getProductRatingSummaries(
    products.map((product) => product.id)
  );

  return (
    <section className="py-10 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title={title} description={description} className="max-w-2xl" />
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm text-gold hover:text-gold-secondary"
          >
            View all
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showNewBadge={showNewBadge}
            productBasePath={productBasePath}
            ratingSummary={ratingSummaries.get(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
