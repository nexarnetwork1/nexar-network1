import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getCurrentProfile } from "@/modules/users/repository";
import {
  getProductDetail,
  getRecentlyViewedProducts,
} from "@/modules/marketplace/storefront/repository";
import { ProductDetailView } from "@/components/storefront/ProductDetailView";
import { StorefrontProductGrid } from "@/components/storefront/StorefrontProductCard";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";

type Props = {
  params: Promise<{ slug: string; handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductDetail(handle);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} · ${product.store.name}`,
    description: product.description?.slice(0, 160),
  };
}

export default async function StoreProductPage({ params }: Props) {
  const { slug, handle } = await params;
  const profile = await getCurrentProfile();
  const product = await getProductDetail(handle, profile?.id);

  if (!product || product.store.slug !== slug) notFound();

  const recentlyViewed = profile
    ? await getRecentlyViewedProducts(profile.id, 6)
    : [];

  return (
    <Container className="py-8 sm:py-12">
      <Link
        href={MARKETPLACE_ROUTES.store(slug)}
        className="text-sm text-gold hover:underline"
      >
        ← Back to {product.store.name}
      </Link>
      <div className="mt-6">
        <ProductDetailView product={product} />
      </div>
      {recentlyViewed.length > 0 && (
        <section className="mt-14">
          <h2 className="font-heading text-xl font-semibold text-white">Recently viewed</h2>
          <div className="mt-5">
            <StorefrontProductGrid products={recentlyViewed} />
          </div>
        </section>
      )}
    </Container>
  );
}
