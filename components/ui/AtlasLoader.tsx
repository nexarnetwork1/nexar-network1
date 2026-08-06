import { cn } from "@/lib/utils/cn";
import { AtlasLogo } from "./AtlasLogo";

type AtlasLoaderProps = {
  label?: string;
  className?: string;
  /** Full-viewport branded splash vs inline. */
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: 36,
  md: 56,
  lg: 88,
} as const;

/**
 * Branded loading experience — official lockup only (no duplicate wordmark text).
 */
export function AtlasLoader({
  label = "Loading",
  className,
  fullScreen = false,
  size = "md",
}: AtlasLoaderProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "animate-atlas-fade-in flex flex-col items-center justify-center gap-4",
        fullScreen && "min-h-[calc(100dvh-var(--nxr-header-offset))] w-full px-6",
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        <span
          className="animate-atlas-pulse-ring absolute inset-0 rounded-full border border-gold/25"
          style={{ margin: "-12%" }}
          aria-hidden
        />
        <AtlasLogo height={sizeMap[size]} decorative />
      </div>
      <p className="text-sm text-muted">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
