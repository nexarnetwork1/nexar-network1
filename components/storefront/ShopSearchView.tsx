"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { ShopSearchResult } from "@/modules/marketplace/storefront/types";
import { StorefrontProductGrid } from "./StorefrontProductCard";
import { cn } from "@/lib/utils/cn";

type Props = {
  result: ShopSearchResult;
  storeSlug?: string;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "bestsellers", label: "Best Sellers" },
];

export function ShopSearchView({ result, storeSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const currentSort = searchParams.get("sort") ?? "newest";
  const currentQ = searchParams.get("q") ?? "";

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-6 rounded-2xl border border-border/70 bg-card/30 p-5">
        <div>
          <label className="text-xs tracking-wide text-muted uppercase">Search</label>
          <input
            defaultValue={currentQ}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam("q", (e.target as HTMLInputElement).value);
              }
            }}
            placeholder="Search products…"
            className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-white outline-none focus:border-gold/40"
          />
        </div>

        <div>
          <p className="text-xs tracking-wide text-muted uppercase">Sort</p>
          <div className="mt-2 space-y-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateParam("sort", opt.value)}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  currentSort === opt.value
                    ? "bg-gold/10 text-gold"
                    : "text-muted hover:text-white",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {result.filters.categories.length > 0 && (
          <div>
            <p className="text-xs tracking-wide text-muted uppercase">Categories</p>
            <div className="mt-2 space-y-1">
              {result.filters.categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateParam("category", cat.slug)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:text-white"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {result.filters.brands.length > 0 && (
          <div>
            <p className="text-xs tracking-wide text-muted uppercase">Brands</p>
            <div className="mt-2 space-y-1">
              {result.filters.brands.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => updateParam("brand", brand.id)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:text-white"
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={searchParams.get("inStock") === "1"}
            onChange={(e) => updateParam("inStock", e.target.checked ? "1" : "")}
          />
          In stock only
        </label>
      </aside>

      <div>
        <div className="mb-4 flex items-center justify-between text-sm text-muted">
          <span>{result.total} products</span>
          <span>
            Page {result.page} · {result.limit} per page
          </span>
        </div>
        <StorefrontProductGrid products={result.items} storeSlug={storeSlug} />
      </div>
    </div>
  );
}
