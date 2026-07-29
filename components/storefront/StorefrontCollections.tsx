import Link from "next/link";
import type { StoreCollection } from "@/modules/marketplace/storefront/types";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import { StorefrontProductGrid } from "./StorefrontProductCard";

type Props = {
  collections: StoreCollection[];
  storeSlug: string;
};

export function StorefrontCollections({ collections, storeSlug }: Props) {
  if (!collections.length) return null;

  return (
    <div className="space-y-12">
      {collections.map((collection) => (
        <section key={collection.id} id={collection.slug}>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl font-semibold text-white sm:text-2xl">
                {collection.name}
              </h2>
              {collection.description && (
                <p className="mt-1 text-sm text-muted">{collection.description}</p>
              )}
            </div>
            <Link
              href={`${MARKETPLACE_ROUTES.store(storeSlug)}?collection=${collection.slug}`}
              className="text-sm text-gold hover:underline"
            >
              View all
            </Link>
          </div>
          <StorefrontProductGrid products={collection.products.slice(0, 4)} storeSlug={storeSlug} />
        </section>
      ))}
    </div>
  );
}
