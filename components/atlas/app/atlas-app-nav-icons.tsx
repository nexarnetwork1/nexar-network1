"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Grid3X3,
  Home,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Store,
  User,
  Users,
} from "lucide-react";
import type { AtlasAppNavIcon } from "@/config/atlas-app-nav";

export const ATLAS_APP_NAV_ICON_MAP: Record<AtlasAppNavIcon, LucideIcon> = {
  home: Home,
  building2: Building2,
  store: Store,
  briefcase: Briefcase,
  calendar: Calendar,
  messageSquare: MessageSquare,
  bell: Bell,
  users: Users,
  search: Search,
  layoutDashboard: LayoutDashboard,
  barChart3: BarChart3,
  settings: Settings,
  plus: Plus,
  user: User,
  grid: Grid3X3,
};

export function getAtlasAppNavIcon(name: AtlasAppNavIcon): LucideIcon {
  return ATLAS_APP_NAV_ICON_MAP[name];
}
