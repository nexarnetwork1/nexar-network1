import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getCurrentProfile } from "@/modules/users/repository";
import { getStorefrontPageData } from "@/modules/marketplace/storefront/repository";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontCollections } from "@/components/storefront/StorefrontCollections";
import { StorefrontProductGrid } from "@/components/storefront/StorefrontProductCard";
import { StorefrontReviews } from "@/components/storefront/StorefrontReviews";
import {
  StoreContact,
  StorePolicies,
  StoreSocialLinks,
} from "@/components/storefront/StoreSocialLinks";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ collection?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  const data = await getStorefrontPageData(slug, profile?.id);
  if (!data) return { title: "Store not found" };

  const seo = data.profile;
  return {
    title: seo.seo_title ?? data.store.name,
    description: seo.seo_description ?? data.profile.description ?? undefined,
    keywords: seo.seo_keywords ?? undefined,
    openGraph: seo.og_image ? { images: [seo.og_image] } : undefined,
    alternates: seo.canonical_url ? { canonical: seo.canonical_url } : undefined,
  };
}

export default async function StorefrontPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  const data = await getStorefrontPageData(slug, profile?.id);

  if (!data) notFound();

  const { store, collections, featured_products, store_reviews, profile: mp } = data;
  const activeCollection = sp.collection
    ? collections.find((c) => c.slug === sp.collection)
    : null;

  return (
    <Container className="py-8 sm:py-12">
      <StorefrontHeader store={store} description={mp.description ?? store.branding?.tagline} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`${MARKETPLACE_ROUTES.store(slug)}/shop`}
          className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:border-gold/30 hover:text-gold"
        >
          All products
        </Link>
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`${MARKETPLACE_ROUTES.store(slug)}?collection=${c.slug}`}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:border-gold/30 hover:text-gold"
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-10 space-y-14">
        {activeCollection ? (
          <section>
            <h2 className="font-heading text-2xl font-semibold text-white">
              {activeCollection.name}
            </h2>
            <div className="mt-6">
              <StorefrontProductGrid products={activeCollection.products} storeSlug={slug} />
            </div>
          </section>
        ) : (
          <>
            <section>
              <h2 className="font-heading text-2xl font-semibold text-white">Featured products</h2>
              <div className="mt-6">
                <StorefrontProductGrid products={featured_products} storeSlug={slug} />
              </div>
            </section>
            <StorefrontCollections collections={collections} storeSlug={slug} />
          </>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <StoreSocialLinks profile={mp} branding={store.branding} />
          <StoreContact profile={mp} />
        </div>

        <StorePolicies profile={mp} />
        <StorefrontReviews storeId={store.id} reviews={store_reviews} />
      </div>
    </Container>
  );
}
