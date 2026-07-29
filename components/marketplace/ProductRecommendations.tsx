import { ProductCard } from "@/components/marketplace/ProductCard";
import { getProductRatingSummaries } from "@/modules/reviews/repository";
import type { ProductWithStore } from "@/types";

type ProductRecommendationsProps = {
  title: string;
  products: ProductWithStore[];
  id?: string;
  productBasePath?: string;
};

export async function ProductRecommendations({
  title,
  products,
  id,
  productBasePath,
}: ProductRecommendationsProps) {
  if (!products.length) return null;

  const ratingSummaries = await getProductRatingSummaries(
    products.map((product) => product.id)
  );

  return (
    <section className="mt-16" aria-labelledby={id ?? "recommendations-heading"}>
      <h2 id={id ?? "recommendations-heading"} className="font-heading text-xl font-semibold">
        {title}
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard
              product={product}
              productBasePath={productBasePath}
              ratingSummary={ratingSummaries.get(product.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
