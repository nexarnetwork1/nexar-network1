import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorePublicProfile } from "@/modules/marketplace/repository";
import { getStoreTrustMetrics } from "@/modules/marketplace/recommendations";
import { searchMarketplaceProducts } from "@/modules/catalog/repository";
import { getStoreReviews, getStoreRatingSummary } from "@/modules/reviews/repository";
import { StorefrontClient } from "@/components/marketplace/StorefrontClient";
import { buildStoreMetadata, buildStoreJsonLd } from "@/lib/seo/marketplace";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorePublicProfile(slug);
  if (!data) return { title: "Store not found" };

  return buildStoreMetadata({
    name: data.store.name,
    description: data.profile.description ?? null,
    logoUrl: data.store.logo_url,
    slug,
  });
}

export default async function PublicStorePage({ params }: Props) {
  const { slug } = await params;
  const data = await getStorePublicProfile(slug);

  if (!data) notFound();

  const [{ products }, storeReviews, ratingSummary, trustMetrics] = await Promise.all([
    searchMarketplaceProducts({
      storeSlug: slug,
      page: 1,
      limit: 24,
      sort: "newest",
      onSale: false,
      inStock: false,
    }),
    getStoreReviews(data.store.id),
    getStoreRatingSummary(data.store.id),
    getStoreTrustMetrics(data.store.id),
  ]);

  const jsonLd = buildStoreJsonLd({
    name: data.store.name,
    description: data.profile.description ?? null,
    logoUrl: data.store.logo_url,
    slug,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StorefrontClient
        store={data.store}
        profile={data.profile}
        settings={data.settings}
        products={products}
        productCount={data.productCount}
        salesCount={data.salesCount}
        rating={ratingSummary.avg || data.rating}
        verificationStatus={data.verificationStatus}
        storeReviews={storeReviews}
        reviewCount={ratingSummary.count}
        trustMetrics={trustMetrics}
      />
    </div>
  );
}
