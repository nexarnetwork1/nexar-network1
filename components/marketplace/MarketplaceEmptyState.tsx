import Link from "next/link";
import { Store, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";

type MarketplaceEmptyStateProps = {
  hasFilters?: boolean;
};

export function MarketplaceEmptyState({ hasFilters }: MarketplaceEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="relative mt-12 overflow-hidden rounded-3xl border border-border bg-card/40 p-12 text-center backdrop-blur-md">
        <p className="text-lg font-medium text-white">No stores match your search</p>
        <p className="mt-2 text-sm text-muted">Try different keywords or clear filters.</p>
        <Link href="/marketplace/stores" className="mt-6 inline-block text-sm text-gold hover:underline">
          View all stores
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mt-12 overflow-hidden rounded-3xl border border-border bg-card/40 p-10 sm:p-14 text-center backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden>
        <Store className="absolute -left-4 top-8 h-32 w-32 rotate-12" strokeWidth={0.5} />
        <ShoppingBag className="absolute right-8 top-12 h-24 w-24 -rotate-6" strokeWidth={0.5} />
        <Package className="absolute bottom-6 left-1/3 h-28 w-28 rotate-3" strokeWidth={0.5} />
      </div>
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
          <Store className="h-8 w-8 text-gold/70" aria-hidden />
        </div>
        <h2 className="font-heading text-2xl font-semibold text-white">No stores yet</h2>
        <p className="mt-3 text-muted">
          Become the first verified merchant on Nexar Network and reach customers worldwide with
          crypto and card payments.
        </p>
        <Link href="/register/merchant" className="mt-8 inline-block">
          <Button size="lg" glow>
            Become First Merchant
          </Button>
        </Link>
        <Link href="/register/merchant" className="mt-3 block text-sm text-gold hover:underline">
          Register your store →
        </Link>
      </div>
    </div>
  );
}
