import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
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

/** Portal empty state — delegates to the shared ATLAS EmptyState primitive. */
export function DashboardEmptyState(props: DashboardEmptyStateProps) {
  return <EmptyState {...props} className={cn(props.className)} />;
}
