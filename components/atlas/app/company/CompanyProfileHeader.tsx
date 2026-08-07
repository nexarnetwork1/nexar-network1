"use client";

import Link from "next/link";
import {
  MapPin,
  Globe,
  Wallet,
  Building2,
  BadgeCheck,
  Edit,
  ExternalLink,
  Mail,
  Phone,
  Store,
  Users,
} from "lucide-react";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { NetworkProfileData, NetworkProfileView } from "@/modules/atlas-network/types";
import { FollowButton } from "@/components/atlas/app/network/FollowButton";

type CompanyProfileHeaderProps = {
  profile: NetworkProfileView;
  session: boolean;
  onAuth: () => void;
  employeeCount?: number;
  storefrontSlug?: string | null;
  isHiring?: boolean;
  openJobsCount?: number;
  upcomingEventsCount?: number;
};

function profileData(profile: NetworkProfileView): NetworkProfileData {
  return (profile.profile_data ?? {}) as NetworkProfileData;
}

export function CompanyProfileHeader({
  profile,
  session,
  onAuth,
  employeeCount = 0,
  storefrontSlug,
  isHiring = false,
  openJobsCount = 0,
  upcomingEventsCount = 0,
}: CompanyProfileHeaderProps) {
  const data = profileData(profile);
  const business = profile.business;
  const company = profile.company;
  const bizProfile = business?.profile ?? {};

  const industry = company?.industry ?? business?.business_type ?? null;
  const location = company?.location ?? (bizProfile.address as string | undefined) ?? data.location;
  const website = company?.website ?? (bizProfile.website as string | undefined) ?? data.website;
  const email = (bizProfile.email as string | undefined) ?? null;
  const phone = (bizProfile.phone as string | undefined) ?? null;
  const walletAddress = data.walletAddress ?? null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-gold/20 to-white/5">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl border-4 border-canvas bg-gold/10 overflow-hidden shrink-0">
            {profile.avatar_url || business?.logo_url ? (
              <img
                src={profile.avatar_url ?? business?.logo_url ?? ""}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-gold/50" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{profile.display_name}</h1>
              {(profile.verified || business?.verification_state === "verified") && (
                <BadgeCheck className="h-5 w-5 text-gold shrink-0" />
              )}
              {isHiring && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  We&apos;re hiring
                </span>
              )}
            </div>
            <p className="text-sm text-muted">@{profile.slug}</p>
            {industry && <p className="text-sm text-gold/90 mt-1">{industry}</p>}
            {profile.headline && <p className="text-sm mt-1">{profile.headline}</p>}
          </div>

          <div className="flex flex-wrap gap-2 sm:pb-1">
            {profile.is_owner ? (
              <Link
                href="/dashboard/business/profile"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-gold/30 text-sm"
              >
                <Edit className="h-4 w-4" />
                Manage company
              </Link>
            ) : (
              <FollowButton
                targetId={profile.id}
                initialFollowing={profile.is_following}
                session={session}
                onAuth={onAuth}
              />
            )}
            {storefrontSlug && (
              <Link
                href={MARKETPLACE_ROUTES.store(storefrontSlug)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 text-gold text-sm hover:bg-gold/10"
              >
                <Store className="h-4 w-4" />
                Store
              </Link>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm text-muted whitespace-pre-wrap">{profile.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {location}
            </span>
          )}
          {website && (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gold hover:underline"
            >
              <Globe className="h-4 w-4" />
              Website
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="inline-flex items-center gap-1 hover:text-white">
              <Mail className="h-4 w-4" />
              {email}
            </a>
          )}
          {phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {phone}
            </span>
          )}
          {walletAddress && (
            <span className="inline-flex items-center gap-1 font-mono text-xs">
              <Wallet className="h-4 w-4" />
              {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span>
            <strong className="text-white">{profile.follower_count}</strong>{" "}
            <span className="text-muted">followers</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-muted" />
            <strong className="text-white">{employeeCount}</strong>{" "}
            <span className="text-muted">employees</span>
          </span>
          {profile.analytics && (
            <>
              <span>
                <strong className="text-white">{profile.analytics.products}</strong>{" "}
                <span className="text-muted">products</span>
              </span>
              <span>
                <strong className="text-white">{profile.analytics.posts}</strong>{" "}
                <span className="text-muted">posts</span>
              </span>
            </>
          )}
          {openJobsCount > 0 && (
            <span>
              <strong className="text-white">{openJobsCount}</strong>{" "}
              <span className="text-muted">open jobs</span>
            </span>
          )}
          {upcomingEventsCount > 0 && (
            <span>
              <strong className="text-white">{upcomingEventsCount}</strong>{" "}
              <span className="text-muted">upcoming events</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
