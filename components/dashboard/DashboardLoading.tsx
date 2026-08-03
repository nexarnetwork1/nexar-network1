import { cn } from "@/lib/utils/cn";
import { DashboardCard } from "./DashboardCard";

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/8", className)} />;
}

type DashboardLoadingProps = {
  /** Which skeleton to draw. Match it to what the route actually renders. */
  variant?: "page" | "stats" | "table" | "cards";
  rows?: number;
  className?: string;
  label?: string;
};

/** Skeletons for `loading.tsx` files and Suspense boundaries. */
export function DashboardLoading({
  variant = "page",
  rows = 5,
  className,
  label = "Loading",
}: DashboardLoadingProps) {
  const rowKeys = Array.from({ length: rows }, (_, index) => index);

  const stats = (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((key) => (
        <DashboardCard key={key}>
          <Shimmer className="h-3 w-20" />
          <Shimmer className="mt-3 h-7 w-24" />
        </DashboardCard>
      ))}
    </div>
  );

  const table = (
    <DashboardCard flush className="overflow-hidden">
      <div className="border-b border-border px-4 py-3.5">
        <Shimmer className="h-3.5 w-32" />
      </div>
      <div className="divide-y divide-border">
        {rowKeys.map((key) => (
          <div key={key} className="flex items-center gap-4 px-4 py-4">
            <Shimmer className="h-3.5 flex-1" />
            <Shimmer className="hidden h-3.5 w-24 sm:block" />
            <Shimmer className="h-3.5 w-16" />
          </div>
        ))}
      </div>
    </DashboardCard>
  );

  const cards = (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rowKeys.map((key) => (
        <DashboardCard key={key}>
          <Shimmer className="h-4 w-32" />
          <Shimmer className="mt-3 h-3 w-full" />
          <Shimmer className="mt-2 h-3 w-2/3" />
        </DashboardCard>
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-6", className)} role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>

      {variant === "page" && (
        <>
          <div>
            <Shimmer className="h-7 w-48" />
            <Shimmer className="mt-2 h-3.5 w-64" />
          </div>
          {stats}
          {table}
        </>
      )}

      {variant === "stats" && stats}
      {variant === "table" && table}
      {variant === "cards" && cards}
    </div>
  );
}
