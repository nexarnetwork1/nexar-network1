import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { searchShop } from "@/modules/marketplace/storefront/repository";
import { ShopSearchView } from "@/components/storefront/ShopSearchView";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import { getStoreBySlug } from "@/modules/stores/repository";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function StoreShopPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const result = await searchShop({
    storeSlug: slug,
    query: sp.q,
    categorySlug: sp.category,
    brandId: sp.brand,
    sort: (sp.sort as "newest") ?? "newest",
    inStock: sp.inStock === "1",
    page: Number(sp.page ?? 1),
    limit: 24,
  });

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-8">
        <Link href={MARKETPLACE_ROUTES.store(slug)} className="text-sm text-gold hover:underline">
          ← {store.name}
        </Link>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-white">Shop</h1>
      </div>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <ShopSearchView result={result} storeSlug={slug} />
      </Suspense>
    </Container>
  );
}
