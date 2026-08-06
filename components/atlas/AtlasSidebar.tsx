"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Building2, 
  Store, 
  Wallet, 
  Network, 
  Activity, 
  MessageSquare, 
  Brain, 
  Box, 
  BarChart3, 
  Users, 
  Package, 
  Webhook, 
  Settings,
  Coins,
  LayoutDashboard
} from "lucide-react";
import { getActiveAtlasModules } from "@/config/atlas-nav";
import { cn } from "@/lib/utils/cn";

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  business: Building2,
  marketplace: Store,
  wallet: Wallet,
  network: Network,
  feed: Activity,
  connect: MessageSquare,
  ai: Brain,
  apps: Box,
  analytics: BarChart3,
  crm: Users,
  inventory: Package,
  api: Webhook,
  settings: Settings,
  nxr: Coins,
  "nexar-hq": LayoutDashboard,
};

export function AtlasSidebar() {
  const pathname = usePathname();
  const modules = getActiveAtlasModules();

  return (
    <aside className="hidden lg:block w-64 border-r border-white/10 bg-[#0a0a0b]/50 p-4 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
      <div className="space-y-6">
        {/* Overview Section */}
        <div>
          <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
            Platform
          </h3>
          <nav className="space-y-1">
            <SidebarLink
              href="/atlas"
              icon={Home}
              label="Overview"
              active={pathname === "/atlas"}
            />
            <SidebarLink
              href="/atlas/modules"
              icon={LayoutDashboard}
              label="All Modules"
              active={pathname === "/atlas/modules"}
            />
          </nav>
        </div>

        {/* Active Modules */}
        <div>
          <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
            Modules
          </h3>
          <nav className="space-y-1">
            {modules.map((module) => {
              const Icon = MODULE_ICONS[module.id];
              if (!Icon || !module.href) return null;

              return (
                <SidebarLink
                  key={module.id}
                  href={module.href}
                  icon={Icon}
                  label={module.label}
                  active={pathname === module.href}
                  description={module.description}
                />
              );
            })}
          </nav>
        </div>

        {/* Resources */}
        <div>
          <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
            Resources
          </h3>
          <nav className="space-y-1">
            <SidebarLink
              href="/atlas/docs"
              icon={BookIcon}
              label="Documentation"
              active={pathname === "/atlas/docs"}
            />
            <SidebarLink
              href="/atlas/pricing"
              icon={TagIcon}
              label="Pricing"
              active={pathname === "/atlas/pricing"}
            />
          </nav>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors group",
        active
          ? "bg-gold/10 text-gold"
          : "text-white/70 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", active ? "text-gold" : "text-white/50 group-hover:text-white")} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{description}</p>
        )}
      </div>
    </Link>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );
}
