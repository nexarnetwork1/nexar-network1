"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Store } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { MarketplaceArtwork } from "@/components/marketplace/MarketplaceArtwork";
import { CartBadgeClient } from "@/components/cart/CartBadgeClient";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";

type MarketplaceHeroProps = {
  categories: Array<{ slug: string; name: string }>;
};

export function MarketplaceHero({ categories }: MarketplaceHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <MarketplaceArtwork />
      <Container as="div" className="relative py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-medium tracking-[0.24em] text-gold uppercase"
          >
            Nexar Marketplace
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-4 font-heading text-[clamp(2.25rem,6vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em]"
          >
            Shop premium products with crypto
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg"
          >
            Discover verified merchants, compare ratings, and checkout with NXR, BNB, USDT, or card —
            all within the Nexar Network ecosystem.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <MarketplaceSearch />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/marketplace/browse">
              <Button variant="outline" magnetic className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Featured Products
              </Button>
            </Link>
            <Link href="/marketplace/stores">
              <Button variant="secondary" magnetic className="gap-2">
                <Store className="h-4 w-4" />
                Browse Stores
              </Button>
            </Link>
            <CartBadgeClient
              showIcon
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-4 py-2.5 text-sm text-muted transition hover:border-gold/30 hover:text-gold"
            />
          </motion.div>

          {categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-8 flex flex-wrap justify-center gap-2"
            >
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.slug}
                  href={`/marketplace/browse?category=${category.slug}`}
                  className="rounded-full border border-border/80 bg-card/40 px-3 py-1.5 text-xs text-muted transition hover:border-gold/30 hover:text-gold"
                >
                  {category.name}
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </Container>
    </section>
  );
}
