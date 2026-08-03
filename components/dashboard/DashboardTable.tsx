import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Table primitives with the responsive behaviour every dashboard table needs:
 * a horizontal scroll container, a sticky header row and consistent spacing.
 *
 * These are presentational only — sorting, filtering and pagination stay in the
 * pages that already implement them.
 */

type Align = "left" | "center" | "right";
type Breakpoint = "sm" | "md" | "lg" | "xl";

const ALIGN_STYLES: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/** Columns that only appear once there is room for them. */
const HIDE_BELOW_STYLES: Record<Breakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

type DashboardTableProps = {
  children: ReactNode;
  /** Screen-reader description of the table contents. */
  caption?: string;
  className?: string;
  wrapperClassName?: string;
  /** Enables vertical scrolling so the sticky header has something to stick to. */
  maxHeight?: string;
  /** Minimum table width before horizontal scrolling kicks in. */
  minWidth?: string;
};

export function DashboardTable({
  children,
  caption,
  className,
  wrapperClassName,
  maxHeight,
  minWidth = "44rem",
}: DashboardTableProps) {
  return (
    <div
      className={cn("w-full min-w-0 overflow-x-auto overscroll-x-contain", wrapperClassName)}
      style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
      // Keyboard users need to be able to scroll a clipped table without a mouse.
      tabIndex={0}
      role={caption ? "region" : undefined}
      aria-label={caption}
    >
      <table
        className={cn("w-full border-collapse text-sm", className)}
        style={{ minWidth }}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function DashboardTableHead({
  children,
  className,
  sticky = true,
}: {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <thead
      className={cn(
        "border-b border-border bg-surface/80 backdrop-blur",
        sticky && "sticky top-0 z-10",
        className,
      )}
    >
      {children}
    </thead>
  );
}

export function DashboardTableBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <tbody className={cn("divide-y divide-border", className)}>{children}</tbody>;
}

export function DashboardTableRow({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <tr className={cn(interactive && "transition-colors hover:bg-white/[0.03]", className)}>
      {children}
    </tr>
  );
}

type DashboardTableHeaderProps = ThHTMLAttributes<HTMLTableCellElement> & {
  align?: Align;
  hideBelow?: Breakpoint;
};

export function DashboardTableHeader({
  children,
  className,
  align = "left",
  hideBelow,
  ...props
}: DashboardTableHeaderProps) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted sm:px-4",
        ALIGN_STYLES[align],
        hideBelow && HIDE_BELOW_STYLES[hideBelow],
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

type DashboardTableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  align?: Align;
  hideBelow?: Breakpoint;
  /** Allows long values to wrap instead of widening the table. */
  wrap?: boolean;
};

export function DashboardTableCell({
  children,
  className,
  align = "left",
  hideBelow,
  wrap = false,
  ...props
}: DashboardTableCellProps) {
  return (
    <td
      className={cn(
        "px-3 py-3.5 align-middle text-sm text-white/90 sm:px-4",
        wrap ? "break-words" : "whitespace-nowrap",
        ALIGN_STYLES[align],
        hideBelow && HIDE_BELOW_STYLES[hideBelow],
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/** Full-width row for the empty case, keeping the header visible. */
export function DashboardTableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-0">
        {children}
      </td>
    </tr>
  );
}
