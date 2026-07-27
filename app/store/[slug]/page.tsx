import { notFound } from "next/navigation";
import { getStorePublicProfile } from "@/modules/marketplace/repository";
import { searchMarketplaceProducts } from "@/modules/catalog/repository";
import { StorefrontClient } from "@/components/marketplace/StorefrontClient";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicStorePage({ params }: Props) {
  const { slug } = await params;
  const data = await getStorePublicProfile(slug);

  if (!data) notFound();

  const { products } = await searchMarketplaceProducts({
    storeSlug: slug,
    page: 1,
    limit: 24,
    sort: "newest",
    onSale: false,
    inStock: false,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <StorefrontClient
        store={data.store}
        profile={data.profile}
        settings={data.settings}
        products={products}
        productCount={data.productCount}
        salesCount={data.salesCount}
        rating={data.rating}
        verificationStatus={data.verificationStatus}
      />
    </div>
  );
}
