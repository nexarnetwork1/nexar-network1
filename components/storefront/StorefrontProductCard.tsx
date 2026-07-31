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

export function StorefrontProductCard({ product, index = 0, storeSlug }: StorefrontProductCardProps) {
  const handle = product.slug || product.id;
  const href = MARKETPLACE_ROUTES.product(handle);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-border/70 bg-card/40 transition-colors hover:border-gold/25"
    >
      <Link href={href}>
        <div className="relative aspect-[4/3] overflow-hidden bg-surface">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-gold/30">
              {product.name.slice(0, 1)}
            </div>
          )}
          {product.is_on_sale && (
            <span className="absolute left-3 top-3 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-background">
              Sale
            </span>
          )}
        </div>
        <div className="p-4">
          {product.marketplace_category_name && (
            <p className="text-[10px] tracking-wide text-muted uppercase">
              {product.marketplace_category_name}
            </p>
          )}
          <h3 className="mt-1 line-clamp-2 font-heading text-sm font-medium text-white group-hover:text-gold">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <p className="font-mono text-base text-gold">
              {Number(product.price).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs text-muted">{product.currency}</span>
            </p>
            {(product.avg_rating ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Star className="h-3 w-3 fill-gold text-gold" />
                {product.avg_rating}
              </span>
            )}
          </div>
          {product.stock <= 0 && (
            <p className="mt-2 text-xs text-red-400">Out of stock</p>
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
      <p className="rounded-2xl border border-border/60 bg-card/30 px-6 py-12 text-center text-sm text-muted">
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
