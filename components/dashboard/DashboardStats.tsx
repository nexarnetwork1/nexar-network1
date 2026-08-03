import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { DashboardCard } from "./DashboardCard";

export type DashboardStatTone = "default" | "gold" | "success" | "warning" | "danger";

const TONE_STYLES: Record<DashboardStatTone, string> = {
  default: "text-white",
  gold: "text-gold",
  success: "text-success",
  warning: "text-gold-accent",
  danger: "text-error",
};

type DashboardStatProps = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: DashboardStatTone;
  icon?: ReactNode;
  className?: string;
  /** Denser centred tile, for rows of simple counts rather than headline KPIs. */
  compact?: boolean;
};

/** Single KPI tile. Replaces the local `Stat` / `StatCard` helpers duplicated per page. */
export function DashboardStat({
  label,
  value,
  hint,
  tone = "default",
  icon,
  className,
  compact = false,
}: DashboardStatProps) {
  if (compact) {
    return (
      <DashboardCard flush className={cn("min-w-0 px-3 py-3 text-center", className)}>
        <p className="truncate text-xs text-muted">{label}</p>
        <p className={cn("mt-1 truncate font-heading text-xl", TONE_STYLES[tone])}>{value}</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className={cn("min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
        {icon && <span className="shrink-0 text-muted">{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-2 truncate font-heading text-xl font-semibold sm:text-2xl",
          TONE_STYLES[tone],
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </DashboardCard>
  );
}

type StatColumns = 2 | 3 | 4 | 5 | 6 | 7;

type DashboardStatsProps = {
  children: ReactNode;
  /** Column count at the widest breakpoint. Narrow screens always start at 1–2. */
  columns?: StatColumns;
  className?: string;
};

const COLUMN_STYLES: Record<StatColumns, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  7: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7",
};

/** Responsive KPI grid. */
export function DashboardStats({ children, columns = 4, className }: DashboardStatsProps) {
  return <div className={cn("grid gap-3 sm:gap-4", COLUMN_STYLES[columns], className)}>{children}</div>;
}
