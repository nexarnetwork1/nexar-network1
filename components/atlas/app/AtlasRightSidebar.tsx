"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { Building2, Users, Calendar, Flame, MapPin, Activity } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import type { NetworkEvent } from "@/modules/atlas-network/types";
import { FollowButton } from "@/components/atlas/app/network/FollowButton";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface AtlasRightSidebarProps {
  trendingBusinesses: Array<{
    id: string;
    name: string;
    slug: string;
    networkSlug?: string;
    logo_url?: string | null;
    industry?: string | null;
  }>;
  suggestedProfiles: Array<{
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
  upcomingEvents?: NetworkEvent[];
}

function Panel({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("nxr-card p-4", className)}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-gold shrink-0" />
          <h3 className="text-sm font-semibold truncate">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AtlasRightSidebar({
  trendingBusinesses,
  suggestedProfiles,
  suggestedCompanies = [],
  upcomingEvents = [],
}: AtlasRightSidebarProps) {
  const { data: session } = useSession();
  const { openCommerceAuth } = useCommerceAuth();

  const onAuth = () => {
    openCommerceAuth({
      mode: "signin",
      redirect: "/atlas",
      message: "Sign in to follow on ATLAS",
    });
  };

  return (
    <aside className="p-4 space-y-4">
      <div className="flex items-center gap-2 px-1 pb-1">
        <Activity className="h-4 w-4 text-gold" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Activity
        </h2>
      </div>

      {session && (
        <Panel title="Your Company" icon={Building2}>
          <Link
            href="/dashboard/business"
            className="flex items-center gap-3 rounded-[var(--nxr-radius-lg)] p-2 -m-2 hover:bg-white/[0.04] transition-colors duration-150"
          >
            <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Business Dashboard</p>
              <p className="text-xs text-muted">Commerce · Analytics · Settings</p>
            </div>
          </Link>
        </Panel>
      )}

      <Panel title="Trending Companies" icon={Flame}>
        <div className="space-y-1">
          {trendingBusinesses.length > 0 ? (
            trendingBusinesses.map((business) => (
              <Link
                key={business.id}
                href={`/atlas/network/${business.networkSlug ?? `${business.slug}-network`}`}
                className="flex items-center gap-3 p-2 rounded-[var(--nxr-radius-lg)] hover:bg-white/[0.04] transition-colors duration-150"
              >
                {business.logo_url ? (
                  <img src={business.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-gold/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{business.name}</p>
                  <p className="text-xs text-muted">{business.industry || "Business"}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted text-center py-3">No trending companies yet</p>
          )}
        </div>
      </Panel>

      {suggestedCompanies.length > 0 && (
        <Panel title="Suggested Connections" icon={Building2}>
          <div className="space-y-1">
            {suggestedCompanies.map((company) => (
              <div key={company.id} className="flex items-center gap-3 p-2 rounded-[var(--nxr-radius-lg)]">
                <Link href={`/atlas/network/${company.slug}`} className="shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-gold/10 overflow-hidden flex items-center justify-center">
                    {company.avatar_url ? (
                      <img src={company.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-gold/40" />
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/atlas/network/${company.slug}`}
                    className="text-sm font-medium truncate block hover:text-gold transition-colors duration-150"
                  >
                    {company.display_name}
                  </Link>
                </div>
                <FollowButton targetId={company.id} session={!!session} onAuth={onAuth} size="sm" />
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="People to Follow" icon={Users}>
        {suggestedProfiles.length > 0 ? (
          <div className="space-y-1">
            {suggestedProfiles.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 p-2 rounded-[var(--nxr-radius-lg)]">
                <Link href={`/atlas/network/${profile.slug}`} className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-5 w-5 text-gold/40" />
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/atlas/network/${profile.slug}`}
                    className="text-sm font-medium truncate block hover:text-gold transition-colors duration-150"
                  >
                    {profile.display_name}
                  </Link>
                </div>
                <FollowButton targetId={profile.id} session={!!session} onAuth={onAuth} size="sm" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted text-center py-3">No suggestions yet</p>
        )}
      </Panel>

      <Panel
        title="Upcoming Events"
        icon={Calendar}
        action={
          <Link href="/atlas/events" className="text-xs text-gold hover:underline shrink-0">
            View all
          </Link>
        }
      >
        {upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                href={`/atlas/events/${event.id}`}
                className="block p-3 rounded-[var(--nxr-radius-lg)] border border-border bg-white/[0.02] hover:border-gold/20 transition-colors duration-150"
              >
                <p className="text-sm font-medium line-clamp-1">{event.title}</p>
                <p className="text-xs text-muted mt-1">
                  {format(new Date(event.starts_at), "MMM d, yyyy · h:mm a")}
                </p>
                {event.location && (
                  <p className="text-xs text-muted flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {event.is_online ? "Online" : event.location}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted">No upcoming events</p>
            <Link href="/atlas/events" className="inline-block mt-2 text-sm text-gold hover:underline">
              Browse Events
            </Link>
          </div>
        )}
      </Panel>
    </aside>
  );
}
