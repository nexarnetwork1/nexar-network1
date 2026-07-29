import Link from "next/link";
import { Package, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

type MarketplaceBrowseEmptyStateProps = {
  hasFilters: boolean;
  basePath?: string;
};

export function MarketplaceBrowseEmptyState({
  hasFilters,
  basePath = "/marketplace/browse",
}: MarketplaceBrowseEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="relative mt-12 overflow-hidden rounded-3xl border border-border bg-card/40 p-12 text-center backdrop-blur-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
          <Search className="h-8 w-8 text-gold/70" aria-hidden />
        </div>
        <p className="text-lg font-medium text-white">No products match your filters</p>
        <p className="mt-2 text-sm text-muted">
          Try different keywords, adjust price or rating filters, or clear everything to browse all
          products.
        </p>
        <Link href={basePath} className="mt-6 inline-block">
          <Button variant="secondary">Clear all filters</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mt-12 overflow-hidden rounded-3xl border border-border bg-card/40 p-12 text-center backdrop-blur-md">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
        <Package className="h-8 w-8 text-gold/70" aria-hidden />
      </div>
      <p className="text-lg font-medium text-white">No products listed yet</p>
      <p className="mt-2 text-sm text-muted">
        Merchants are onboarding to the marketplace. Check back soon or browse verified stores.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/marketplace/stores">
          <Button variant="secondary">Browse stores</Button>
        </Link>
        <Link href="/register/merchant">
          <Button variant="ghost">Become a merchant</Button>
        </Link>
      </div>
    </div>
  );
}
