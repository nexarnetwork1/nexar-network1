"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BadgeCheck, Package, Star, Users } from "lucide-react";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { CommerceStore } from "@/lib/commerce/types";
import { CommerceImage } from "./CommerceImage";

type CommerceStoreCardProps = {
  store: CommerceStore;
  index?: number;
};

export function CommerceStoreCard({ store, index = 0 }: CommerceStoreCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-2xl border border-border/70 bg-card/50 backdrop-blur-md transition-colors hover:border-gold/30"
    >
      <div className="relative h-36 overflow-hidden">
        <CommerceImage
          src={store.banner_url}
          alt={`${store.name} banner`}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          fallback={store.name.slice(0, 1)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="h-12 w-12 overflow-hidden rounded-xl border border-border/80 bg-surface">
            <CommerceImage
              src={store.logo_url}
              alt={store.name}
              className="h-full w-full"
              fallback={store.name.slice(0, 1)}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading text-base font-semibold text-white">
                {store.name}
              </h3>
              {store.is_verified ? (
                <BadgeCheck className="h-4 w-4 text-gold" aria-label="Verified" />
              ) : null}
            </div>
            {store.tagline ? (
              <p className="text-xs text-muted line-clamp-1">{store.tagline}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-surface/60 px-2 py-2">
            <div className="flex items-center justify-center gap-1 text-gold">
              <Star className="h-3.5 w-3.5" />
              <span className="font-mono text-sm">{store.rating ?? 0}</span>
            </div>
            <p className="mt-0.5 text-[10px] tracking-wide text-muted uppercase">Rating</p>
          </div>
          <div className="rounded-xl bg-surface/60 px-2 py-2">
            <div className="flex items-center justify-center gap-1 text-white">
              <Users className="h-3.5 w-3.5 text-gold" />
              <span className="font-mono text-sm">{store.follower_count ?? 0}</span>
            </div>
            <p className="mt-0.5 text-[10px] tracking-wide text-muted uppercase">Followers</p>
          </div>
          <div className="rounded-xl bg-surface/60 px-2 py-2">
            <div className="flex items-center justify-center gap-1 text-white">
              <Package className="h-3.5 w-3.5 text-gold" />
              <span className="font-mono text-sm">{store.product_count ?? 0}</span>
            </div>
            <p className="mt-0.5 text-[10px] tracking-wide text-muted uppercase">Products</p>
          </div>
        </div>

        <Link
          href={MARKETPLACE_ROUTES.store(store.slug)}
          className="flex h-11 w-full items-center justify-center rounded-full border border-border bg-surface/80 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-gold/30 hover:bg-card"
        >
          Open Store
        </Link>
      </div>
    </motion.article>
  );
}
