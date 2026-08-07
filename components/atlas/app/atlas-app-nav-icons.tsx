"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  Grid3X3,
  Home,
  LayoutDashboard,
  MessageSquare,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  User,
  Users,
  Wallet,
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
  wallet: Wallet,
  creditCard: CreditCard,
  package: Package,
  shoppingCart: ShoppingCart,
  sparkles: Sparkles,
};

export function getAtlasAppNavIcon(name: AtlasAppNavIcon): LucideIcon {
  return ATLAS_APP_NAV_ICON_MAP[name];
}
