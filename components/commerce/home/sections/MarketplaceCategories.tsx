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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
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
      title="Popular Categories"
      description="Browse curated collections from verified merchants."
      align="center"
    >
      {categories.length ? (
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {categories.map((category, i) => {
            const Icon = ICON_MAP[category.slug] ?? Sparkles;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`${MARKETPLACE_ROUTES.shop}?category=${category.slug}`}
                  className="nxr-card nxr-card-interactive group flex flex-col items-center justify-center gap-3 px-4 py-7 text-center"
                >
                  <Icon
                    className="h-8 w-8 text-gold transition-transform duration-300 group-hover:scale-105"
                    strokeWidth={1.4}
                    aria-hidden
                  />
                  <h3 className="font-heading text-sm font-medium tracking-wide text-white">
                    {category.name}
                  </h3>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-sm text-muted">
          Categories will appear as the catalog grows.
        </p>
      )}
    </SectionShell>
  );
}
