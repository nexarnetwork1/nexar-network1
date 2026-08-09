"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSession } from "next-auth/react";
import { useAtlasAuth } from "@/components/atlas/auth/AtlasAuthProvider";
import {
  ATLAS_APP_NAV_ITEMS,
  ATLAS_APP_BUSINESS_ITEMS,
  ATLAS_APP_WORKSPACE_ITEMS,
} from "@/config/atlas-app-nav";
import { getAtlasAppNavIcon } from "@/components/atlas/app/atlas-app-nav-icons";
import { useAtlasWorkspace, openAtlasAssistant } from "@/components/atlas/app/AtlasWorkspaceContext";

type AtlasLeftSidebarProps = {
  collapsed?: boolean;
};

function NavSection({
  title,
  collapsed,
  children,
}: {
  title: string;
  collapsed?: boolean;
  children: ReactNode;
}) {
  if (collapsed) return <div className="space-y-1">{children}</div>;
  return (
    <div className="space-y-1">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: {
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "nxr-nav-link w-full",
    collapsed && "justify-center px-2",
    active && "nxr-nav-link-active font-medium",
  );
  const content = (
    <>
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="font-medium truncate">{label}</span>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={label} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href!} title={label} className={className}>
      {content}
    </Link>
  );
}

export function AtlasLeftSidebar({ collapsed = false }: AtlasLeftSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openAtlasAuth } = useAtlasAuth();
  const { toggleSidebar } = useAtlasWorkspace();

  const renderItem = (item: (typeof ATLAS_APP_NAV_ITEMS)[number]) => {
    const Icon = getAtlasAppNavIcon(item.icon);
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

    if (item.requiresAuth && !session) {
      return (
        <SidebarLink
          key={item.id}
          label={item.label}
          icon={Icon}
          collapsed={collapsed}
          onClick={() =>
            openAtlasAuth({
              mode: "signin",
              redirect: item.href,
            })
          }
        />
      );
    }

    return (
      <SidebarLink
        key={item.id}
        href={item.href}
        label={item.label}
        icon={Icon}
        active={isActive}
        collapsed={collapsed}
      />
    );
  };

  return (
    <nav className={cn("flex flex-col h-full p-3", collapsed ? "items-center" : "p-4")}>
      <div className={cn("mb-4 space-y-2", collapsed && "w-full")}>
        {session ? (
          <Link
            href="/atlas/create-post"
            title="Create Post"
            className={cn(
              "flex items-center gap-3 rounded-[var(--nxr-radius-lg)] bg-gold border border-gold/30 text-on-gold font-medium hover:bg-gold-hover transition-colors duration-150",
              collapsed ? "justify-center p-3" : "px-4 py-3",
            )}
          >
            <Plus className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Quick Post</span>}
          </Link>
        ) : (
          <button
            type="button"
            title="Create Post"
            onClick={() =>
              openAtlasAuth({
                mode: "signin",
                redirect: "/atlas/create-post",
                message: "Sign in to create a post",
              })
            }
            className={cn(
              "flex w-full items-center gap-3 rounded-[var(--nxr-radius-lg)] bg-gold border border-gold/30 text-on-gold font-medium hover:bg-gold-hover transition-colors duration-150",
              collapsed ? "justify-center p-3" : "px-4 py-3",
            )}
          >
            <Plus className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Quick Post</span>}
          </button>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto">
        <NavSection title="Workspace" collapsed={collapsed}>
          {ATLAS_APP_NAV_ITEMS.map(renderItem)}
        </NavSection>

        {session && (
          <>
            <NavSection title="Commerce" collapsed={collapsed}>
              {ATLAS_APP_WORKSPACE_ITEMS.map(renderItem)}
            </NavSection>

            <NavSection title="Business" collapsed={collapsed}>
              {ATLAS_APP_BUSINESS_ITEMS.map(renderItem)}
            </NavSection>

            <NavSection title="Tools" collapsed={collapsed}>
              <SidebarLink
                label="AI Workspace"
                icon={getAtlasAppNavIcon("sparkles")}
                collapsed={collapsed}
                onClick={openAtlasAssistant}
              />
            </NavSection>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "mt-4 flex items-center gap-2 rounded-[var(--nxr-radius-lg)] border border-border text-muted hover:text-foreground hover:bg-white/[0.04] transition-colors duration-150",
          collapsed ? "w-full justify-center p-2.5" : "w-full px-3 py-2.5 text-xs font-medium",
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </nav>
  );
}
