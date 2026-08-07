"use client";

import { useState } from "react";
import { ShoppingCart, Heart, Store } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";

interface MarketplaceGridProps {
  products: any[];
}

export function MarketplaceGrid({ products }: MarketplaceGridProps) {
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  const promptAuth = () => {
    openCommerceAuth({
      mode: "signin",
      redirect: "/atlas/marketplace",
    });
  };

  const handleInteraction = () => {
    if (!session) promptAuth();
  };

  const handleLike = (productId: string) => {
    if (!session) {
      promptAuth();
      return;
    }
    setLikedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  if (products.length === 0) {
    return (
      <div className="p-12 nxr-card text-center">
        <Store className="h-12 w-12 text-muted mx-auto mb-4" />
        <p className="text-muted mb-2">No products available yet</p>
        <p className="text-sm text-muted">Check back soon for new listings!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isLiked={likedProducts.has(product.id)}
          onLike={() => handleLike(product.id)}
          onInteraction={handleInteraction}
        />
      ))}
    </div>
  );
}

function ProductCard({ product, isLiked, onLike, onInteraction }: { product: any; isLiked: boolean; onLike: () => void; onInteraction: () => void }) {
  return (
    <Link
      href={`/marketplace/products/${product.slug || product.id}`}
      className="group block nxr-card nxr-card-interactive overflow-hidden"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gradient-to-br from-gold/10 to-gold/5 flex items-center justify-center relative">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Store className="h-16 w-16 text-gold/30" />
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            onLike();
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
        >
          <Heart className={`h-4 w-4 ${isLiked ? "text-gold fill-current" : "text-white"}`} />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <p className="text-xs text-muted mb-1">
          {typeof product.store === "string"
            ? product.store
            : product.store?.name || "Store"}
        </p>
        <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">${Number(product.price).toFixed(2)}</p>
          {product.stock > 0 ? (
            <span className="text-xs text-emerald-400">In Stock</span>
          ) : (
            <span className="text-xs text-red-400">Out of Stock</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            onInteraction();
          }}
          className="mt-3 w-full py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-medium hover:bg-gold/20 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
