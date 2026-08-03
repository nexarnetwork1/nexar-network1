import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DashboardContentProps = {
  children: ReactNode;
  className?: string;
  /** Caps the reading width on very wide screens. Set false for full-bleed pages. */
  constrained?: boolean;
};

/**
 * Scroll container for page content. `min-w-0` is what stops a wide table from
 * forcing the whole shell to scroll horizontally.
 */
export function DashboardContent({
  children,
  className,
  constrained = true,
}: DashboardContentProps) {
  return (
    <main
      className={cn(
        "min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        "pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <div className={cn("min-w-0", constrained && "mx-auto w-full max-w-[100rem]")}>{children}</div>
    </main>
  );
}
