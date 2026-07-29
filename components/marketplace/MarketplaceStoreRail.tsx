import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StoreDirectoryEntry } from "@/types";
import { StoreCard } from "@/components/marketplace/StoreCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

type MarketplaceStoreRailProps = {
  title: string;
  description?: string;
  stores: StoreDirectoryEntry[];
  viewAllHref?: string;
};

export function MarketplaceStoreRail({
  title,
  description,
  stores,
  viewAllHref,
}: MarketplaceStoreRailProps) {
  if (stores.length === 0) return null;

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
        {stores.map((store) => (
          <StoreCard key={store.id} store={store} />
        ))}
      </div>
    </section>
  );
}
