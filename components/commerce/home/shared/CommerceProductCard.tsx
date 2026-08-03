"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Star, TrendingUp } from "lucide-react";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { CommerceProduct } from "@/lib/commerce/types";
import { CommerceImage } from "./CommerceImage";

type CommerceProductCardProps = {
  product: CommerceProduct;
  index?: number;
  badge?: "trending" | "new" | "rated" | "deal";
};

const BADGE_CONFIG = {
  trending: { icon: TrendingUp, label: "Trending" },
  new: { icon: Flame, label: "New" },
  rated: { icon: Star, label: "Top Rated" },
  deal: { icon: Flame, label: "Flash Deal" },
} as const;

export function CommerceProductCard({
  product,
  index = 0,
  badge,
}: CommerceProductCardProps) {
  const BadgeIcon = badge ? BADGE_CONFIG[badge].icon : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.05, duration: 0.45 }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md transition-colors hover:border-gold/25"
    >
      <Link href={MARKETPLACE_ROUTES.product(product.slug || product.id)}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <CommerceImage
            src={product.image_url}
            alt={product.name}
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
            fallback={product.name.slice(0, 1)}
          />
          {badge && BadgeIcon ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-gold/30 bg-background/80 px-2.5 py-1 text-[10px] tracking-wide text-gold uppercase backdrop-blur-md">
              <BadgeIcon className="h-3 w-3" />
              {BADGE_CONFIG[badge].label}
            </span>
          ) : null}
          {product.discount_percent ? (
            <span className="absolute right-3 top-3 rounded-full bg-gold px-2 py-1 text-[10px] font-semibold text-background">
              -{product.discount_percent}%
            </span>
          ) : null}
        </div>

        <div className="space-y-2 p-4">
          {product.store_name ? (
            <p className="text-[11px] tracking-wide text-muted uppercase">
              {product.store_name}
            </p>
          ) : null}
          <h3 className="line-clamp-2 font-heading text-sm font-medium text-white group-hover:text-gold">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="font-mono text-base text-gold">
              {Number(product.price).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-xs text-muted">{product.currency}</span>
            </p>
            {product.avg_rating ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Star className="h-3 w-3 fill-gold text-gold" />
                {product.avg_rating}
              </span>
            ) : product.units_sold ? (
              <span className="text-xs text-muted">{product.units_sold} sold</span>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
