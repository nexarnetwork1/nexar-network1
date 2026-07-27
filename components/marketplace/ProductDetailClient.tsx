"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { trackProductViewAction } from "@/modules/wishlist/actions";
import type { ProductWithDetails } from "@/types";

type Props = {
  product: ProductWithDetails;
  children: React.ReactNode;
};

export function ProductDetailClient({ product, children }: Props) {
  const { track } = useRecentlyViewed();

  useEffect(() => {
    track(product.id);
    trackProductViewAction(product.id).catch(() => undefined);
  }, [product.id, track]);

  return <>{children}</>;
}
