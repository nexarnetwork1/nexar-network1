"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { CommerceProduct } from "@/lib/commerce/types";
import { CommerceImage } from "./CommerceImage";

type CommerceProductCardProps = {
  product: CommerceProduct;
  index?: number;
  badge?: "trending" | "new" | "rated" | "deal";
};

export function CommerceProductCard({
  product,
  index = 0,
}: CommerceProductCardProps) {
  const discount = product.discount_percent;
  const listPrice =
    discount && discount > 0
      ? Number(product.price) / (1 - discount / 100)
      : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="nxr-card nxr-card-interactive group overflow-hidden"
    >
      <Link href={MARKETPLACE_ROUTES.product(product.slug || product.id)}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#121212]">
          <CommerceImage
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            fallback={product.name.slice(0, 1)}
          />
          {discount ? (
            <span className="absolute left-3 top-3 rounded-[0.35rem] bg-gold px-2 py-0.5 text-[10px] font-bold tracking-wide text-background">
              -{discount}%
            </span>
          ) : null}
        </div>

        <div className="space-y-2 p-4">
          {product.avg_rating ? (
            <span className="inline-flex items-center gap-1 text-xs text-gold">
              <Star className="h-3 w-3 fill-gold" aria-hidden />
              {product.avg_rating}
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-xs text-gold/80">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-gold/70 text-gold/70" aria-hidden />
              ))}
            </span>
          )}

          <h3 className="line-clamp-2 font-heading text-sm font-medium leading-snug text-white">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <p className="font-semibold text-gold">
              {Number(product.price).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs font-normal text-muted">{product.currency}</span>
            </p>
            {listPrice ? (
              <p className="text-xs text-muted line-through">
                {listPrice.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
