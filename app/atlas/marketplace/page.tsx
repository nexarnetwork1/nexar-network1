import { MarketplaceGrid } from "@/components/atlas/app/MarketplaceGrid";
import { loadCommerceHomeData } from "@/lib/commerce/home-loader";

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
    <div className="max-w-6xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Marketplace</h1>
      <MarketplaceGrid products={products} />
    </div>
  );
}
