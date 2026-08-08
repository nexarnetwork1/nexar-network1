"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { AtlasLeftSidebar } from "./AtlasLeftSidebar";
import { AtlasRightSidebar } from "./AtlasRightSidebar";
import { AtlasMobileNav } from "./AtlasMobileNav";
import { AtlasAppBar } from "./AtlasAppBar";
import { AtlasWorkspaceProvider, useAtlasWorkspace } from "./AtlasWorkspaceContext";
import { AtlasRealtimeProvider } from "@/components/realtime/AtlasRealtimeProvider";
import type { NetworkEvent } from "@/modules/atlas-network/types";

type AtlasAppShellProps = {
  children: ReactNode;
  userId?: string;
  unreadNotificationCount?: number;
  trendingBusinesses?: Array<{
    id: string;
    name: string;
    slug: string;
    networkSlug?: string;
    logo_url?: string | null;
    industry?: string | null;
  }>;
  upcomingEvents?: NetworkEvent[];
  suggestedProfiles?: Array<{
    id: string;
    slug: string;
    display_name: string;
    avatar_url?: string | null;
    verified?: boolean;
    subject_type?: string;
  }>;
  suggestedCompanies?: Array<{
    id: string;
    slug: string;
    display_name: string;
    avatar_url?: string | null;
    verified?: boolean;
  }>;
  hideRightSidebar?: boolean;
};

function AtlasAppShellInner({
  children,
  userId,
  unreadNotificationCount = 0,
  trendingBusinesses = [],
  upcomingEvents = [],
  suggestedProfiles = [],
  suggestedCompanies = [],
  hideRightSidebar = false,
}: AtlasAppShellProps) {
  const { sidebarCollapsed } = useAtlasWorkspace();
  const leftWidth = sidebarCollapsed ? "lg:ml-[4.5rem]" : "lg:ml-64";
  const rightMargin = hideRightSidebar ? "" : "xl:mr-80";

  return (
    <div className="min-h-screen bg-canvas text-foreground pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <AtlasAppBar unreadNotificationCount={unreadNotificationCount} />

      <div className="flex border-t border-border/50">
        <aside
          className={cn(
            "hidden lg:block shrink-0 fixed left-0 z-10 border-r border-border overflow-y-auto bg-chrome transition-[width] duration-200 ease-out",
            "top-[calc(var(--nxr-nav-height)+var(--nxr-ticker-height)+var(--atlas-app-bar-height))] bottom-0",
            sidebarCollapsed ? "w-[4.5rem]" : "w-64",
          )}
        >
          <AtlasLeftSidebar collapsed={sidebarCollapsed} />
        </aside>

        <main
          className={cn(
            "atlas-workspace-main flex-1 w-full min-h-[calc(100vh-var(--nxr-nav-height)-var(--nxr-ticker-height)-var(--atlas-app-bar-height))]",
            leftWidth,
            rightMargin,
          )}
        >
          {children}
        </main>

        {!hideRightSidebar && (
          <aside
            className={cn(
              "hidden xl:block w-80 shrink-0 fixed right-0 z-10 border-l border-border overflow-y-auto bg-chrome",
              "top-[calc(var(--nxr-nav-height)+var(--nxr-ticker-height)+var(--atlas-app-bar-height))] bottom-0",
            )}
          >
            <AtlasRightSidebar
              trendingBusinesses={trendingBusinesses}
              suggestedProfiles={suggestedProfiles}
              suggestedCompanies={suggestedCompanies}
              upcomingEvents={upcomingEvents}
            />
          </aside>
        )}
      </div>

      <AtlasMobileNav />
    </div>
  );
}

export function AtlasAppShell(props: AtlasAppShellProps) {
  return (
    <AtlasWorkspaceProvider>
      <AtlasRealtimeProvider userId={props.userId}>
        <AtlasAppShellInner {...props} />
      </AtlasRealtimeProvider>
    </AtlasWorkspaceProvider>
  );
}
