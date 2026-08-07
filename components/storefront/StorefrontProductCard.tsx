"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { StorefrontProduct } from "@/modules/marketplace/storefront/types";

type StorefrontProductCardProps = {
  product: StorefrontProduct;
  index?: number;
  storeSlug?: string;
};

export function StorefrontProductCard({ product, index = 0 }: StorefrontProductCardProps) {
  const handle = product.slug || product.id;
  const href = MARKETPLACE_ROUTES.product(handle);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="nxr-card nxr-card-interactive group overflow-hidden"
    >
      <Link href={href}>
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-1">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-gold/35">
              {product.name.slice(0, 1)}
            </div>
          )}
          {product.is_on_sale && (
            <span className="absolute left-3 top-3 rounded-[0.35rem] bg-gold px-2 py-0.5 text-[10px] font-bold text-background">
              Sale
            </span>
          )}
        </div>
        <div className="space-y-2 p-4">
          {(product.avg_rating ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-gold">
              <Star className="h-3 w-3 fill-gold" aria-hidden />
              {product.avg_rating}
            </span>
          ) : null}
          {product.marketplace_category_name && (
            <p className="text-[10px] tracking-[0.14em] text-muted uppercase">
              {product.marketplace_category_name}
            </p>
          )}
          <h3 className="line-clamp-2 font-heading text-sm font-medium text-white">
            {product.name}
          </h3>
          <p className="font-semibold text-gold">
            {Number(product.price).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{" "}
            <span className="text-xs font-normal text-muted">{product.currency}</span>
          </p>
          {product.stock <= 0 && (
            <p className="text-xs text-error">Out of stock</p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

export function StorefrontProductGrid({
  products,
  storeSlug,
}: {
  products: StorefrontProduct[];
  storeSlug?: string;
}) {
  if (!products.length) {
    return (
      <p className="nxr-card px-6 py-12 text-center text-sm text-muted">
        No products available yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <StorefrontProductCard key={product.id} product={product} index={i} storeSlug={storeSlug} />
      ))}
    </div>
  );
}
