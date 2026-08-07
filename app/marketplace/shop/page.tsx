import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { searchShop } from "@/modules/marketplace/storefront/repository";
import { ShopSearchView } from "@/components/storefront/ShopSearchView";
import { canonical } from "@/lib/constants/seo";
import { AtlasCommerceNav } from "@/components/atlas/marketplace/AtlasCommerceNav";
import { getStorefrontBySlug } from "@/modules/atlas-marketplace/repository";
import { getNetworkProfileByBusinessId } from "@/modules/atlas-network/repository";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse verified merchants and products across the Nexar Commerce marketplace, with crypto and card checkout.",
  alternates: canonical("/marketplace/shop"),
};

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function MarketplaceShopPage({ searchParams }: Props) {
  const sp = await searchParams;

  const result = await searchShop({
    storeSlug: sp.store,
    query: sp.q,
    categorySlug: sp.category,
    brandId: sp.brand,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    minRating: sp.minRating ? Number(sp.minRating) : undefined,
    sort: (sp.sort as "newest") ?? "newest",
    inStock: sp.inStock === "1",
    page: Number(sp.page ?? 1),
    limit: 24,
  });

  let companySlug: string | null = null;
  let companyName: string | null = null;
  if (sp.store) {
    const storefront = await getStorefrontBySlug(sp.store);
    if (storefront) {
      companyName = storefront.display_name;
      const networkProfile = await getNetworkProfileByBusinessId(storefront.business_id);
      companySlug = networkProfile?.slug ?? null;
    }
  }

  return (
    <Container className="py-8 sm:py-12">
      <AtlasCommerceNav
        className="mb-6"
        companySlug={companySlug}
        companyName={companyName}
      />
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-white">
          {companyName ? `${companyName} Store` : "Marketplace Shop"}
        </h1>
        <p className="mt-2 text-muted">Search and filter products across the Nexar Commerce network.</p>
      </div>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <ShopSearchView result={result} storeSlug={sp.store} />
      </Suspense>
    </Container>
  );
}
