import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DashboardCardElement = "div" | "section" | "article" | "aside" | "li";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  as?: DashboardCardElement;
  /** Removes inner padding so the card can hold a flush table or list. */
  flush?: boolean;
  interactive?: boolean;
};

/**
 * Shared portal surface. Uses the global `.nxr-card` system so dashboard tiles
 * match marketing cards, marketplace product tiles and auth panels.
 */
export function DashboardCard({
  children,
  className,
  as,
  flush = false,
  interactive = false,
}: DashboardCardProps) {
  const Component = as ?? "div";

  return (
    <Component
      className={cn(
        "nxr-card",
        !flush && "p-5",
        interactive && "nxr-card-interactive",
        className,
      )}
    >
      {children}
    </Component>
  );
}
