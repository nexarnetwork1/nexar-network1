import { cn } from "@/lib/utils/cn";
import { AtlasLogo } from "@/components/ui/AtlasLogo";

type LogoProps = {
  className?: string;
  /**
   * @deprecated Official lockup already includes wordmark + byline.
   * Kept for call-site compatibility; ignored.
   */
  showText?: boolean;
  /**
   * @deprecated ATLAS is the only platform mark. Ignored.
   */
  brand?: "atlas" | "nexar";
  priority?: boolean;
  /** Image height in pixels. */
  height?: number;
};

/**
 * Platform logo entry — always the official ATLAS lockup.
 * Prefer `AtlasLogo` for sized/decorative use; `Logo` for nav/footer defaults.
 */
export function Logo({
  className,
  priority = true,
  height = 40,
}: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <AtlasLogo height={height} priority={priority} />
    </div>
  );
}
