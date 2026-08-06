import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { ATLAS_ASSETS, ATLAS_BRAND } from "@/config/atlas-branding";

type AtlasLogoProps = {
  className?: string;
  /** Image height in pixels (width scales). */
  height?: number;
  priority?: boolean;
  /** Decorative only — hide from assistive tech when adjacent text names the brand. */
  decorative?: boolean;
};

/**
 * Official ATLAS lockup (globe + wordmark + byline).
 * Prefer this over inventing alternate marks.
 */
export function AtlasLogo({
  className,
  height = 40,
  priority = false,
  decorative = false,
}: AtlasLogoProps) {
  const width = Math.round(height * 4);

  return (
    <Image
      src={ATLAS_ASSETS.logoPrimary}
      alt={decorative ? "" : `${ATLAS_BRAND.name} by NEXAR NETWORK`}
      width={width}
      height={height}
      className={cn("w-auto object-contain", className)}
      style={{ height }}
      priority={priority}
      aria-hidden={decorative || undefined}
    />
  );
}
