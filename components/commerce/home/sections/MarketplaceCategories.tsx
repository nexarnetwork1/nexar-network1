"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Cpu,
  Gamepad2,
  Gem,
  Home,
  Laptop,
  Shirt,
  Sparkles,
  Wrench,
} from "lucide-react";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import { SectionShell } from "@/components/commerce/home/shared/SectionShell";
import type { CommerceCategory } from "@/lib/commerce/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  electronics: Laptop,
  fashion: Shirt,
  "digital-products": Cpu,
  software: Sparkles,
  gaming: Gamepad2,
  services: Wrench,
  crypto: Gem,
  home: Home,
  books: BookOpen,
  other: Sparkles,
};

type MarketplaceCategoriesProps = {
  categories: CommerceCategory[];
};

export function MarketplaceCategories({ categories }: MarketplaceCategoriesProps) {
  return (
    <SectionShell
      id="categories"
      eyebrow="Catalog"
      title="Marketplace categories"
      description="Dynamic category taxonomy with live product counts from the Nexar Commerce catalog."
    >
      {categories.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((category, i) => {
            const Icon = ICON_MAP[category.slug] ?? Sparkles;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Link
                  href={`${MARKETPLACE_ROUTES.shop}?category=${category.slug}`}
                  className="group block rounded-2xl border border-border/70 bg-gradient-to-br from-card/60 to-surface/30 p-5 backdrop-blur-md transition-colors hover:border-gold/30"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/5 text-gold transition-colors group-hover:bg-gold/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-base font-medium text-white group-hover:text-gold">
                    {category.name}
                  </h3>
                  {category.description ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                      {category.description}
                    </p>
                  ) : null}
                  <p className="mt-4 font-mono text-sm text-gold">
                    {category.product_count}{" "}
                    <span className="text-xs text-muted">products</span>
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">Categories will appear as the catalog grows.</p>
      )}
    </SectionShell>
  );
}
