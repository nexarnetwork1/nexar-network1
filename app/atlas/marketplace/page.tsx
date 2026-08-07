import Link from "next/link";
import { MarketplaceGrid } from "@/components/atlas/app/MarketplaceGrid";
import { AtlasCommerceNav } from "@/components/atlas/marketplace/AtlasCommerceNav";
import { loadCommerceHomeData } from "@/lib/commerce/home-loader";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";

export default async function AtlasMarketplacePage() {
  const data = await loadCommerceHomeData();
  const products =
    data.topRatedProducts?.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      images: p.image_url ? [{ url: p.image_url }] : [],
      store: p.store_name,
    })) ?? [];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <AtlasCommerceNav />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-sm text-muted mt-1">
            Browse products from ATLAS companies — checkout via Nexar Commerce
          </p>
        </div>
        <Link
          href={MARKETPLACE_ROUTES.root}
          className="px-4 py-2 rounded-lg border border-gold/30 text-gold text-sm hover:bg-gold/10"
        >
          Open full shop
        </Link>
      </div>
      <MarketplaceGrid products={products} />
    </div>
  );
}
