"use client";

import { Building2, Users, Store, Package, BarChart3, Settings, Plus, TrendingUp, DollarSign, FileText, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useAtlasAuth } from "@/components/atlas/auth/AtlasAuthProvider";

interface Business {
  id: string;
  name: string;
  logo_url?: string;
  slug: string;
  tagline?: string;
  status: string;
}

interface BusinessDashboardProps {
  businesses: Business[];
}

export function BusinessDashboard({ businesses }: BusinessDashboardProps) {
  const { data: session } = useSession();
  const { openAtlasAuth } = useAtlasAuth();

  const handleInteraction = () => {
    if (!session) {
      openAtlasAuth({
        mode: "signin",
        redirect: "/atlas/business",
      });
    }
  };

  const businessStats = [
    { icon: DollarSign, label: "Revenue", value: "$0", change: "+0%" },
    { icon: Package, label: "Products", value: businesses.length.toString(), change: null },
    { icon: Users, label: "Team", value: "0", change: null },
    { icon: Store, label: "Orders", value: "0", change: null },
  ];

  const businessActions = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/business", requiresAuth: true },
    { icon: Users, label: "Team", href: "/dashboard/business/team", requiresAuth: true },
    { icon: Store, label: "Stores", href: "/dashboard/business/stores", requiresAuth: true },
    { icon: Package, label: "Products", href: "/dashboard/business/products", requiresAuth: true },
    { icon: FileText, label: "Orders", href: "/dashboard/business/orders", requiresAuth: true },
    { icon: BarChart3, label: "Analytics", href: "/dashboard/business/analytics", requiresAuth: true },
    { icon: DollarSign, label: "Finance", href: "/dashboard/business/finance", requiresAuth: true },
    { icon: Settings, label: "Settings", href: "/dashboard/business/settings", requiresAuth: true },
  ];

  return (
    <div className="py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Business</h1>
          <p className="text-muted">Manage your company operations</p>
        </div>
        <Link
          href="/dashboard/business/onboarding"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold border border-gold/30 text-background font-medium hover:bg-gold-secondary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Business
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {businessStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-4 rounded-xl border border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-5 w-5 text-gold" />
                {stat.change && (
                  <span className="text-xs text-success">{stat.change}</span>
                )}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Businesses List */}
      {businesses.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Businesses</h2>
          <div className="space-y-3">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href="/dashboard/business"
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-gold/30 hover:bg-white/10 transition-all"
              >
                {business.logo_url ? (
                  <img src={business.logo_url} alt={business.name} className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-gold/30" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{business.name}</h3>
                  <p className="text-sm text-muted">{business.tagline || "No tagline"}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs capitalize">
                  {business.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-white/10 bg-white/5 text-center">
          <Building2 className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-muted mb-2">No businesses yet</p>
          <p className="text-sm text-muted mb-4">Create your first business to get started</p>
          <Link
            href="/dashboard/business/onboarding"
            className="inline-flex px-6 py-3 rounded-lg bg-gold border border-gold/30 text-background font-medium hover:bg-gold-secondary transition-colors"
          >
            Create Business
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {businessActions.map((action) => {
            const Icon = action.icon;
            const requiresAuth = action.requiresAuth && !session;

            if (requiresAuth) return null;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-gold/30 hover:bg-white/10 transition-all"
              >
                <Icon className="h-6 w-6 text-gold" />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
