import { cn } from "@/lib/utils/cn";

type SkeletonProps = {
  className?: string;
};

/** Soft pulse block for branded skeleton loaders. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--nxr-radius-sm)] bg-white/[0.07]",
        className,
      )}
      aria-hidden
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
