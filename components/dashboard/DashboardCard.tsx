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
 * Surface primitive replacing the ad-hoc `rounded-2xl border border-border
 * bg-card/60` blocks.
 *
 * Deliberately translucent but *not* backdrop-blurred: a page can hold a dozen
 * cards, and one compositing layer each is the expensive way to buy a frosted
 * look. Blur is reserved for chrome and overlays, which appear once per screen.
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
        "rounded-2xl border border-border bg-card/60",
        !flush && "p-5",
        interactive &&
          "transition-colors hover:border-gold/30 hover:bg-card/75 focus-within:border-gold/30",
        className,
      )}
    >
      {children}
    </Component>
  );
}
