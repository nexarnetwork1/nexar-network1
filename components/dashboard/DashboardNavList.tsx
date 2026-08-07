"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { DashboardNavItem, DashboardNavSection } from "@/config/dashboard-nav";
import { resolveDashboardIcon } from "./icons";

type DashboardNavListProps = {
  sections: DashboardNavSection[];
  /** Icon-only rail used by the tablet-collapsed sidebar. */
  collapsed?: boolean;
  /** Closes the mobile drawer once a destination is chosen. */
  onNavigate?: () => void;
  className?: string;
};

export function isNavItemActive(item: DashboardNavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function DashboardNavList({
  sections,
  collapsed = false,
  onNavigate,
  className,
}: DashboardNavListProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-1 p-3", className)} aria-label="Dashboard navigation">
      {sections.map((section, sectionIndex) => (
        <div key={section.title ?? `section-${sectionIndex}`} className="pb-1">
          {section.title && !collapsed && (
            <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {section.title}
            </p>
          )}
          {section.title && collapsed && sectionIndex > 0 && (
            <div className="mx-3 my-3 border-t border-border" aria-hidden />
          )}

          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = resolveDashboardIcon(item.icon);
              const active = isNavItemActive(item, pathname);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "nxr-nav-link w-full min-h-11",
                      collapsed && "justify-center px-0",
                      active && "nxr-nav-link-active font-medium",
                    )}
                  >
                    {Icon && (
                      <Icon
                        className={cn("h-[18px] w-[18px] shrink-0", active && "text-gold")}
                        aria-hidden
                      />
                    )}

                    {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}

                    {!collapsed && item.badge ? (
                      <span className="shrink-0 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-on-gold">
                        {item.badge}
                      </span>
                    ) : null}

                    {collapsed && item.badge ? (
                      <span className="sr-only">{item.badge} pending</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
