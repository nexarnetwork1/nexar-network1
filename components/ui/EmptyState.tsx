import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Compact variant for table / list bodies. */
  inset?: boolean;
};

/**
 * Guided empty surface — every empty list should explain the next step.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  inset = false,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "animate-atlas-fade-in flex flex-col items-center justify-center gap-3 text-center",
        inset
          ? "px-4 py-10"
          : "nxr-card border-dashed border-border px-6 py-14",
        className,
      )}
    >
      {icon && (
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface/60 text-muted transition-colors"
          aria-hidden
        >
          {icon}
        </span>
      )}
      <p className="font-heading text-base font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
