import type { Metadata } from "next";
import { AtlasAppShell } from "@/components/atlas/app/AtlasAppShell";
import { privateAreaMetadata } from "@/lib/constants/seo";
import { auth } from "@/auth";
import { getActiveBusinesses } from "@/modules/business-hub/repository";
import { getUpcomingEvents, getSuggestedProfiles, getSuggestedCompanies, getPersonProfileByUserId, getNetworkProfileByBusinessId } from "@/modules/atlas-network/repository";
import { getUnreadNotificationCount } from "@/modules/notifications/repository";

export const metadata: Metadata = {
  ...privateAreaMetadata,
  title: "ATLAS",
  description: "ATLAS — Business Operating System by Nexar Network",
};

export default async function AtlasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let excludeProfileId: string | undefined;
  if (session?.user?.id) {
    const person = await getPersonProfileByUserId(session.user.id);
    excludeProfileId = person?.network_profile_id;
  }

  const [businesses, events, suggested, suggestedCompanies, unreadCount] = await Promise.all([
    getActiveBusinesses({ limit: 5 }),
    getUpcomingEvents({ limit: 5 }),
    getSuggestedProfiles(excludeProfileId, 5),
    getSuggestedCompanies(5),
    session?.user?.id ? getUnreadNotificationCount(session.user.id) : Promise.resolve(0),
  ]);

  const trendingWithNetwork = await Promise.all(
    businesses.map(async (b) => {
      const networkProfile = await getNetworkProfileByBusinessId(b.id);
      return {
        id: b.id,
        name: b.display_name,
        slug: b.slug,
        networkSlug: networkProfile?.slug ?? `${b.slug}-network`,
        logo_url: b.logo_url ?? networkProfile?.avatar_url,
        industry: b.business_type,
      };
    }),
  );

  const trendingBusinesses = trendingWithNetwork;

  const suggestedProfiles = suggested.map((p) => ({
    id: p.id,
    slug: p.slug,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    verified: p.verified,
    subject_type: p.subject_type,
  }));

  const suggestedCompaniesMapped = suggestedCompanies.map((p) => ({
    id: p.id,
    slug: p.slug,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    verified: p.verified,
  }));

  return (
    <AtlasAppShell
      userId={session?.user?.id}
      unreadNotificationCount={unreadCount}
      trendingBusinesses={trendingBusinesses}
      upcomingEvents={events}
      suggestedProfiles={suggestedProfiles}
      suggestedCompanies={suggestedCompaniesMapped}
    >
      {children}
    </AtlasAppShell>
  );
}
