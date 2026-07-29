"use client";

import { cn } from "@/lib/utils/cn";

type CommerceImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: string;
};

export function CommerceImage({
  src,
  alt,
  className,
  fallback,
}: CommerceImageProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-surface to-card text-gold/40",
          className,
        )}
        aria-label={alt}
      >
        <span className="font-heading text-2xl font-semibold uppercase">
          {fallback ?? alt.slice(0, 2)}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={cn("object-cover", className)} loading="lazy" />
  );
}
