import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { getCurrentProfile } from "@/modules/users/repository";
import { getProductDetail } from "@/modules/marketplace/storefront/repository";
import { ProductDetailView } from "@/components/storefront/ProductDetailView";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductDetail(handle);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} · ${product.store.name}`,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const profile = await getCurrentProfile();
  const product = await getProductDetail(handle, profile?.id);
  if (!product) notFound();

  return (
    <Container className="py-8 sm:py-12">
      <ProductDetailView product={product} />
    </Container>
  );
}
