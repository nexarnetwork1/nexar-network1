"use client";

import Link from "next/link";
import {
  MapPin,
  Globe,
  Wallet,
  Building2,
  User,
  BadgeCheck,
  Edit,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { NetworkProfileData, NetworkProfileView } from "@/modules/atlas-network/types";
import { FollowButton } from "@/components/atlas/app/network/FollowButton";
import { ConnectButton } from "@/components/atlas/app/network/ConnectButton";

type ProfileHeaderProps = {
  profile: NetworkProfileView;
  session: boolean;
  onAuth: () => void;
};

function profileData(profile: NetworkProfileView): NetworkProfileData {
  return (profile.profile_data ?? {}) as NetworkProfileData;
}

export function ProfileHeader({ profile, session, onAuth }: ProfileHeaderProps) {
  const data = profileData(profile);
  const companyName =
    (profile.person?.current_position as { company?: string } | undefined)?.company ??
    profile.company?.industry ??
    null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-gold/20 to-white/5">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-canvas bg-gold/10 overflow-hidden shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-8 w-8 text-gold/50" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{profile.display_name}</h1>
              {profile.verified && <BadgeCheck className="h-5 w-5 text-gold shrink-0" />}
            </div>
            <p className="text-sm text-muted">@{profile.slug}</p>
            {profile.headline && <p className="text-sm mt-1">{profile.headline}</p>}
          </div>

          <div className="flex flex-wrap gap-2 sm:pb-1">
            {profile.is_owner ? (
              <Link
                href="/atlas/profile/edit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-gold/30 text-sm"
              >
                <Edit className="h-4 w-4" />
                Edit profile
              </Link>
            ) : (
              <>
                <FollowButton
                  targetId={profile.id}
                  initialFollowing={profile.is_following}
                  session={session}
                  onAuth={onAuth}
                />
                {profile.subject_type === "user" && (
                  <ConnectButton
                    targetProfileId={profile.id}
                    connectionStatus={profile.connection_status ?? null}
                    pendingConnectionId={profile.pending_connection_id}
                    isIncomingPending={profile.is_incoming_pending}
                    session={session}
                    onAuth={onAuth}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {profile.bio && <p className="mt-4 text-sm text-muted whitespace-pre-wrap">{profile.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
          {data.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {data.location}
            </span>
          )}
          {data.website && (
            <a
              href={data.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gold hover:underline"
            >
              <Globe className="h-4 w-4" />
              Website
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {data.walletAddress && (
            <span className="inline-flex items-center gap-1 font-mono text-xs">
              <Wallet className="h-4 w-4" />
              {data.walletAddress.slice(0, 6)}…{data.walletAddress.slice(-4)}
            </span>
          )}
          {companyName && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {companyName}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span>
            <strong className="text-white">{profile.follower_count}</strong>{" "}
            <span className="text-muted">followers</span>
          </span>
          <span>
            <strong className="text-white">{profile.following_count}</strong>{" "}
            <span className="text-muted">following</span>
          </span>
          <span>
            <strong className="text-white">{profile.connection_count ?? 0}</strong>{" "}
            <span className="text-muted">connections</span>
          </span>
        </div>
      </div>
    </div>
  );
}
