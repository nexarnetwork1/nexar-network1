import Link from "next/link";
import type { MarketplaceCategory } from "@/modules/marketplace/home";
import { SectionHeading } from "@/components/ui/SectionHeading";

type MarketplaceCategoryGridProps = {
  categories: MarketplaceCategory[];
};

export function MarketplaceCategoryGrid({ categories }: MarketplaceCategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <section className="py-10 sm:py-12">
      <SectionHeading
        eyebrow="Categories"
        title="Browse by category"
        description="Explore products across electronics, fashion, digital goods, and more."
        className="mb-8"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/marketplace/browse?category=${category.slug}`}
            className="luxury-border group rounded-2xl bg-card/40 px-4 py-5 backdrop-blur-md transition hover:border-gold/30 hover:bg-card/55"
          >
            <p className="font-heading text-base font-semibold group-hover:text-gold">
              {category.name}
            </p>
            {category.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted">{category.description}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
