import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DashboardFiltersProps = {
  children: ReactNode;
  className?: string;
  /** Renders as a `<form>` so existing GET-based filter forms keep working. */
  as?: "div" | "form";
  action?: string;
  method?: "get" | "post";
};

/**
 * Filter bar for list pages. Stacks on mobile and only becomes a single row
 * once there is horizontal room, so no control gets clipped.
 */
export function DashboardFilters({
  children,
  className,
  as = "div",
  action,
  method,
}: DashboardFiltersProps) {
  const shared = cn(
    "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center",
    className,
  );

  if (as === "form") {
    return (
      <form action={action} method={method} className={shared}>
        {children}
      </form>
    );
  }

  return <div className={shared}>{children}</div>;
}

/** Shared input/select styling so every filter control lines up. */
export const dashboardFilterControlClass = cn(
  "h-11 min-w-0 rounded-xl border border-border bg-surface/60 px-3 text-sm text-white",
  "placeholder:text-muted focus:border-gold/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
);
