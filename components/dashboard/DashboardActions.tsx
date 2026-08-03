import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DashboardActionsProps = {
  children: ReactNode;
  className?: string;
  /** Stretches children to full width on mobile so tap targets stay large. */
  stackOnMobile?: boolean;
};

/** Action cluster for page headers, cards and table rows. */
export function DashboardActions({
  children,
  className,
  stackOnMobile = false,
}: DashboardActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        stackOnMobile && "w-full [&>*]:w-full sm:w-auto sm:[&>*]:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
