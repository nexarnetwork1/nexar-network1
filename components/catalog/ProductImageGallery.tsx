"use client";

import { useState } from "react";
import type { ProductImage } from "@/types";

type ProductImageGalleryProps = {
  images: ProductImage[];
  fallbackUrl?: string | null;
  alt: string;
};

export function ProductImageGallery({
  images,
  fallbackUrl,
  alt,
}: ProductImageGalleryProps) {
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  const urls =
    sorted.length > 0
      ? sorted.map((i) => i.url)
      : fallbackUrl
        ? [fallbackUrl]
        : [];

  const [active, setActive] = useState(0);

  if (urls.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-border bg-surface text-muted">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[active]}
        alt={alt}
        className="aspect-square w-full rounded-2xl object-cover"
      />
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {urls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(index)}
              className={`shrink-0 overflow-hidden rounded-lg border-2 ${
                index === active ? "border-gold" : "border-transparent opacity-70"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-16 w-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
