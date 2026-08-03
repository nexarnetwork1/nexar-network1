"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { flattenNav, type DashboardNavSection } from "@/config/dashboard-nav";

type DashboardBreadcrumbProps = {
  sections: DashboardNavSection[];
  rootLabel: string;
  rootHref: string;
  className?: string;
};

type Crumb = { label: string; href?: string };

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Turns a URL segment into a readable label, collapsing opaque ids to "Details". */
function humanizeSegment(segment: string): string {
  const decoded = decodeURIComponent(segment);
  if (UUID_LIKE.test(decoded) || /^\d+$/.test(decoded) || decoded.length > 24) {
    return "Details";
  }
  return decoded.replace(/[-_]/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

export function buildCrumbs(
  pathname: string,
  sections: DashboardNavSection[],
  root: { label: string; href: string },
): Crumb[] {
  const crumbs: Crumb[] = [{ label: root.label, href: root.href }];

  if (pathname === root.href) return crumbs;

  // Longest matching nav href wins so nested routes resolve to their parent item.
  const match = flattenNav(sections)
    .filter((item) => item.href !== root.href)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (match) {
    crumbs.push({ label: match.label, href: match.href });

    const rest = pathname.slice(match.href.length).split("/").filter(Boolean);
    for (const segment of rest) {
      crumbs.push({ label: humanizeSegment(segment) });
    }
    return crumbs;
  }

  const rest = pathname.slice(root.href.length).split("/").filter(Boolean);
  for (const segment of rest) {
    crumbs.push({ label: humanizeSegment(segment) });
  }

  return crumbs;
}

export function DashboardBreadcrumb({
  sections,
  rootLabel,
  rootHref,
  className,
}: DashboardBreadcrumbProps) {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname, sections, { label: rootLabel, href: rootHref });

  if (crumbs.length <= 1) {
    return (
      <p className={cn("truncate font-heading text-sm font-medium text-white", className)}>
        {rootLabel}
      </p>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted/60" aria-hidden />
              )}

              {isLast || !crumb.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "truncate",
                    isLast ? "font-medium text-white" : "text-muted",
                    // Intermediate crumbs give way to the current page on narrow screens.
                    !isLast && "hidden sm:inline",
                  )}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hidden truncate text-muted transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 sm:inline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
