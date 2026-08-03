import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DashboardEmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Compact variant for use inside a table body. */
  inset?: boolean;
};

export function DashboardEmptyState({
  title,
  description,
  icon,
  action,
  className,
  inset = false,
}: DashboardEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        inset ? "px-4 py-10" : "nxr-card border-dashed px-6 py-14",
        className,
      )}
    >
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface/60 text-muted">
          {icon}
        </span>
      )}
      <p className="font-heading text-base font-medium text-white">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
