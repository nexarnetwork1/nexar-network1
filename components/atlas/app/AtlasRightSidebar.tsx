"use client";

import Link from "next/link";
import { Building2, Users, Calendar, Flame, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import type { NetworkEvent } from "@/modules/atlas-network/types";
import { FollowButton } from "@/components/atlas/app/network/FollowButton";
import { format } from "date-fns";

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
    <aside className="p-4 space-y-6">
      {session && (
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <Link href="/dashboard/business" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">My Company</p>
              <p className="text-xs text-muted">Business dashboard</p>
            </div>
          </Link>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-semibold">Trending Companies</h3>
        </div>
        <div className="space-y-2">
          {trendingBusinesses.length > 0 ? (
            trendingBusinesses.map((business) => (
              <Link
                key={business.id}
                href={`/atlas/network/${business.networkSlug ?? `${business.slug}-network`}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {business.logo_url ? (
                  <img src={business.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-gold/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{business.name}</p>
                  <p className="text-xs text-muted">{business.industry || "Business"}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted text-center py-4">No trending companies yet</p>
          )}
        </div>
      </div>

      {suggestedCompanies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-semibold">Suggested Companies</h3>
          </div>
          <div className="space-y-2">
            {suggestedCompanies.map((company) => (
              <div key={company.id} className="flex items-center gap-3 p-2 rounded-lg">
                <Link href={`/atlas/network/${company.slug}`} className="shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-gold/10 overflow-hidden flex items-center justify-center">
                    {company.avatar_url ? (
                      <img src={company.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-gold/30" />
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/atlas/network/${company.slug}`}
                    className="text-sm font-medium truncate block hover:text-gold"
                  >
                    {company.display_name}
                  </Link>
                </div>
                <FollowButton
                  targetId={company.id}
                  session={!!session}
                  onAuth={onAuth}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-semibold">People to Follow</h3>
        </div>
        {suggestedProfiles.length > 0 ? (
          <div className="space-y-2">
            {suggestedProfiles.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 p-2 rounded-lg">
                <Link href={`/atlas/network/${profile.slug}`} className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-5 w-5 text-gold/30" />
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/atlas/network/${profile.slug}`}
                    className="text-sm font-medium truncate block hover:text-gold"
                  >
                    {profile.display_name}
                  </Link>
                </div>
                <FollowButton
                  targetId={profile.id}
                  session={!!session}
                  onAuth={onAuth}
                  size="sm"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted text-center py-4">No suggestions yet</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-semibold">Upcoming Events</h3>
          </div>
          <Link href="/atlas/events" className="text-xs text-gold hover:underline">
            View all
          </Link>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                href={`/atlas/events/${event.id}`}
                className="block p-3 rounded-xl border border-white/10 bg-white/5 hover:border-gold/20 transition-colors"
              >
                <p className="text-sm font-medium line-clamp-1">{event.title}</p>
                <p className="text-xs text-muted mt-1">
                  {format(new Date(event.starts_at), "MMM d, yyyy · h:mm a")}
                </p>
                {event.location && (
                  <p className="text-xs text-muted flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {event.is_online ? "Online" : event.location}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
            <p className="text-sm text-muted">No upcoming events</p>
            <Link href="/atlas/events" className="inline-block mt-2 text-sm text-gold hover:underline">
              Browse Events
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
