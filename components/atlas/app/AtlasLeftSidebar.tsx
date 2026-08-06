"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building2,
  Store,
  Briefcase,
  MessageSquare,
  Bell,
  Users,
  Calendar,
  LayoutDashboard,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";

const navItems = [
  { icon: Home, label: "Home Feed", href: "/atlas" },
  { icon: Building2, label: "My Company", href: "/atlas/business", requiresAuth: true },
  { icon: Store, label: "Marketplace", href: "/atlas/marketplace" },
  { icon: Briefcase, label: "Jobs", href: "/atlas/jobs" },
  { icon: MessageSquare, label: "Messages", href: "/atlas/messages" },
  { icon: Bell, label: "Notifications", href: "/atlas/notifications", requiresAuth: true },
  { icon: Users, label: "Network", href: "/atlas/network" },
  { icon: Calendar, label: "Events", href: "/atlas/events" },
];

const businessItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/business" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/business/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/business/profile" },
];

export function AtlasLeftSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();

  return (
    <nav className="p-4 space-y-6">
      {session ? (
        <Link
          href="/atlas/create-post"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gold border border-gold/30 text-background font-medium hover:bg-gold-secondary transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Create Post</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={() =>
            openCommerceAuth({
              mode: "signin",
              redirect: "/atlas/create-post",
              message: "Sign in to create a post",
            })
          }
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl bg-gold border border-gold/30 text-background font-medium hover:bg-gold-secondary transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Create Post</span>
        </button>
      )}

      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.requiresAuth && !session) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() =>
                  openCommerceAuth({
                    mode: "signin",
                    redirect: item.href,
                  })
                }
                className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-muted hover:bg-white/5 hover:text-white transition-colors"
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive ? "bg-white/10 text-white" : "text-muted hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {session && (
        <div className="space-y-3">
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Business</p>
          </div>
          <div className="space-y-1">
            {businessItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive ? "bg-white/10 text-white" : "text-muted hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
