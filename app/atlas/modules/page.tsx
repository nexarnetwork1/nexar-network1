import { getActiveAtlasModules, getPlannedAtlasModules } from "@/config/atlas-nav";
import { 
  Building2, 
  Store, 
  Wallet, 
  Network, 
  Activity, 
  MessageSquare, 
  Brain, 
  Box, 
  BarChart3,
  Lock,
  Globe,
  Shield,
  Package,
  Users,
  Webhook,
  Coins,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Activity,
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
  settings: Lock,
  nxr: Coins,
  "nexar-hq": Shield,
};

/**
 * ATLAS Modules Page
 *
 * Comprehensive overview of all ATLAS modules.
 * Shows active, foundation, and planned modules.
 */
export default function AtlasModulesPage() {
  const activeModules = getActiveAtlasModules();
  const plannedModules = getPlannedAtlasModules();

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">ATLAS Modules</h1>
        <p className="text-muted max-w-2xl">
          Explore the complete suite of business capabilities available in ATLAS.
          Each module is designed to work seamlessly together under your unified business identity.
        </p>
      </div>

      {/* Active & Foundation Modules */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Available Modules</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeModules.map((module) => {
            const Icon = MODULE_ICONS[module.id];
            return (
              <ModuleCard
                key={module.id}
                icon={Icon}
                label={module.label}
                description={module.description}
                href={module.href}
                status={module.status}
                capabilities={module.capabilities}
              />
            );
          })}
        </div>
      </div>

      {/* Planned Modules */}
      {plannedModules.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Coming Soon</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plannedModules.map((module) => {
              const Icon = MODULE_ICONS[module.id];
              return (
                <ModuleCard
                  key={module.id}
                  icon={Icon}
                  label={module.label}
                  description={module.description}
                  status={module.status}
                  capabilities={module.capabilities}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Architecture Note */}
      <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-gold/5 p-8">
        <h2 className="text-xl font-bold mb-4">Architecture Principles</h2>
        <div className="space-y-3 text-sm text-muted">
          <p><strong className="text-white">Single Source of Truth:</strong> Each data entity is owned by exactly one module. No duplication.</p>
          <p><strong className="text-white">Business-Centric:</strong> Your business identity is the center. Marketplace, Network, and other modules consume business data.</p>
          <p><strong className="text-white">Event-Driven:</strong> All modules communicate through domain events for real-time analytics and notifications.</p>
          <p><strong className="text-white">Permission-Based:</strong> Unified RBAC system across all modules with business-specific roles.</p>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  icon: Icon,
  label,
  description,
  href,
  status,
  capabilities,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  href?: string;
  status: string;
  capabilities: readonly string[];
}) {
  const statusColors = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    foundation: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    planned: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  const content = (
    <div className="p-6 rounded-xl border border-white/10 bg-white/5 hover:border-gold/30 hover:bg-white/10 transition-all group">
      <div className="flex items-start gap-4 mb-4">
        {Icon && (
          <div className="h-12 w-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6 text-gold" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg group-hover:text-gold transition-colors">{label}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[status as keyof typeof statusColors]}`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-muted line-clamp-2">{description}</p>
        </div>
      </div>
      
      {capabilities.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Capabilities</p>
          <div className="flex flex-wrap gap-1.5">
            {capabilities.slice(0, 4).map((capability) => (
              <span
                key={capability}
                className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-muted"
              >
                {capability}
              </span>
            ))}
            {capabilities.length > 4 && (
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-muted">
                +{capabilities.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <div className="opacity-70">{content}</div>;
}
