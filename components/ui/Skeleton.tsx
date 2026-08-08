import { cn } from "@/lib/utils/cn";

type SkeletonProps = {
  className?: string;
};

/** Shimmer skeleton — uses global nxr-skeleton token animation. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("nxr-skeleton", className)} aria-hidden />;
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
