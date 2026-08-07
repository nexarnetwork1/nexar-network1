import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { SITE } from "@/lib/constants/site";

type LogoProps = {
  className?: string;
  showText?: boolean;
  /** @deprecated Marketing site always uses Nexar. Kept for call-site compatibility. */
  brand?: "atlas" | "nexar";
  priority?: boolean;
  /** Image height in pixels. */
  height?: number;
};

/**
 * Nexar Network logo for the public marketing site (nav, footer, mobile menu).
 * ATLAS branding lives in `AtlasLogo` inside the application shell only.
 */
export function Logo({
  className,
  showText = false,
  priority = true,
  height = 40,
}: LogoProps) {
  const width = Math.round(height * 4);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/images/logo.png"
        alt="Nexar Network"
        width={width}
        height={height}
        className="w-auto object-contain"
        style={{ height }}
        priority={priority}
      />
      {showText ? (
        <div className="flex flex-col leading-none">
          <span className="font-heading text-sm font-semibold tracking-[0.18em] text-white uppercase">
            {SITE.name}
          </span>
          <span className="font-mono text-[10px] tracking-[0.35em] text-gold-secondary/80 uppercase">
            {SITE.ticker}
          </span>
        </div>
      ) : null}
    </div>
  );
}
