"use client";

import type { ReactNode } from "react";
import { AtlasLeftSidebar } from "./AtlasLeftSidebar";
import { AtlasRightSidebar } from "./AtlasRightSidebar";
import { AtlasMobileNav } from "./AtlasMobileNav";
import { AtlasAppBar } from "./AtlasAppBar";
import type { NetworkEvent } from "@/modules/atlas-network/types";

type AtlasAppShellProps = {
  children: ReactNode;
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

export function AtlasAppShell({
  children,
  trendingBusinesses = [],
  upcomingEvents = [],
  suggestedProfiles = [],
  suggestedCompanies = [],
  hideRightSidebar = false,
}: AtlasAppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <AtlasAppBar />

      <div className="flex">
        <aside className="hidden lg:block w-64 shrink-0 fixed left-0 top-[calc(var(--nxr-nav-height)+var(--nxr-ticker-height)+var(--atlas-app-bar-height))] bottom-0 border-r border-border overflow-y-auto z-10 bg-background">
          <AtlasLeftSidebar />
        </aside>

        <main
          className={`flex-1 min-h-[calc(100vh-var(--nxr-nav-height)-var(--nxr-ticker-height)-var(--atlas-app-bar-height))] w-full ${
            hideRightSidebar ? "lg:ml-64" : "lg:ml-64 xl:mr-80"
          }`}
        >
          {children}
        </main>

        {!hideRightSidebar && (
          <aside className="hidden xl:block w-80 shrink-0 fixed right-0 top-[calc(var(--nxr-nav-height)+var(--nxr-ticker-height)+var(--atlas-app-bar-height))] bottom-0 border-l border-border overflow-y-auto z-10 bg-background">
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
